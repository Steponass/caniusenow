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
  triggers,
  addTrigger: composableAddTrigger,
  removeTrigger: composableRemoveTrigger,
} = useFeatureUrl();

const availableBrowsers = computed(() => {
  return Object.keys(props.feature.support);
});

const browserVersionsForSelected = computed(() => {
  const browserSupport = props.feature.support[browser.value];
  if (!browserSupport || !browserSupport.versions) return [];
  return browserSupport.versions.map((v) => v.version);
});

function handleAddTrigger() {
  if (triggerType.value === "browser_version" && !version.value) {
    alert("Please enter a version number");
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
  } else {
    const usageLabel =
      trigger.usageType === "full"
        ? "full support"
        : trigger.usageType === "partial"
          ? "partial support"
          : trigger.usageType === "combined"
            ? "total (full + partial)"
            : "total (full + partial)";
    return `${usageLabel} usage ≥ ${trigger.threshold}%`;
  }
}
</script>

<template>
  <div class="trigger-builder">
    <div class="trigger-form">
      <div class="form-group">
        <label>Trigger Type</label>
        <select v-model="triggerType">
          <option value="browser_support">Browser Support</option>
          <option value="browser_version">Specific Browser Version</option>
          <option value="usage_threshold">Usage Threshold</option>
        </select>
      </div>

      <template v-if="triggerType === 'browser_support'">
        <div class="form-group">
          <label>Browser</label>
          <select v-model="browser">
            <option
              v-for="browserOption in availableBrowsers"
              :key="browserOption"
              :value="browserOption"
            >
              {{ getBrowserDisplayName(browserOption) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Target Status</label>
          <select v-model="status">
            <option value="full">Full Support</option>
            <option value="partial">Partial Support</option>
          </select>
        </div>
      </template>

      <template v-else-if="triggerType === 'browser_version'">
        <div class="form-group">
          <label>Browser</label>
          <select v-model="browser">
            <option
              v-for="browserOption in availableBrowsers"
              :key="browserOption"
              :value="browserOption"
            >
              {{ getBrowserDisplayName(browserOption) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Version</label>
          <input
            v-model="version"
            type="text"
            placeholder="e.g., 130"
            list="version-suggestions"
          />
          <datalist id="version-suggestions">
            <option
              v-for="versionOption in browserVersionsForSelected.slice(0, 5)"
              :key="versionOption"
              :value="versionOption"
            />
          </datalist>
          <small v-if="browserVersionsForSelected.length > 0" class="hint">
            Recent versions:
            {{ browserVersionsForSelected.slice(0, 3).join(", ") }}
          </small>
        </div>

        <div class="form-group">
          <label>Target Status</label>
          <select v-model="status">
            <option value="full">Full Support</option>
            <option value="partial">Partial Support</option>
          </select>
        </div>
      </template>

      <template v-else-if="triggerType === 'usage_threshold'">
        <div class="form-group">
          <label>Usage Type</label>
          <select v-model="usageType">
            <option value="full">Full Support Only</option>
            <option value="partial">Partial Support Only</option>
            <option value="total">Total (Full + Partial)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Threshold: {{ threshold }}%</label>
          <input
            v-model.number="threshold"
            type="range"
            min="20"
            max="100"
            step="1"
          />
        </div>
      </template>

      <button @click="handleAddTrigger">+ Add Trigger</button>
    </div>

    <div v-if="triggers.length > 0" class="triggers-list">
      <h4>Configured Triggers ({{ triggers.length }})</h4>
      <div
        v-for="(trigger, index) in triggers"
        :key="index"
        class="trigger-item"
      >
        <span>{{ getTriggerDescription(trigger) }}</span>
        <button @click="handleRemoveTrigger(index)">Remove</button>
      </div>
    </div>

    <div v-else>
      <p>No triggers configured yet. Add at least one to start tracking.</p>
    </div>
  </div>
</template>

<style scoped>
.trigger-builder {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trigger-form {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group input[type="range"] {
  width: 100%;
}

.form-group .hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: -0.25rem;
}

.triggers-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.trigger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
}
</style>
