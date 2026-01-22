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
