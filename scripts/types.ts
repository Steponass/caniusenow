// =========================================================
// SOURCE DATA TYPES (Raw data from external sources)
// =========================================================

export interface CaniuseData {
  data: Record<string, CaniuseFeature>;
  updated: number;
  eras: Record<string, CaniuseEra>;
  agents: Record<string, CaniuseAgent>;
}

export interface CaniuseFeature {
  title: string;
  description: string;
  status: string;
  links: Array<{ url: string; title: string }>;
  categories: string[];
  stats: Record<string, Record<string, string>>;
  notes?: string;
  notes_by_num?: Record<string, string>;
  usage_perc_y?: number;
  usage_perc_a?: number;
}

export interface CaniuseEra {
  browser: string;
  era: number;
  prefix?: string;
}

export interface CaniuseAgent {
  browser: string;
  abbr: string;
  prefix?: string;
  type: string;
  usage_global: Record<string, number>;
}

export interface WebFeaturesData {
  features: Record<string, WebFeature>;
  groups: Record<string, WebFeatureGroup>;
  snapshots: Record<string, WebFeatureSnapshot>;
}

export interface WebFeature {
  name: string;
  description?: string;
  description_html?: string;
  caniuse?: string | string[];
  compat_features?: string[];
  status: {
    baseline?: "high" | "low" | false;
    baseline_low_date?: string;
    baseline_high_date?: string;
    support: Record<string, string>;
  };
  group?: string;
}

export interface WebFeatureGroup {
  name: string;
  parent?: string;
}

export interface WebFeatureSnapshot {
  features: string[];
}

export interface MdnBcdData {
  __meta?: { version: string; timestamp: string };
  api?: Record<string, any>;
  css?: Record<string, any>;
  html?: Record<string, any>;
  javascript?: Record<string, any>;
  svg?: Record<string, any>;
  webdriver?: Record<string, any>;
  [key: string]: any;
}

export interface MdnCompatStatement {
  __compat?: {
    description?: string;
    mdn_url?: string;
    support: Record<string, MdnSupportStatement | MdnSupportStatement[]>;
    status?: {
      experimental?: boolean;
      standard_track?: boolean;
      deprecated?: boolean;
    };
  };
  [key: string]: any;
}

export interface MdnSupportStatement {
  version_added: string | boolean | null;
  version_removed?: string | boolean | null;
  prefix?: string;
  alternative_name?: string;
  flags?: Array<{ type: string; name: string; value_to_set?: string }>;
  partial_implementation?: boolean;
  notes?: string | string[];
}

export interface AltWwData {
  data: {
    [browser: string]: {
      [version: string]: number;
    };
  };
  total?: number;
  [key: string]: any;
}

// ===========================================================
// NORMALIZED OUTPUT TYPES (Unified format)
// ===========================================================

export interface NormalizedFeature {
  id: string;
  source: "caniuse" | "webfeatures" | "mdnbcd";
  name: string;
  description: string;
  category: "CSS" | "HTML5" | "JS API" | "SVG" | "Other";
  
  mdn?: string;
  links: Array<{ url: string; title: string }>;
  
  support: BrowserSupport;
  
  usage: {
    global: { full: number; partial: number; total: number };
    byBrowser: {
      desktop: Record<string, number>;
      mobile: Record<string, number>;
    };
    type: "actual" | "estimated";
  };
  
  notes?: {
    general?: string;
    byNum?: Record<string, string>;
  };
  flags?: Record<string, string>;
  baseline: "high" | "low" | false;
  sourceData: {
    primary: { source: string; id: string };
    supplementary: Array<{
      source: string;
      id: string;
      matched: "exact" | "via-webfeatures" | "inferred";
    }>;
  };
  caniuseUrl: string;
}

export interface BrowserSupport {
  [browser: string]: BrowserSupportDetail;
}

export interface BrowserSupportDetail {
  current: SupportStatus;
  firstFull?: string;
  firstPartial?: string;
  versions?: VersionSupport[];
}

export interface VersionSupport {
  version: string;
  status: SupportStatus;
  prefix?: string;
  flags?: string[];
  notes?: string;
}

export type SupportStatus = "y" | "a" | "n" | "p" | "d" | "x" | "u";

export interface FeatureIndex {
  id: string;
  name: string;
  description: string;
  category: string;
  support: {
    [browser: string]: "y" | "a" | "n" | "p";
  };
  usage: number;
  baseline: "high" | "low" | false;
}

// ============================================================================
// PIPELINE TYPES (Internal processing)
// ============================================================================

export interface SourceFiles {
  caniuse: CaniuseData;
  webFeatures: WebFeaturesData;
  mdnBcd: MdnBcdData;
  usage: AltWwData;
}

export interface PipelineStats {
  caniuse: { total: number; processed: number; errors: number };
  webFeatures: { total: number; new: number; merged: number; errors: number };
  mdnBcd: { total: number; new: number; merged: number; errors: number };
  output: { features: number; indexSize: number };
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TARGET_BROWSERS = [
  "chrome",
  "firefox", 
  "safari",
  "edge",
  "opera",
  "ie",
  "ios_saf",
  "and_chr",
  "samsung",
  "and_ff"
] as const;

export type TargetBrowser = typeof TARGET_BROWSERS[number];

export const BROWSER_CATEGORIES: Record<TargetBrowser, "desktop" | "mobile"> = {
  chrome: "desktop",
  firefox: "desktop",
  safari: "desktop",
  edge: "desktop",
  opera: "desktop",
  ie: "desktop",
  ios_saf: "mobile",
  and_chr: "mobile",
  samsung: "mobile",
  and_ff: "mobile"
};

// Short names for JSON output to reduce file size
export const BROWSER_SHORT_NAMES: Record<TargetBrowser, string> = {
  chrome: "chr",
  firefox: "ffx",
  safari: "saf",
  edge: "edg",
  opera: "opr",
  ie: "ie",
  ios_saf: "ios_saf",
  and_chr: "an_chr",
  samsung: "smsg",
  and_ff: "an_ff"
};