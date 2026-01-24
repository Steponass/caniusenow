// Import and re-export types from backend for frontend use
import type {
  NormalizedFeature,
  FeatureIndex,
  BrowserSupport,
  BrowserSupportDetail,
  VersionSupport,
  SupportStatus
} from '../../scripts/types';

export type {
  NormalizedFeature,
  FeatureIndex,
  BrowserSupport,
  BrowserSupportDetail,
  VersionSupport,
  SupportStatus
};

// Additional frontend-specific types
export interface FeatureSearchResult {
  index: FeatureIndex[];
  total: number;
}

export interface FeatureCache {
  [featureId: string]: NormalizedFeature;
}

// Browser display names mapping (short key -> readable name)
export const BROWSER_DISPLAY_NAMES: Record<string, string> = {
  chr: "Chrome",
  ffx: "Firefox",
  saf: "Safari",
  edg: "Edge",
  opr: "Opera",
  ie: "IE",
  ios_saf: "iOS Safari",
  an_chr: "Android Chrome",
  smsg: "Samsung",
  an_ff: "Android Firefox"
};

// Helper function to get display name
export function getBrowserDisplayName(shortKey: string): string {
  return BROWSER_DISPLAY_NAMES[shortKey] || shortKey;
}
