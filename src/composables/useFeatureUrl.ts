import { ref, watch } from "vue";
import type {
  Trigger,
  TriggerType,
  BrowserSupportTrigger,
  BrowserVersionTrigger,
  UsageThresholdTrigger,
  BaselineStatusTrigger,
} from "@/types/featureTracking";

/**
 * URL state management composable for feature modal and trigger configuration.
 *
 * This composable manages:
 * 1. Feature selection (which feature modal is open)
 * 2. Trigger builder form state (current dropdown selections)
 * 3. Added triggers array (triggers that have been configured)
 *
 * URL updates use replaceState for form changes (no history entry)
 * and pushState for feature open/close (creates history entry for back button).
 *
 * Uses singleton pattern - all components share the same state.
 */

// Module-level refs (shared across all usages)
const featureId = ref<string | null>(null);

// Form state
const triggerType = ref<TriggerType>("browser_support");
const browser = ref("chrome");
const status = ref<"full" | "partial">("full");
const version = ref("");
const usageType = ref<"full" | "partial" | "combined">("combined");
const threshold = ref(95);
const baselineStatus = ref<"low" | "high">("low");

// Added triggers array
const triggers = ref<Trigger[]>([]);

// Track initialization to avoid re-reading URL
let isInitialized = false;

// Track if we're updating from popstate to avoid re-updating URL
let isUpdatingFromPopstate = false;

/**
 * Read URL parameters and populate state
 */
function readFromUrl(): void {
  const params = new URLSearchParams(window.location.search);

  const featureParam = params.get("feature");
  featureId.value = featureParam;

  const triggerTypeParam = params.get("triggerType");
  if (
    triggerTypeParam &&
    ["browser_support", "browser_version", "usage_threshold", "baseline_status"].includes(
      triggerTypeParam
    )
  ) {
    triggerType.value = triggerTypeParam as TriggerType;
  }

  const browserParam = params.get("browser");
  if (browserParam) {
    browser.value = browserParam;
  }

  const statusParam = params.get("status");
  if (statusParam && ["full", "partial"].includes(statusParam)) {
    status.value = statusParam as "full" | "partial";
  }

  const versionParam = params.get("version");
  if (versionParam) {
    version.value = versionParam;
  }

  const usageTypeParam = params.get("usageType");
  if (
    usageTypeParam &&
    ["full", "partial", "combined"].includes(usageTypeParam)
  ) {
    usageType.value = usageTypeParam as "full" | "partial" | "combined";
  }

  const thresholdParam = params.get("threshold");
  if (thresholdParam) {
    const parsed = parseInt(thresholdParam, 10);
    if (!isNaN(parsed) && parsed >= 20 && parsed <= 100) {
      threshold.value = parsed;
    }
  }

  const baselineStatusParam = params.get("baselineStatus");
  if (baselineStatusParam && ["low", "high"].includes(baselineStatusParam)) {
    baselineStatus.value = baselineStatusParam as "low" | "high";
  }

  const triggersParam = params.get("triggers");
  if (triggersParam) {
    try {
      const parsed = JSON.parse(decodeURIComponent(triggersParam));
      if (Array.isArray(parsed)) {
        triggers.value = parsed as Trigger[];
      }
    } catch {
      // Invalid JSON, ignore
    }
  }
}

/**
 * Build URL string from current state
 */
function buildUrlString(): string {
  if (!featureId.value) {
    return "/";
  }

  const params = new URLSearchParams();
  params.set("feature", featureId.value);
  params.set("triggerType", triggerType.value);
  params.set("browser", browser.value);
  params.set("status", status.value);

  if (version.value) {
    params.set("version", version.value);
  }

  params.set("usageType", usageType.value);
  params.set("threshold", threshold.value.toString());
  params.set("baselineStatus", baselineStatus.value);

  if (triggers.value.length > 0) {
    params.set("triggers", encodeURIComponent(JSON.stringify(triggers.value)));
  }

  return `?${params.toString()}`;
}

/**
 * Update URL with current state using replaceState (no history entry)
 */
function updateUrlSilently(): void {
  if (isUpdatingFromPopstate) {
    return;
  }

  const url = buildUrlString();
  window.history.replaceState({}, "", url);
}

/**
 * Handle browser back/forward navigation
 */
function handlePopState(): void {
  isUpdatingFromPopstate = true;
  readFromUrl();
  isUpdatingFromPopstate = false;
}

/**
 * Set up watchers for all state refs to update URL on change
 */
function setupWatchers(): void {
  // Watch form state changes - use replaceState (no history entry)
  watch(
    [triggerType, browser, status, version, usageType, threshold, baselineStatus, triggers],
    () => {
      if (featureId.value) {
        updateUrlSilently();
      }
    },
    { deep: true }
  );
}

/**
 * Initialize the composable - reads URL and sets up event listeners
 */
function initialize(): void {
  if (isInitialized) {
    return;
  }

  readFromUrl();
  setupWatchers();
  window.addEventListener("popstate", handlePopState);
  isInitialized = true;
}

/**
 * Set the feature ID and update URL with pushState (creates history entry)
 */
function setFeature(id: string | null): void {
  featureId.value = id;

  if (id) {
    const url = buildUrlString();
    window.history.pushState({}, "", url);
  } else {
    window.history.pushState({}, "", "/");
  }
}

/**
 * Clear URL and reset to root (creates history entry for back button)
 */
function clearUrl(): void {
  featureId.value = null;
  window.history.pushState({}, "", "/");
}

/**
 * Reset trigger form state to defaults
 */
function resetFormState(): void {
  triggerType.value = "browser_support";
  browser.value = "chrome";
  status.value = "full";
  version.value = "";
  usageType.value = "combined";
  threshold.value = 95;
  baselineStatus.value = "low";
}

/**
 * Reset all trigger state (form + added triggers)
 */
function resetTriggerState(): void {
  resetFormState();
  triggers.value = [];
}

/**
 * Add a trigger to the array based on current form state
 */
function addTrigger(): Trigger | null {
  let newTrigger: Trigger;

  if (triggerType.value === "browser_support") {
    newTrigger = {
      type: "browser_support",
      browser: browser.value,
      targetStatus: status.value,
    } as BrowserSupportTrigger;
  } else if (triggerType.value === "browser_version") {
    if (!version.value) {
      return null;
    }
    newTrigger = {
      type: "browser_version",
      browser: browser.value,
      version: version.value,
      targetStatus: status.value,
    } as BrowserVersionTrigger;
  } else if (triggerType.value === "usage_threshold") {
    newTrigger = {
      type: "usage_threshold",
      usageType: usageType.value,
      threshold: threshold.value,
    } as UsageThresholdTrigger;
  } else {
    newTrigger = {
      type: "baseline_status",
      targetStatus: baselineStatus.value,
    } as BaselineStatusTrigger;
  }

  triggers.value = [...triggers.value, newTrigger];
  return newTrigger;
}

/**
 * Remove a trigger by index
 */
function removeTrigger(index: number): void {
  triggers.value = triggers.value.filter((_, i) => i !== index);
}

export function useFeatureUrl() {
  // Initialize on first use
  initialize();

  return {
    // State
    featureId,
    triggerType,
    browser,
    status,
    version,
    usageType,
    threshold,
    baselineStatus,
    triggers,

    // Actions
    setFeature,
    clearUrl,
    resetFormState,
    resetTriggerState,
    addTrigger,
    removeTrigger,
  };
}
