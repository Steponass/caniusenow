import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import NotificationAPI from "notificationapi-node-server-sdk";
import type { NormalizedFeature, FeatureIndex } from "./types.js";

// ============================================================================
// TYPES
// ============================================================================

interface FeatureChange {
  featureId: string;
  changes: {
    usage?: {
      old: number;
      new: number;
      delta: number;
    };
    support?: Array<{
      browser: string;
      old: "y" | "a" | "n" | "p";
      new: "y" | "a" | "n" | "p";
    }>;
    baseline?: {
      old: "high" | "low" | false;
      new: "high" | "low" | false;
    };
  };
}

interface ChangeReport {
  timestamp: string;
  previousCommit: string;
  currentCommit: string;
  totalChanges: number;
  changes: FeatureChange[];
}

interface UserFeatureTracking {
  id: string;
  user_id: string;
  user_email: string;
  feature_id: string;
  feature_title: string;
  triggers: Trigger[];
  status: string;
}

type Trigger =
  | {
      type: "usage_threshold";
      usageType: "full" | "partial" | "total" | "combined";
      threshold: number;
    }
  | {
      type: "browser_support";
      browser: string;
      targetStatus: "y" | "a";
    }
  | {
      type: "baseline_status";
      targetStatus: "high" | "low";
    };

// Cache for loaded features to avoid repeated file reads
const featureCache = new Map<string, NormalizedFeature>();

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log("=".repeat(70));
  console.log("SEND NOTIFICATIONS FOR CHANGED FEATURES");
  console.log("=".repeat(70));

  // Validate environment variables
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
  }

  if (
    !process.env.NOTIFICATIONAPI_CLIENT_ID ||
    !process.env.NOTIFICATIONAPI_CLIENT_SECRET
  ) {
    console.error("❌ Missing NotificationAPI credentials");
    process.exit(1);
  }

  // Initialize clients
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  NotificationAPI.init(
    process.env.NOTIFICATIONAPI_CLIENT_ID,
    process.env.NOTIFICATIONAPI_CLIENT_SECRET
  );

  // Load change report
  console.log("\n📂 Loading change report...");
  const reportPath = "./data/change-report.json";

  if (!fs.existsSync(reportPath)) {
    console.log("  ⚠️  No change report found. Run detect-changes first.");
    return;
  }

  const report: ChangeReport = JSON.parse(
    fs.readFileSync(reportPath, "utf8")
  );

  console.log(`  ✅ Loaded report with ${report.totalChanges} changes`);

  if (report.totalChanges === 0) {
    console.log("\n✅ No changes detected, no notifications needed");
    return;
  }

  // Load feature index for feature titles
  console.log("\n📂 Loading feature index...");
  const featureIndex: FeatureIndex[] = JSON.parse(
    fs.readFileSync("./public/data/index.json", "utf8")
  );
  const featureMap = new Map(featureIndex.map((f) => [f.id, f]));

  let notificationsSent = 0;
  let trackingsProcessed = 0;

  // Process each changed feature
  console.log("\n🔍 Processing changed features...");

  for (const change of report.changes) {
    const indexFeature = featureMap.get(change.featureId);

    if (!indexFeature) {
      console.log(`  ⚠️  Feature ${change.featureId} not found in index`);
      continue;
    }

    // Query users tracking this feature
    const { data: trackings, error } = await supabase
      .from("user_feature_tracking")
      .select("id, user_id, user_email, feature_id, feature_title, triggers, status")
      .eq("feature_id", change.featureId)
      .eq("status", "active");

    if (error) {
      console.error(`  ❌ Error querying trackings for ${change.featureId}:`, error);
      continue;
    }

    if (!trackings || trackings.length === 0) {
      console.log(`  ℹ️  ${change.featureId}: No active trackings found`);
      continue; // No users tracking this feature
    }

    console.log(`\n📢 ${change.featureId}: ${trackings.length} user(s) tracking`);

    // Load full feature data (needed for usage threshold evaluation)
    const fullFeature = await loadFullFeature(change.featureId);

    if (!fullFeature) {
      console.log(`  ⚠️  Could not load full feature data for ${change.featureId}`);
      continue;
    }

    // Evaluate triggers for each tracking
    for (const tracking of trackings as unknown as UserFeatureTracking[]) {
      trackingsProcessed++;

      // Skip if no email stored (legacy trackings before migration)
      if (!tracking.user_email) {
        console.log(`  ⚠️  No email stored for tracking ${tracking.id} (user: ${tracking.user_id})`);
        continue;
      }

      const metTriggers = evaluateTriggers(
        tracking.triggers,
        indexFeature,
        fullFeature,
        change.changes
      );

      if (metTriggers.length > 0) {
        console.log(`  ✉️  Notifying ${tracking.user_email}`);

        try {
          await sendEmailNotification(
            tracking,
            metTriggers,
            fullFeature,
            change.changes,
            tracking.user_email
          );

          // Update status to notified
          await supabase
            .from("user_feature_tracking")
            .update({
              status: "notified",
              notified_at: new Date().toISOString(),
            })
            .eq("id", tracking.id);

          notificationsSent++;
          console.log(`  ✅ Notification sent and status updated`);
        } catch (error) {
          console.error(`  ❌ Failed to send notification:`, error);
        }
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("✅ NOTIFICATIONS COMPLETE");
  console.log("=".repeat(70));
  console.log(`Trackings processed: ${trackingsProcessed}`);
  console.log(`Notifications sent: ${notificationsSent}`);
  console.log("=".repeat(70));
}

// ============================================================================
// FEATURE LOADING
// ============================================================================

async function loadFullFeature(featureId: string): Promise<NormalizedFeature | null> {
  // Check cache first
  if (featureCache.has(featureId)) {
    return featureCache.get(featureId)!;
  }

  const featurePath = path.join("./public/data/features", `${featureId}.json`);

  if (!fs.existsSync(featurePath)) {
    console.log(`  ⚠️  Feature file not found: ${featurePath}`);
    return null;
  }

  try {
    const featureData = JSON.parse(fs.readFileSync(featurePath, "utf8")) as NormalizedFeature;
    featureCache.set(featureId, featureData);
    return featureData;
  } catch (error) {
    console.error(`  ❌ Error loading feature ${featureId}:`, error);
    return null;
  }
}

// ============================================================================
// TRIGGER EVALUATION
// ============================================================================

function evaluateTriggers(
  triggers: Trigger[],
  indexFeature: FeatureIndex,
  fullFeature: NormalizedFeature,
  changes: FeatureChange["changes"]
): Trigger[] {
  const metTriggers: Trigger[] = [];

  for (const trigger of triggers) {
    let isMet = false;

    switch (trigger.type) {
      case "usage_threshold":
        isMet = checkUsageThreshold(trigger, fullFeature, changes);
        break;

      case "browser_support":
        isMet = checkBrowserSupport(trigger, indexFeature, changes);
        break;

      case "baseline_status":
        isMet = checkBaselineStatus(trigger, indexFeature, changes);
        break;
    }

    if (isMet) {
      metTriggers.push(trigger);
    }
  }

  return metTriggers;
}

function checkUsageThreshold(
  trigger: Extract<Trigger, { type: "usage_threshold" }>,
  fullFeature: NormalizedFeature,
  changes: FeatureChange["changes"]
): boolean {
  // Only trigger if usage actually changed
  if (!changes.usage) return false;

  // Get the usage value based on the trigger's usageType
  let currentUsage: number;
  let previousUsage: number;

  switch (trigger.usageType) {
    case "full":
      currentUsage = fullFeature.usage.global.full;
      // Calculate previous full usage from the delta
      previousUsage = currentUsage - changes.usage.delta;
      break;

    case "partial":
      currentUsage = fullFeature.usage.global.partial;
      // Calculate previous partial usage from the delta
      previousUsage = currentUsage - changes.usage.delta;
      break;

    case "total":
    case "combined":
    default:
      currentUsage = fullFeature.usage.global.total;
      previousUsage = changes.usage.old;
      break;
  }

  console.log(`    🔍 Checking usage threshold: ${trigger.usageType} usage`);
  console.log(`       Current: ${currentUsage.toFixed(2)}%, Previous: ${previousUsage.toFixed(2)}%, Threshold: ${trigger.threshold}%`);

  // Check if current usage meets or exceeds threshold
  // AND the change crossed the threshold (was below, now above or equal)
  const meetsThreshold = currentUsage >= trigger.threshold;
  const crossedThreshold = previousUsage < trigger.threshold;

  if (meetsThreshold && crossedThreshold) {
    console.log(`       ✅ Threshold crossed! (was ${previousUsage.toFixed(2)}%, now ${currentUsage.toFixed(2)}%)`);
    return true;
  }

  if (meetsThreshold && !crossedThreshold) {
    console.log(`       ⏭️  Already above threshold (was ${previousUsage.toFixed(2)}%)`);
  } else if (!meetsThreshold) {
    console.log(`       ❌ Below threshold (${currentUsage.toFixed(2)}% < ${trigger.threshold}%)`);
  }

  return false;
}

function checkBrowserSupport(
  trigger: Extract<Trigger, { type: "browser_support" }>,
  indexFeature: FeatureIndex,
  changes: FeatureChange["changes"]
): boolean {
  // Only trigger if support actually changed for this browser
  if (!changes.support) return false;

  const browserChange = changes.support.find(
    (s) => s.browser === trigger.browser
  );

  if (!browserChange) return false;

  // Map frontend "full"/"partial" to backend "y"/"a"
  const targetStatus = trigger.targetStatus === "y" ? "y" : "a";

  console.log(`    🔍 Checking browser support: ${trigger.browser}`);
  console.log(`       Target: ${targetStatus}, New: ${browserChange.new}, Old: ${browserChange.old}`);

  // Check if the new status matches the target
  const matches = browserChange.new === targetStatus;
  
  if (matches) {
    console.log(`       ✅ Browser support matches target!`);
  } else {
    console.log(`       ❌ Browser support doesn't match target`);
  }

  return matches;
}

function checkBaselineStatus(
  trigger: Extract<Trigger, { type: "baseline_status" }>,
  indexFeature: FeatureIndex,
  changes: FeatureChange["changes"]
): boolean {
  // Only trigger if baseline actually changed
  if (!changes.baseline) return false;

  console.log(`    🔍 Checking baseline status`);
  console.log(`       Target: ${trigger.targetStatus}, New: ${changes.baseline.new}, Old: ${changes.baseline.old}`);

  // Check if new baseline matches target
  // Also handle the case where target is "low" and baseline went from false -> "low"
  if (trigger.targetStatus === "low") {
    const matches = changes.baseline.new === "low" || changes.baseline.new === "high";
    if (matches) {
      console.log(`       ✅ Baseline status reached!`);
    } else {
      console.log(`       ❌ Baseline status not reached`);
    }
    return matches;
  }

  const matches = changes.baseline.new === trigger.targetStatus;
  
  if (matches) {
    console.log(`       ✅ Baseline status matches target!`);
  } else {
    console.log(`       ❌ Baseline status doesn't match target`);
  }

  return matches;
}

// ============================================================================
// NOTIFICATION SENDING
// ============================================================================

async function sendEmailNotification(
  tracking: UserFeatureTracking,
  metTriggers: Trigger[],
  feature: NormalizedFeature,
  changes: FeatureChange["changes"],
  userEmail: string
): Promise<void> {
  const conditionsMet = metTriggers.map((trigger) => {
    switch (trigger.type) {
      case "usage_threshold":
        const usageLabel = trigger.usageType === "full" ? "full support" :
                          trigger.usageType === "partial" ? "partial support" :
                          "total (full + partial)";
        const currentValue = trigger.usageType === "full" ? feature.usage.global.full :
                           trigger.usageType === "partial" ? feature.usage.global.partial :
                           feature.usage.global.total;
        return `${usageLabel} usage reached ${trigger.threshold}% (now ${currentValue.toFixed(1)}%)`;

      case "browser_support":
        const statusLabel = trigger.targetStatus === "y" ? "full" : "partial";
        return `${trigger.browser} now has ${statusLabel} support`;

      case "baseline_status":
        return `Baseline status is now "${changes.baseline?.new}"`;

      default:
        return "Condition met";
    }
  });

  await NotificationAPI.send({
    notificationId: "css_feature_update_",
    user: {
      id: tracking.user_id,
      email: userEmail,
    },
    mergeTags: {
      featureName: feature.name,
      featureId: feature.id,
      conditionsMet: conditionsMet.join(", "),
      appUrl: process.env.APP_URL || "https://caniusenow.pages.dev/",
    },
  });
}

// ============================================================================
// RUN
// ============================================================================

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});