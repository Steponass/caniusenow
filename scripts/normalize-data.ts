import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  SourceFiles,
  CaniuseData,
  WebFeaturesData,
  WebFeature,
  MdnBcdData,
  MdnCompatStatement,
  AltWwData,
  NormalizedFeature,
  FeatureIndex,
  PipelineStats,
  TargetBrowser,
  TARGET_BROWSERS,
  BrowserSupport,
  BrowserSupportDetail,
  BROWSER_SHORT_NAMES
} from "./types.js";
import {
  mapCaniuseCategory,
  extractCaniuseBrowserSupport,
  calculateActualUsage,
  extractWebFeaturesBrowserSupport,
  estimateUsage,
  extractAllMdnFeatures,
  extractMdnBrowserSupport,
  inferCategoryFromMdnPath,
  extractQuickSupport,
} from "./helpers.js";
import {
  normalizeCodeTags,
  inferNameFromMdnPath,
  areLikelyDuplicates,
  formatFeatureName
} from "./format-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../data/sources");
const OUTPUT_DIR = path.resolve(__dirname, "../public/data");
const FEATURES_DIR = path.resolve(OUTPUT_DIR, "features");

// ============================================================================
// MAIN PIPELINE
// ============================================================================

async function main(): Promise<void> {
  console.log("=".repeat(70));
  console.log("NORMALIZE BROWSER COMPATIBILITY DATA");
  console.log("=".repeat(70));

  const startTime = Date.now();

  // Initialize stats
  const stats: PipelineStats = {
    caniuse: { total: 0, processed: 0, errors: 0 },
    webFeatures: { total: 0, new: 0, merged: 0, errors: 0 },
    mdnBcd: { total: 0, new: 0, merged: 0, errors: 0 },
    output: { features: 0, indexSize: 0 }
  };

  try {
    // Step 1: Load all source files
    console.log("\n📂 Step 1: Loading source files...");
    const sources = await loadSources();
    console.log("  ✅ All sources loaded");

    // Step 2: Initialize feature registry
    console.log("\n🗄️  Step 2: Initializing feature registry...");
    const features = new Map<string, NormalizedFeature>();

    // Step 3: Process Caniuse (Primary source)
    console.log("\n🔵 Step 3: Processing Caniuse features...");
    processCaniuse(features, sources, stats);
    console.log(`  ✅ Processed ${stats.caniuse.processed} features (${stats.caniuse.errors} errors)`);

    // Step 4: Merge Web Features (Secondary source)
    console.log("\n🟢 Step 4: Merging Web Features...");
    processWebFeatures(features, sources, stats);
    console.log(`  ✅ Merged ${stats.webFeatures.merged} features, added ${stats.webFeatures.new} new (${stats.webFeatures.errors} errors)`);

    // Step 5: Merge MDN BCD (Tertiary source)
    console.log("\n🟡 Step 5: Merging MDN Browser Compat Data...");
    processMdnBcd(features, sources, stats);
    console.log(`  ✅ Merged ${stats.mdnBcd.merged} features, added ${stats.mdnBcd.new} new (${stats.mdnBcd.errors} errors)`);

    // Step 6: Generate search index
    console.log("\n📑 Step 6: Generating search index...");
    const index = generateIndex(features, sources);
    console.log(`  ✅ Generated index with ${index.length} features`);

    // Step 7: Write output files
    console.log("\n💾 Step 7: Writing output files...");
    await writeOutput(index, features, stats);
    console.log(`  ✅ Written ${stats.output.features} feature files + index`);

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n" + "=".repeat(70));
    console.log("✅ NORMALIZATION COMPLETE");
    console.log("=".repeat(70));
    console.log(`Total features: ${stats.output.features}`);
    console.log(`Index size: ${(stats.output.indexSize / 1024).toFixed(2)} KB`);
    console.log(`Duration: ${duration}s`);
    console.log("=".repeat(70));

  } catch (error) {
    console.error("\n❌ Fatal error during normalization:");
    console.error(error);
    process.exit(1);
  }
}

// ============================================================================
// STEP 1: LOAD SOURCE FILES
// ============================================================================

async function loadSources(): Promise<SourceFiles> {
  const caniusePath = path.join(DATA_DIR, "caniuse.json");
  const webFeaturesPath = path.join(DATA_DIR, "webfeatures.json");
  const mdnBcdPath = path.join(DATA_DIR, "mdnbcd.json");
  const usagePath = path.join(DATA_DIR, "alt-ww.json");

  console.log(`  Loading: ${caniusePath}`);
  const caniuse: CaniuseData = JSON.parse(fs.readFileSync(caniusePath, "utf-8"));

  console.log(`  Loading: ${webFeaturesPath}`);
  const webFeatures: WebFeaturesData = JSON.parse(fs.readFileSync(webFeaturesPath, "utf-8"));

  console.log(`  Loading: ${mdnBcdPath}`);
  const mdnBcd: MdnBcdData = JSON.parse(fs.readFileSync(mdnBcdPath, "utf-8"));

  console.log(`  Loading: ${usagePath}`);
  const usage: AltWwData = JSON.parse(fs.readFileSync(usagePath, "utf-8"));

  return { caniuse, webFeatures, mdnBcd, usage };
}

// ============================================================================
// STEP 3: PROCESS CANIUSE (PRIMARY SOURCE)
// ============================================================================

function processCaniuse(
  features: Map<string, NormalizedFeature>,
  sources: SourceFiles,
  stats: PipelineStats
): void {
  const { caniuse, usage } = sources;
  const caniuseFeatures = Object.entries(caniuse.data);

  stats.caniuse.total = caniuseFeatures.length;

  for (const [id, feature] of caniuseFeatures) {
    try {
      // Extract browser support for all target browsers
      const support: BrowserSupport = {};
      for (const browser of TARGET_BROWSERS) {
        support[browser] = extractCaniuseBrowserSupport(feature.stats, browser);
      }

      // Calculate actual usage with browser breakdown
      const usageData = calculateActualUsage(feature, support, usage);

      // Compute category first so it can be used in formatFeatureName
      const category = mapCaniuseCategory(feature.categories);

      // Create normalized feature
      const normalized: NormalizedFeature = {
        id,
        source: "caniuse",
        name: normalizeCodeTags(feature.title),
        description: normalizeCodeTags(feature.description || ""),
        category,

        mdn: undefined,
        links: feature.links || [],

        support,

        usage: {
          ...usageData,
          type: "actual"
        },

        notes: {
          general: feature.notes,
          byNum: feature.notes_by_num
        },

        flags: undefined,

        baseline: false, // Will be updated by Web Features if available

        sourceData: {
          primary: { source: "caniuse", id },
          supplementary: []
        },

        caniuseUrl: `https://caniuse.com/?search=${encodeURIComponent(id)}`
      };

      features.set(id, normalized);
      stats.caniuse.processed++;

    } catch (error) {
      console.warn(`  ⚠️  Error processing Caniuse feature ${id}:`, error instanceof Error ? error.message : error);
      stats.caniuse.errors++;
    }
  }
}

// ============================================================================
// STEP 4: PROCESS WEB FEATURES (SECONDARY SOURCE)
// ============================================================================

function processWebFeatures(
  features: Map<string, NormalizedFeature>,
  sources: SourceFiles,
  stats: PipelineStats
): void {
  const { webFeatures, usage } = sources;
  const wfFeatures = Object.entries(webFeatures.features);

  stats.webFeatures.total = wfFeatures.length;

  for (const [wfId, wfFeature] of wfFeatures) {
    try {
      // Check if this WF feature maps to existing Caniuse feature via explicit mapping
      const caniuseIds = wfFeature.caniuse
        ? (Array.isArray(wfFeature.caniuse) ? wfFeature.caniuse : [wfFeature.caniuse])
        : [];

      let merged = false;

      // Strategy 1: Try to merge via explicit caniuse mapping
      for (const caniuseId of caniuseIds) {
        const existingFeature = features.get(caniuseId);

        if (existingFeature) {
          supplementWithWebFeatures(existingFeature, wfFeature, wfId);
          stats.webFeatures.merged++;
          merged = true;
          break;
        }
      }

      // Strategy 2: Check for duplicates by ID/name similarity
      if (!merged) {
        const wfNormalized = { id: wfId, name: wfFeature.name };

        for (const [existingId, existingFeature] of features) {
          if (areLikelyDuplicates(wfNormalized, { id: existingId, name: existingFeature.name })) {
            supplementWithWebFeatures(existingFeature, wfFeature, wfId);
            stats.webFeatures.merged++;
            merged = true;
            break;
          }
        }
      }

      // If no match found, create new feature from Web Features
      if (!merged) {
        const newFeature = createFeatureFromWebFeatures(wfId, wfFeature, usage);
        features.set(`wf-${wfId}`, newFeature);
        stats.webFeatures.new++;
      }

    } catch (error) {
      console.warn(`  ⚠️  Error processing Web Feature ${wfId}:`, error instanceof Error ? error.message : error);
      stats.webFeatures.errors++;
    }
  }
}

function supplementWithWebFeatures(
  feature: NormalizedFeature,
  wfFeature: WebFeature,
  wfId: string
): void {
  // Add baseline status
  if (wfFeature.status.baseline) {
    feature.baseline = wfFeature.status.baseline;
  }

  // Record supplementary source
  feature.sourceData.supplementary.push({
    source: "webfeatures",
    id: wfId,
    matched: "exact"
  });
}

function createFeatureFromWebFeatures(
  wfId: string,
  wfFeature: WebFeature,
  usage: AltWwData
): NormalizedFeature {
  // Extract browser support from WF status
  const support: BrowserSupport = {};
  
  // First, collect browsers that Web Features has data for
  const browsersWithData = new Set<string>();
  for (const browser of TARGET_BROWSERS) {
    const wfSupport = extractWebFeaturesBrowserSupport(wfFeature.status.support, browser);
    if (wfSupport) {
      support[browser] = wfSupport;
      browsersWithData.add(browser);
    }
  }
  
  // For browsers without explicit data, infer from related browsers
  for (const browser of TARGET_BROWSERS) {
    if (!browsersWithData.has(browser)) {
      const inferredSupport = inferBrowserSupport(browser, browsersWithData, support);
      support[browser] = inferredSupport;
    }
  }

  // Estimate usage
  const usageData = estimateUsage(support, usage);

  return {
    id: `wf-${wfId}`,
    source: "webfeatures",
    name: normalizeCodeTags(wfFeature.name),
    description: normalizeCodeTags(wfFeature.description || ""),
    category: "Other", // Will try to infer from MDN if available
    mdn: undefined,
    links: [],

    support,

    usage: {
      ...usageData,
      type: "estimated"
    },
    notes: undefined,
    flags: undefined,
    baseline: wfFeature.status.baseline || false,

    sourceData: {
      primary: { source: "webfeatures", id: wfId },
      supplementary: []
    },

    caniuseUrl: `https://caniuse.com/?search=${encodeURIComponent(wfId)}`
  };
}

/**
 * Infer browser support based on related browsers
 * For example: ios_saf from safari, and_chr from chrome, samsung from chrome
 */
function inferBrowserSupport(
  browser: TargetBrowser,
  browsersWithData: Set<string>,
  support: BrowserSupport
): BrowserSupportDetail {
  // Map mobile browsers to their desktop counterparts
  const inferenceMap: Record<string, TargetBrowser> = {
    ios_saf: "safari",
    and_chr: "chrome",
    samsung: "chrome",
    and_ff: "firefox",
    opera: "chrome", // Opera is Chromium-based
    ie: "edge" // IE can sometimes be inferred from Edge, though not always accurate
  };
  
  const relatedBrowser = inferenceMap[browser];
  
  if (relatedBrowser && browsersWithData.has(relatedBrowser)) {
    // Copy support from related browser
    return { ...support[relatedBrowser] };
  }
  
  // If no related browser, mark as unsupported
  return {
    current: "n",
    versions: []
  };
}

// ============================================================================
// STEP 5: PROCESS MDN BCD (TERTIARY SOURCE)
// ============================================================================

function processMdnBcd(
  features: Map<string, NormalizedFeature>,
  sources: SourceFiles,
  stats: PipelineStats
): void {
  const { mdnBcd, webFeatures, usage } = sources;

  // Only process specific top-level categories
  const ALLOWED_CATEGORIES = ['api', 'css', 'html', 'http', 'javascript', 'svg'];

  // Filter MDN data to only allowed categories
  const filteredMdnData: Record<string, any> = {};
  for (const category of ALLOWED_CATEGORIES) {
    if (mdnBcd[category]) {
      filteredMdnData[category] = mdnBcd[category];
    }
  }

  // Extract all MDN features from hierarchical structure (filtered)
  console.log("  Extracting MDN features from hierarchy...");
  const mdnFeatures = extractAllMdnFeatures(filteredMdnData);
  stats.mdnBcd.total = mdnFeatures.length;

  console.log(`  Found ${mdnFeatures.length} MDN features (filtered to: ${ALLOWED_CATEGORIES.join(', ')})`);

  // Build a map of compat_features -> WF feature for quick lookup
  const mdnToWfMap = new Map<string, string>();
  for (const [wfId, wfFeature] of Object.entries(webFeatures.features)) {
    if (wfFeature.compat_features) {
      for (const mdnPath of wfFeature.compat_features) {
        mdnToWfMap.set(mdnPath, wfId);
      }
    }
  }

  for (const { path, compat } of mdnFeatures) {
    try {
      if (!compat.__compat) continue;

      let merged = false;

      // Strategy 1: Check if this MDN feature is linked via Web Features
      const linkedWfId = mdnToWfMap.get(path);

      if (linkedWfId) {
        // Try to find existing feature via WF mapping
        const caniuseIds = webFeatures.features[linkedWfId]?.caniuse || [];
        const caniuseIdArray = Array.isArray(caniuseIds) ? caniuseIds : [caniuseIds];

        for (const caniuseId of caniuseIdArray) {
          const existingFeature = features.get(caniuseId);

          if (existingFeature) {
            supplementWithMdn(existingFeature, path, compat);
            stats.mdnBcd.merged++;
            merged = true;
            break;
          }
        }

        // Also check if WF feature exists as standalone
        if (!merged) {
          const wfFeature = features.get(`wf-${linkedWfId}`);
          if (wfFeature) {
            supplementWithMdn(wfFeature, path, compat);
            stats.mdnBcd.merged++;
            merged = true;
          }
        }
      }

      // Strategy 2: Check for duplicates by ID/name similarity
      if (!merged) {
        // Infer a name for comparison
        const mdnName = compat.__compat.description || inferNameFromMdnPath(path);
        const mdnNormalized = { id: path, name: mdnName };

        for (const [existingId, existingFeature] of features) {
          if (areLikelyDuplicates(mdnNormalized, { id: existingId, name: existingFeature.name })) {
            supplementWithMdn(existingFeature, path, compat);
            stats.mdnBcd.merged++;
            merged = true;
            break;
          }
        }
      }

      // If no link found, create new feature from MDN
      if (!merged) {
        const newFeature = createFeatureFromMdn(path, compat, usage);
        features.set(`mdn-${path}`, newFeature);
        stats.mdnBcd.new++;
      }

    } catch (error) {
      console.warn(`  ⚠️  Error processing MDN feature ${path}:`, error instanceof Error ? error.message : error);
      stats.mdnBcd.errors++;
    }
  }
}

function supplementWithMdn(
  feature: NormalizedFeature,
  mdnPath: string,
  compat: MdnCompatStatement
): void {
  if (!compat.__compat) return;

  // Add MDN URL
  if (compat.__compat.mdn_url) {
    feature.mdn = compat.__compat.mdn_url;
  }

  // Record supplementary source
  feature.sourceData.supplementary.push({
    source: "mdnbcd",
    id: mdnPath,
    matched: "via-webfeatures"
  });
}

function createFeatureFromMdn(
  mdnPath: string,
  compat: MdnCompatStatement,
  usage: AltWwData
): NormalizedFeature {
  if (!compat.__compat) {
    throw new Error("Missing __compat data");
  }

  // Extract browser support from MDN
  const support: BrowserSupport = {};
  const browsersWithData = new Set<string>();

  for (const browser of TARGET_BROWSERS) {
    const mdnSupport = compat.__compat.support[browser];
    if (mdnSupport) {
      const extracted = extractMdnBrowserSupport(mdnSupport, browser);
      if (extracted) {
        support[browser] = extracted;
        browsersWithData.add(browser);
      }
    }
  }

  // For browsers without explicit data, infer from related browsers
  for (const browser of TARGET_BROWSERS) {
    if (!browsersWithData.has(browser)) {
      const inferredSupport = inferBrowserSupport(browser, browsersWithData, support);
      support[browser] = inferredSupport;
    }
  }

  // Estimate usage
  const usageData = estimateUsage(support, usage);

  // Use the improved inferNameFromMdnPath from format-utils.ts
  const inferredName = inferNameFromMdnPath(mdnPath);

  // Use description if available, otherwise use inferred name
  const name = compat.__compat.description || inferredName;

  // Format the name (add backticks for code elements)
  const formattedName = formatFeatureName(name, inferCategoryFromMdnPath(mdnPath));

  return {
    id: `mdn-${mdnPath}`,
    source: "mdnbcd",
    name: formattedName,
    description: normalizeCodeTags(compat.__compat.description || ""),
    category: inferCategoryFromMdnPath(mdnPath),
    mdn: compat.__compat.mdn_url,
    links: [],
    support,
    usage: {
      ...usageData,
      type: "estimated"
    },
    notes: undefined,
    flags: undefined,
    baseline: false,
    sourceData: {
      primary: { source: "mdnbcd", id: mdnPath },
      supplementary: []
    },
    caniuseUrl: `https://caniuse.com/?search=${encodeURIComponent(mdnPath)}`
  };
}

// ============================================================================
// STEP 6: GENERATE INDEX
// ============================================================================

function generateIndex(
  features: Map<string, NormalizedFeature>,
  sources: SourceFiles
): FeatureIndex[] {
  const index: FeatureIndex[] = [];
  const EXCLUDED_BROWSERS = ['opera', 'ie', 'samsung', 'and_ff'];

  for (const [id, feature] of features) {
    const quickSupport = extractQuickSupport(feature.support);

    // Remove excluded browsers from the support object
    for (const browser of EXCLUDED_BROWSERS) {
      delete quickSupport[browser];
    }

    // Remap browser names to short names
    const shortSupport: Record<string, "y" | "a" | "n" | "p"> = {};
    for (const [browser, status] of Object.entries(quickSupport)) {
      const shortName = BROWSER_SHORT_NAMES[browser as TargetBrowser] || browser;
      shortSupport[shortName] = status;
    }

    index.push({
      id,
      name: feature.name,
      description: feature.description.substring(0, 120), // Truncate for index
      category: feature.category,
      support: shortSupport,
      usage: feature.usage.global.total,
      baseline: feature.baseline
    });
  }

  return index;
}

// ============================================================================
// STEP 7: WRITE OUTPUT
// ============================================================================

async function writeOutput(
  index: FeatureIndex[],
  features: Map<string, NormalizedFeature>,
  stats: PipelineStats
): Promise<void> {
  // Ensure output directories exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(FEATURES_DIR)) {
    fs.mkdirSync(FEATURES_DIR, { recursive: true });
  }

  // Write index
  const indexPath = path.join(OUTPUT_DIR, "index.json");
  const indexJson = JSON.stringify(index, null, 2);
  fs.writeFileSync(indexPath, indexJson, "utf-8");
  stats.output.indexSize = indexJson.length;

  console.log(`  Writing ${features.size} feature files...`);

  // Write individual feature files
  let written = 0;
  for (const [id, feature] of features) {
    // Create a cleaned version of the feature without the versions array
    // and with short browser names
    const cleanedSupport: Record<string, { current: string; firstFull?: string; firstPartial?: string }> = {};
    for (const [browser, browserSupport] of Object.entries(feature.support)) {
      const shortName = BROWSER_SHORT_NAMES[browser as TargetBrowser] || browser;
      cleanedSupport[shortName] = {
        current: browserSupport.current,
        firstFull: browserSupport.firstFull,
        firstPartial: browserSupport.firstPartial
      };
    }

    // Also remap usage.byBrowser to use short names
    const shortByBrowser = {
      desktop: {} as Record<string, number>,
      mobile: {} as Record<string, number>
    };
    for (const [browser, usage] of Object.entries(feature.usage.byBrowser.desktop)) {
      const shortName = BROWSER_SHORT_NAMES[browser as TargetBrowser] || browser;
      shortByBrowser.desktop[shortName] = usage;
    }
    for (const [browser, usage] of Object.entries(feature.usage.byBrowser.mobile)) {
      const shortName = BROWSER_SHORT_NAMES[browser as TargetBrowser] || browser;
      shortByBrowser.mobile[shortName] = usage;
    }

    const cleanedFeature = {
      ...feature,
      support: cleanedSupport,
      usage: {
        ...feature.usage,
        byBrowser: shortByBrowser
      },
      caniuseUrl: `https://caniuse.com/?search=${encodeURIComponent(id)}`
    };

    const featurePath = path.join(FEATURES_DIR, `${id}.json`);
    fs.writeFileSync(featurePath, JSON.stringify(cleanedFeature, null, 2), "utf-8");
    written++;

    if (written % 100 === 0) {
      process.stdout.write(`\r  Written ${written}/${features.size} files...`);
    }
  }

  console.log(`\r  Written ${written}/${features.size} files...`);
  stats.output.features = written;
}

// ============================================================================
// RUN STEPPY RUN
// ============================================================================

main().catch(error => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});