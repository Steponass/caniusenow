import {
  CaniuseFeature,
  WebFeature,
  MdnCompatStatement,
  MdnSupportStatement,
  AltWwData,
  BrowserSupport,
  BrowserSupportDetail,
  VersionSupport,
  SupportStatus,
  TargetBrowser,
  TARGET_BROWSERS,
  BROWSER_CATEGORIES,
  NormalizedFeature
} from "./types.js";

// ============================================================================
// VERSION COMPARISON
// ============================================================================

/**
 * Compare two version strings
 * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  // Handle special cases
  if (v1 === v2) return 0;
  if (v1 === "TP") return 1; // Technology Preview is "latest"
  if (v2 === "TP") return -1;
  if (v1 === "all") return -1;
  if (v2 === "all") return 1;
  
  // Split into parts and compare numerically
  const parts1 = v1.split(/[-.]/).map(p => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });
  
  const parts2 = v2.split(/[-.]/).map(p => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });
  
  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  
  return 0;
}

/**
 * Check if a version is within a range (e.g., "15.6-15.8")
 */
export function isVersionInRange(version: string, range: string): boolean {
  if (!range.includes("-")) {
    return version === range;
  }
  
  const [start, end] = range.split("-");
  return compareVersions(version, start) >= 0 && compareVersions(version, end) <= 0;
}

// ============================================================================
// CATEGORY MAPPING
// ============================================================================

/**
 * Map Caniuse category to our normalized category
 */
export function mapCaniuseCategory(categories: string[]): NormalizedFeature["category"] {
  if (!categories || categories.length === 0) return "Other";
  
  const firstCategory = categories[0].toLowerCase();
  
  if (firstCategory.includes("css")) return "CSS";
  if (firstCategory.includes("html")) return "HTML5";
  if (firstCategory.includes("js") || firstCategory.includes("javascript") || firstCategory.includes("api")) return "JS API";
  if (firstCategory.includes("svg")) return "SVG";
  
  return "Other";
}

/**
 * Infer category from MDN compat path
 */
export function inferCategoryFromMdnPath(path: string): NormalizedFeature["category"] {
  const parts = path.split(".");
  const topLevel = parts[0]?.toLowerCase();
  
  if (topLevel === "css") return "CSS";
  if (topLevel === "html") return "HTML5";
  if (topLevel === "api" || topLevel === "javascript") return "JS API";
  if (topLevel === "svg") return "SVG";
  
  return "Other";
}

// ============================================================================
// BROWSER SUPPORT EXTRACTION (CANIUSE)
// ============================================================================

/**
 * Extract browser support data from Caniuse stats
 */
export function extractCaniuseBrowserSupport(
  stats: Record<string, Record<string, string>>,
  browser: TargetBrowser
): BrowserSupportDetail {
  const browserStats = stats[browser];
  
  if (!browserStats) {
    return {
      current: "u",
      versions: []
    };
  }
  
  const versions: VersionSupport[] = [];
  let firstFull: string | undefined;
  let firstPartial: string | undefined;
  let currentVersion = "";
  let currentStatus: SupportStatus = "n";
  
  // Sort versions chronologically
  const sortedVersions = Object.entries(browserStats).sort((a, b) => 
    compareVersions(a[0], b[0])
  );
  
  for (const [version, support] of sortedVersions) {
    const status = parseCanisueSupport(support);
    const flags = extractSupportFlags(support);
    
    versions.push({
      version,
      status,
      flags: flags.length > 0 ? flags : undefined
    });
    
    // Track first full and partial support
    if (status === "y" && !firstFull) {
      firstFull = version;
    }
    if (status === "a" && !firstPartial) {
      firstPartial = version;
    }
    
    // Track current version (last in sorted list)
    currentVersion = version;
    currentStatus = status;
  }
  
  // Keep only last 10 versions with data
  const recentVersions = versions.slice(-10);
  
  return {
    current: currentStatus,
    firstFull,
    firstPartial,
    versions: recentVersions
  };
}

/**
 * Parse Caniuse support string to our status
 */
function parseCanisueSupport(support: string): SupportStatus {
  // Remove flags and prefixes to get base support
  const base = support.replace(/[#xdp]/g, "").trim();
  
  if (base === "y") return "y";
  if (base === "a") return "a";
  if (base === "n") return "n";
  if (base === "p") return "p";
  if (base === "u") return "u";
  
  return "u";
}

/**
 * Extract support flags from Caniuse support string
 */
export function extractSupportFlags(support: string): string[] {
  const flags: string[] = [];
  
  if (support.includes("x")) flags.push("prefix");
  if (support.includes("d")) flags.push("disabled");
  if (support.includes("p")) flags.push("polyfill");
  if (support.includes("#")) flags.push("footnote");
  
  return flags;
}

// ============================================================================
// BROWSER SUPPORT EXTRACTION (WEB FEATURES)
// ============================================================================

/**
 * Extract browser support from Web Features status
 */
export function extractWebFeaturesBrowserSupport(
  wfSupport: Record<string, string>,
  browser: TargetBrowser
): BrowserSupportDetail | null {
  const version = wfSupport[browser];
  
  if (!version) return null;
  
  return {
    current: "y",
    firstFull: version,
    versions: [
      {
        version,
        status: "y"
      }
    ]
  };
}

// ============================================================================
// BROWSER SUPPORT EXTRACTION (MDN BCD)
// ============================================================================

/**
 * Extract browser support from MDN BCD
 */
export function extractMdnBrowserSupport(
  mdnSupport: MdnSupportStatement | MdnSupportStatement[],
  browser: TargetBrowser
): BrowserSupportDetail | null {
  const statements = Array.isArray(mdnSupport) ? mdnSupport : [mdnSupport];
  
  let firstFull: string | undefined;
  let firstPartial: string | undefined;
  let currentStatus: SupportStatus = "n";
  const versions: VersionSupport[] = [];
  
  for (const statement of statements) {
    const versionAdded = statement.version_added;
    
    if (versionAdded === true) {
      currentStatus = "y";
      continue;
    }
    
    if (versionAdded === false || versionAdded === null) {
      continue;
    }
    
    const version = String(versionAdded);
    const hasFlags = statement.flags && statement.flags.length > 0;
    const isPartial = statement.partial_implementation === true;
    
    let status: SupportStatus;
    if (hasFlags) {
      status = "d";
    } else if (isPartial) {
      status = "a";
    } else {
      status = "y";
    }
    
    versions.push({
      version,
      status,
      flags: hasFlags ? ["flags"] : undefined,
      notes: statement.notes ? (Array.isArray(statement.notes) ? statement.notes.join(" ") : statement.notes) : undefined
    });
    
    if (status === "y" && !firstFull) {
      firstFull = version;
      currentStatus = "y";
    }
    
    if (status === "a" && !firstPartial) {
      firstPartial = version;
      if (currentStatus === "n") currentStatus = "a";
    }
  }
  
  if (versions.length === 0) return null;
  
  return {
    current: currentStatus,
    firstFull,
    firstPartial,
    versions: versions.slice(-10)
  };
}

// ============================================================================
// USAGE CALCULATION
// ============================================================================

/**
 * Calculate actual usage from Caniuse feature data.
 * CanIUse provides pre-calculated usage percentages (usage_perc_y and usage_perc_a)
 * which are derived from StatCounter global usage data. These are the most accurate
 * values as they come directly from CanIUse's official calculations.
 *
 * @param feature - CanIUse feature with usage_perc_y (full support) and usage_perc_a (partial support)
 * @param support - Optional browser support details to calculate per-browser breakdown
 * @param usageData - Optional usage data to calculate per-browser breakdown
 */
export function calculateActualUsage(
  feature: CaniuseFeature,
  support?: BrowserSupport,
  usageData?: AltWwData
): {
  global: { full: number; partial: number; total: number };
  byBrowser: { desktop: Record<string, number>; mobile: Record<string, number> };
} {
  const full = feature.usage_perc_y || 0;
  const partial = feature.usage_perc_a || 0;

  // If we have support and usage data, calculate browser breakdown
  // but use CanIUse's pre-calculated global percentages
  let byBrowser: {
    desktop: Record<string, number>;
    mobile: Record<string, number>;
  } = {
    desktop: {},
    mobile: {}
  };

  if (support && usageData) {
    // Use estimateUsage to get browser breakdown, passing pre-calculated global values
    const estimated = estimateUsage(support, usageData, { full, partial });
    byBrowser = estimated.byBrowser;
  }

  return {
    global: {
      full: Math.round(full * 100) / 100,
      partial: Math.round(partial * 100) / 100,
      total: Math.round((full + partial) * 100) / 100
    },
    byBrowser
  };
}

/**
 * Estimate usage based on browser versions and alt-ww data.
 * This follows CanIUse's methodology: sum the usage percentages of all browser versions
 * that support the feature, using StatCounter global usage data as the source.
 *
 * @param support - Browser support details including first full/partial support versions
 * @param usageData - StatCounter usage data by browser and version
 * @param preCalculated - Optional pre-calculated usage from CanIUse (usage_perc_y, usage_perc_a)
 */
export function estimateUsage(
  support: BrowserSupport,
  usageData: AltWwData,
  preCalculated?: { full: number; partial: number }
): {
  global: { full: number; partial: number; total: number };
  byBrowser: { desktop: Record<string, number>; mobile: Record<string, number> };
} {
  // If we have pre-calculated usage from CanIUse, prioritize it for global stats
  // but still calculate browser breakdown
  const usePreCalculated = preCalculated && (preCalculated.full > 0 || preCalculated.partial > 0);

  let fullUsage = 0;
  let partialUsage = 0;

  const byBrowser: {
    desktop: Record<string, number>;
    mobile: Record<string, number>;
  } = {
    desktop: {},
    mobile: {}
  };

  // Access the actual usage data inside the .data property
  const actualUsageData = (usageData as any).data || usageData;

  for (const browser of TARGET_BROWSERS) {
    const browserSupport = support[browser];
    const browserUsage = actualUsageData[browser];

    if (!browserSupport || !browserUsage) continue;

    // Skip if no support at all
    if (browserSupport.current === "n" && !browserSupport.firstFull && !browserSupport.firstPartial) {
      continue;
    }

    let browserFullUsage = 0;
    let browserPartialUsage = 0;

    // Get the first support version
    const firstFullVersion = browserSupport.firstFull;
    const firstPartialVersion = browserSupport.firstPartial;

    // Iterate through all versions in usage data
    for (const [versionStr, usageValue] of Object.entries(browserUsage)) {
      const usage = usageValue as number;
      if (versionStr === "TP" || versionStr === "all") continue;

      // Handle version "0" (current/latest version) specially
      if (versionStr === "0") {
        // Use current support status if available
        if (browserSupport.current === "y") {
          browserFullUsage += usage;
        } else if (browserSupport.current === "a") {
          browserPartialUsage += usage;
        }
        continue;
      }

      // Handle version ranges (e.g., "15.6-15.8")
      if (versionStr.includes("-")) {
        const [rangeStart, rangeEnd] = versionStr.split("-");

        // Check full support for range
        if (firstFullVersion) {
          // Support starts before range - entire range is supported
          if (compareVersions(firstFullVersion, rangeStart) <= 0) {
            browserFullUsage += usage;
            continue;
          }

          // Support starts after range - no support in this range
          if (compareVersions(firstFullVersion, rangeEnd) > 0) {
            continue;
          }

          // Support starts within range - calculate proportional usage
          // Fall back to parseFloat for proportional calculation
          const startNum = parseFloat(rangeStart);
          const endNum = parseFloat(rangeEnd);
          const supportNum = parseFloat(firstFullVersion);

          if (!isNaN(startNum) && !isNaN(endNum) && !isNaN(supportNum)) {
            const rangeSize = endNum - startNum;
            if (rangeSize > 0) {
              const supportedSize = endNum - supportNum;
              const proportion = Math.max(0, Math.min(1, supportedSize / rangeSize));
              browserFullUsage += usage * proportion;
            }
          }
          continue;
        }

        // Check partial support for range if no full support
        if (firstPartialVersion) {
          if (compareVersions(firstPartialVersion, rangeStart) <= 0) {
            browserPartialUsage += usage;
            continue;
          }

          if (compareVersions(firstPartialVersion, rangeEnd) > 0) {
            continue;
          }

          // Proportional partial support
          const startNum = parseFloat(rangeStart);
          const endNum = parseFloat(rangeEnd);
          const supportNum = parseFloat(firstPartialVersion);

          if (!isNaN(startNum) && !isNaN(endNum) && !isNaN(supportNum)) {
            const rangeSize = endNum - startNum;
            if (rangeSize > 0) {
              const supportedSize = endNum - supportNum;
              const proportion = Math.max(0, Math.min(1, supportedSize / rangeSize));
              browserPartialUsage += usage * proportion;
            }
          }
        }

        continue;
      }

      // Handle single version using compareVersions for accuracy
      // Check full support
      if (firstFullVersion && compareVersions(versionStr, firstFullVersion) >= 0) {
        browserFullUsage += usage;
        continue;
      }

      // Check partial support
      if (firstPartialVersion && compareVersions(versionStr, firstPartialVersion) >= 0) {
        browserPartialUsage += usage;
      }
    }

    const category = BROWSER_CATEGORIES[browser];
    const totalBrowserUsage = browserFullUsage + browserPartialUsage;
    if (totalBrowserUsage > 0) {
      byBrowser[category][browser] = Math.round(totalBrowserUsage * 100) / 100;
    }

    fullUsage += browserFullUsage;
    partialUsage += browserPartialUsage;
  }

  // Use pre-calculated values if available and our estimate seems off
  // (CanIUse's data is more accurate as it comes directly from StatCounter)
  if (usePreCalculated && preCalculated) {
    return {
      global: {
        full: Math.round(preCalculated.full * 100) / 100,
        partial: Math.round(preCalculated.partial * 100) / 100,
        total: Math.round((preCalculated.full + preCalculated.partial) * 100) / 100
      },
      byBrowser
    };
  }

  return {
    global: {
      full: Math.round(fullUsage * 100) / 100,
      partial: Math.round(partialUsage * 100) / 100,
      total: Math.round((fullUsage + partialUsage) * 100) / 100
    },
    byBrowser
  };
}
// ============================================================================
// MDN DATA EXTRACTION
// ============================================================================

/**
 * Extract all features from MDN BCD hierarchical structure
 */
export function extractAllMdnFeatures(
  data: Record<string, any>,
  parentPath = ""
): Array<{ path: string; compat: MdnCompatStatement }> {
  const features: Array<{ path: string; compat: MdnCompatStatement }> = [];
  
  for (const [key, value] of Object.entries(data)) {
    if (key === "__compat") continue;
    if (key === "__meta") continue;
    
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    
    if (value && typeof value === "object") {
      if (value.__compat) {
        features.push({
          path: currentPath,
          compat: value as MdnCompatStatement
        });
      }
      
      // Recurse into nested properties
      const nested = extractAllMdnFeatures(value, currentPath);
      features.push(...nested);
    }
  }
  
  return features;
}

/**
 * Infer human-readable name from MDN path
 */
export function inferNameFromMdnPath(path: string): string {
  const parts = path.split(".");
  const lastPart = parts[parts.length - 1];
  
  // Convert snake_case or camelCase to Title Case
  return lastPart
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// ============================================================================
// INDEX GENERATION HELPERS
// ============================================================================

/**
 * Extract quick support summary for index (just y/a/n/p)
 */
export function extractQuickSupport(
  support: BrowserSupport
): Record<string, "y" | "a" | "n" | "p"> {
  const quick: Record<string, "y" | "a" | "n" | "p"> = {};
  
  for (const browser of TARGET_BROWSERS) {
    const browserSupport = support[browser];
    
    if (!browserSupport) {
      quick[browser] = "n";
      continue;
    }
    
    const status = browserSupport.current;
    
    if (status === "y" || status === "x") {
      quick[browser] = "y";
    } else if (status === "a") {
      quick[browser] = "a";
    } else if (status === "p") {
      quick[browser] = "p";
    } else {
      quick[browser] = "n";
    }
  }
  
  return quick;
}

/**
 * Extract first support date across all browsers
 */
export function extractFirstSupport(support: BrowserSupport): string {
  let earliestVersion = "";
  let earliestBrowser = "";
  
  for (const browser of TARGET_BROWSERS) {
    const browserSupport = support[browser];
    
    if (!browserSupport || !browserSupport.firstFull) continue;
    
    if (!earliestVersion || compareVersions(browserSupport.firstFull, earliestVersion) < 0) {
      earliestVersion = browserSupport.firstFull;
      earliestBrowser = browser;
    }
  }
  
  return earliestVersion ? `${earliestBrowser} ${earliestVersion}` : "Unknown";
}