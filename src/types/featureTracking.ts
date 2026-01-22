export type TriggerType = 
  | 'browser_support'
  | 'browser_version'
  | 'usage_threshold';

export type TrackingStatus = 'active' | 'notified' | 'completed';

export interface BrowserSupportTrigger {
  type: 'browser_support';
  browser: string;
  targetStatus: 'full' | 'partial';
}

export interface BrowserVersionTrigger {
  type: 'browser_version';
  browser: string;
  version: string;
  targetStatus: 'full' | 'partial';
}

export interface UsageThresholdTrigger {
  type: 'usage_threshold';
  usageType: 'full' | 'partial' | 'total' | 'combined';
  threshold: number;
}

export type Trigger = 
  | BrowserSupportTrigger 
  | BrowserVersionTrigger 
  | UsageThresholdTrigger;

export interface FeatureTracking {
  id: string;
  user_id: string;
  feature_id: string;
  feature_title: string;
  triggers: Trigger[];
  status: TrackingStatus;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
}