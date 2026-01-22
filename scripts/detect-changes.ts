import * as fs from "fs";
import { execSync } from "child_process";
import type { FeatureIndex } from "./types.js";

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

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log("=".repeat(70));
  console.log("DETECT BROWSER COMPATIBILITY DATA CHANGES");
  console.log("=".repeat(70));

  try {
    // Get current commit SHA
    const currentCommit = execSync("git rev-parse HEAD", {
      encoding: "utf8",
    }).trim();

    console.log(`\n📍 Current commit: ${currentCommit.substring(0, 7)}`);

    // Load current index
    console.log("\n📂 Loading current index...");
    const currentIndex: FeatureIndex[] = JSON.parse(
      fs.readFileSync("./public/data/index.json", "utf8")
    );
    console.log(`  ✅ Loaded ${currentIndex.length} features`);

    // Load previous index from git
    console.log("\n📂 Loading previous index from git...");
    let previousIndex: FeatureIndex[];
    let previousCommit: string;

    try {
      previousCommit = execSync("git rev-parse HEAD~1", {
        encoding: "utf8",
      }).trim();

      const previousFile = execSync("git show HEAD~1:public/data/index.json", {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large files
      });

      previousIndex = JSON.parse(previousFile);
      console.log(
        `  ✅ Loaded ${previousIndex.length} features from ${previousCommit.substring(0, 7)}`
      );
    } catch (error) {
      console.log(
        "  ⚠️  No previous commit found (first run?). Skipping change detection."
      );
      const emptyReport: ChangeReport = {
        timestamp: new Date().toISOString(),
        previousCommit: "none",
        currentCommit,
        totalChanges: 0,
        changes: [],
      };
      writeChangeReport(emptyReport);
      return;
    }

    // Detect changes
    console.log("\n🔍 Detecting changes...");
    const changes = detectChanges(currentIndex, previousIndex);
    console.log(`  ✅ Found ${changes.length} changed features`);

    // Generate report
    const report: ChangeReport = {
      timestamp: new Date().toISOString(),
      previousCommit,
      currentCommit,
      totalChanges: changes.length,
      changes,
    };

    // Write report
    writeChangeReport(report);

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("✅ CHANGE DETECTION COMPLETE");
    console.log("=".repeat(70));
    console.log(`Total changes: ${changes.length}`);

    if (changes.length > 0) {
      console.log("\nChanged features:");
      changes.slice(0, 10).forEach((change) => {
        console.log(`  - ${change.featureId}`);
      });
      if (changes.length > 10) {
        console.log(`  ... and ${changes.length - 10} more`);
      }
    }

    console.log("=".repeat(70));
  } catch (error) {
    console.error("\n❌ Fatal error during change detection:");
    console.error(error);
    process.exit(1);
  }
}

// ============================================================================
// CHANGE DETECTION
// ============================================================================

function detectChanges(
  current: FeatureIndex[],
  previous: FeatureIndex[]
): FeatureChange[] {
  const changes: FeatureChange[] = [];
  const prevMap = new Map(previous.map((f) => [f.id, f]));

  for (const currFeature of current) {
    const prevFeature = prevMap.get(currFeature.id);

    if (!prevFeature) {
      // New feature - skip (per requirement: don't notify about new features)
      continue;
    }

    const featureChanges: FeatureChange["changes"] = {};

    // Check usage change (>1% threshold)
    const usageDelta = Math.abs(currFeature.usage - prevFeature.usage);
    if (usageDelta > 1.0) {
      featureChanges.usage = {
        old: prevFeature.usage,
        new: currFeature.usage,
        delta: currFeature.usage - prevFeature.usage,
      };
    }

    // Check browser support changes
    const supportChanges: Array<{
      browser: string;
      old: "y" | "a" | "n" | "p";
      new: "y" | "a" | "n" | "p";
    }> = [];

    for (const [browser, newStatus] of Object.entries(currFeature.support)) {
      const oldStatus = prevFeature.support[browser];
      if (newStatus !== oldStatus) {
        supportChanges.push({
          browser,
          old: oldStatus,
          new: newStatus,
        });
      }
    }

    if (supportChanges.length > 0) {
      featureChanges.support = supportChanges;
    }

    // Check baseline status change
    if (currFeature.baseline !== prevFeature.baseline) {
      featureChanges.baseline = {
        old: prevFeature.baseline,
        new: currFeature.baseline,
      };
    }

    // If any changes detected, add to list
    if (Object.keys(featureChanges).length > 0) {
      changes.push({
        featureId: currFeature.id,
        changes: featureChanges,
      });
    }
  }

  return changes;
}

// ============================================================================
// REPORT WRITING
// ============================================================================

function writeChangeReport(report: ChangeReport): void {
  const reportPath = "./data/change-report.json";

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`\n💾 Change report written to: ${reportPath}`);
}

// ============================================================================
// RUN
// ============================================================================

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});