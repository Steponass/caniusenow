<script setup lang="ts">
import { computed } from "vue";
import type { NormalizedFeature } from "@/types/feature";
import { getBrowserDisplayName } from "@/types/feature";
import type { Trigger } from "@/types/featureTracking";
import { useFeatureUrl } from "@/composables/useFeatureUrl";

interface Props {
  feature: NormalizedFeature;
}

const props = defineProps<Props>();

const {
  triggerType,
  browser,
  status,
  version,
  usageType,
  threshold,
  baselineStatus,
  triggers,
  addTrigger: composableAddTrigger,
  removeTrigger: composableRemoveTrigger,
} = useFeatureUrl();

const availableBrowsers = computed(() => {
  return Object.keys(props.feature.support);
});

function handleAddTrigger() {
  if (triggerType.value === "browser_version" && !version.value) {
    alert("What version number?");
    return;
  }
  composableAddTrigger();
}

function handleRemoveTrigger(index: number) {
  composableRemoveTrigger(index);
}

function getTriggerDescription(trigger: Trigger): string {
  if (trigger.type === "browser_support") {
    return `${getBrowserDisplayName(trigger.browser)} has ${trigger.targetStatus} support`;
  } else if (trigger.type === "browser_version") {
    return `${getBrowserDisplayName(trigger.browser)} ${trigger.version}+ has ${trigger.targetStatus} support`;
  } else if (trigger.type === "usage_threshold") {
    const usageLabel =
      trigger.usageType === "full"
        ? "full support"
        : trigger.usageType === "partial"
          ? "partial support"
          : trigger.usageType === "combined"
            ? "total (full + partial)"
            : "total (full + partial)";
    return `${usageLabel} usage ≥ ${trigger.threshold}%`;
  } else {
    const baselineLabel = trigger.targetStatus === "low"
      ? "newly available (low)"
      : "widely available (high)";
    return `Baseline status reaches ${baselineLabel}`;
  }
}
</script>

<template>
  <div class="trigger-builder">
    <div class="form-group">
      <label>Trigger type</label>
      <select v-model="triggerType">
        <option value="usage_threshold">Overall Support</option>
        <option value="baseline_status">Baseline status</option>
        <option value="browser_support">Specific browser support</option>
        <option value="browser_version">Specific browser version</option>

      </select>
    </div>

    <template v-if="triggerType === 'browser_support'">
      <div class="form-group">
        <label>Browser</label>
        <select v-model="browser">
          <option v-for="browserOption in availableBrowsers" :key="browserOption" :value="browserOption">
            {{ getBrowserDisplayName(browserOption) }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Target status</label>
        <select v-model="status">
          <option value="full">Full support</option>
          <option value="partial">Partial support</option>
        </select>
      </div>
    </template>

    <template v-else-if="triggerType === 'browser_version'">
      <div class="form-group">
        <label>Browser</label>
        <select v-model="browser">
          <option v-for="browserOption in availableBrowsers" :key="browserOption" :value="browserOption">
            {{ getBrowserDisplayName(browserOption) }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Version</label>
        <input v-model="version" type="text" placeholder="e.g., 130" />
      </div>

      <div class="form-group">
        <label>Target Status</label>
        <select v-model="status">
          <option value="full">Full support</option>
          <option value="partial">Partial support</option>
        </select>
      </div>
    </template>

    <template v-else-if="triggerType === 'usage_threshold'">
      <div class="form-group">
        <label>Usage type</label>
        <select v-model="usageType">
          <option value="full">Full support only</option>
          <option value="total">Full + Partial</option>
        </select>
      </div>

      <div class="form-group">
        <label>Threshold: {{ threshold }}%</label>
        <input v-model.number="threshold" type="range" min="1" max="100" step="1" />
      </div>
    </template>

    <template v-else-if="triggerType === 'baseline_status'">
      <div class="form-group">
        <label>Target baseline</label>
        <select v-model="baselineStatus">
          <option value="low">Newly available (low)</option>
          <option value="high">Widely available (high)</option>
        </select>
      </div>
    </template>

    <button @click="handleAddTrigger">+ Add Trigger</button>

    <div v-if="triggers.length > 0" class="triggers-list">
      <h4>Configured Triggers ({{ triggers.length }})</h4>
      <div v-for="(trigger, index) in triggers" :key="index" class="trigger-item">
        <span>{{ getTriggerDescription(trigger) }}</span>
        <button @click="handleRemoveTrigger(index)">Remove</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trigger-builder {
  display: flex;
  flex-direction: column;
  gap: var(--space-16px);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group input[type="range"] {
  width: 100%;
}

.triggers-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12px)
}

.trigger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
