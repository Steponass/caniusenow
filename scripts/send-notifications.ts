import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";
import NotificationAPI from "notificationapi-node-server-sdk";

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
  feature_id: string;
  feature_title: string;
  triggers: Trigger[];
  status: string;
}

type Trigger =
  | {
      type: "usage_threshold";
      usageType: "full" | "partial" | "total";
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
  const featureIndex = JSON.parse(
    fs.readFileSync("./public/data/index.json", "utf8")
  );
  const featureMap = new Map(featureIndex.map((f: any) => [f.id, f]));

  let notificationsSent = 0;
  let trackingsProcessed = 0;

  // Process each changed feature
  console.log("\n🔍 Processing changed features...");

  for (const change of report.changes) {
    const feature = featureMap.get(change.featureId);

    if (!feature) {
      console.log(`  ⚠️  Feature ${change.featureId} not found in index`);
      continue;
    }

    // Query users tracking this feature
    const { data: trackings, error } = await supabase
      .from("user_feature_tracking")
      .select("id, user_id, feature_id, feature_title, triggers, status")
      .eq("feature_id", change.featureId)
      .eq("status", "active");

    if (error) {
      console.error(`  ❌ Error querying trackings for ${change.featureId}:`, error);
      continue;
    }

    if (!trackings || trackings.length === 0) {
      continue; // No users tracking this feature
    }

    console.log(`\n📢 ${change.featureId}: ${trackings.length} user(s) tracking`);

    // Fetch user emails
    const userIds = [...new Set(trackings.map((t) => t.user_id))];
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error(`  ❌ Error fetching users:`, usersError);
      continue;
    }

    const userEmailMap = new Map(
      users.users.map((u) => [u.id, u.email || ""])
    );

    // Evaluate triggers for each tracking
    for (const tracking of trackings as unknown as UserFeatureTracking[]) {
      trackingsProcessed++;

      const metTriggers = evaluateTriggers(
        tracking.triggers,
        feature,
        change.changes
      );

      if (metTriggers.length > 0) {
        const userEmail = userEmailMap.get(tracking.user_id);

        if (!userEmail) {
          console.log(`  ⚠️  No email found for user ${tracking.user_id}`);
          continue;
        }

        console.log(`  ✉️  Notifying ${userEmail}`);

        try {
          await sendEmailNotification(
            tracking,
            metTriggers,
            feature,
            change.changes,
            userEmail
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
// TRIGGER EVALUATION
// ============================================================================

function evaluateTriggers(
  triggers: Trigger[],
  feature: any,
  changes: FeatureChange["changes"]
): Trigger[] {
  const metTriggers: Trigger[] = [];

  for (const trigger of triggers) {
    let isMet = false;

    switch (trigger.type) {
      case "usage_threshold":
        isMet = checkUsageThreshold(trigger, feature, changes);
        break;

      case "browser_support":
        isMet = checkBrowserSupport(trigger, feature, changes);
        break;

      case "baseline_status":
        isMet = checkBaselineStatus(trigger, feature, changes);
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
  feature: any,
  changes: FeatureChange["changes"]
): boolean {
  // Only trigger if usage actually changed
  if (!changes.usage) return false;

  const currentUsage = feature.usage; // This is the "total" usage

  // Map usageType to the actual value
  // Note: Our normalized data only has "total" usage in the index
  // If you need full/partial breakdown, you'd need to load the full feature file
  const usageValue = currentUsage;

  // Check if current usage meets or exceeds threshold
  // AND the change crossed the threshold
  return (
    usageValue >= trigger.threshold &&
    changes.usage.old < trigger.threshold
  );
}

function checkBrowserSupport(
  trigger: Extract<Trigger, { type: "browser_support" }>,
  feature: any,
  changes: FeatureChange["changes"]
): boolean {
  // Only trigger if support actually changed for this browser
  if (!changes.support) return false;

  const browserChange = changes.support.find(
    (s) => s.browser === trigger.browser
  );

  if (!browserChange) return false;

  // Check if the new status matches the target
  return browserChange.new === trigger.targetStatus;
}

function checkBaselineStatus(
  trigger: Extract<Trigger, { type: "baseline_status" }>,
  feature: any,
  changes: FeatureChange["changes"]
): boolean {
  // Only trigger if baseline actually changed
  if (!changes.baseline) return false;

  // Check if new baseline matches target
  // Also handle the case where target is "low" and baseline went from false -> "low"
  if (trigger.targetStatus === "low") {
    return (
      changes.baseline.new === "low" || changes.baseline.new === "high"
    );
  }

  return changes.baseline.new === trigger.targetStatus;
}

// ============================================================================
// NOTIFICATION SENDING
// ============================================================================

async function sendEmailNotification(
  tracking: UserFeatureTracking,
  metTriggers: Trigger[],
  feature: any,
  changes: FeatureChange["changes"],
  userEmail: string
): Promise<void> {
  const conditionsMet = metTriggers.map((trigger) => {
    switch (trigger.type) {
      case "usage_threshold":
        return `Global usage reached ${trigger.threshold}% (now ${feature.usage.toFixed(1)}%)`;

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