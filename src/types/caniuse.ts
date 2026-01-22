// Re-export types from backend for frontend use
export type {
  NormalizedFeature,
  FeatureIndex,
  BrowserSupport,
  BrowserSupportDetail,
  VersionSupport,
  SupportStatus
} from '../../scripts/types';

// Additional frontend-specific types
export interface FeatureSearchResult {
  index: FeatureIndex[];
  total: number;
}

export interface FeatureCache {
  [featureId: string]: NormalizedFeature;
}