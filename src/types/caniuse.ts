export type SupportStatus = 'full' | 'partial' | 'none' | 'prefixed' | 'unknown';

export interface BrowserVersion {
  status: SupportStatus;
  usage: number;
}

export interface BrowserStats {
  [browser: string]: {
    [version: string]: BrowserVersion;
  };
}

export interface UsageStats {
  full: number;
  partial: number;
  combined: number;
  none: number;
}

export interface Feature {
  id: string;
  title: string;
  caniuseUrl: string;
  stats: BrowserStats;
  usage: UsageStats;
}

export interface BrowserData {
  name: string;
  versions: string[];
  usage: Record<string, number>;
}

export interface CaniuseData {
  lastUpdated: string;
  features: Record<string, Feature>;
  browsers: Record<string, BrowserData>;
}