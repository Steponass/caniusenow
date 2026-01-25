<script setup lang="ts">
import { ref, computed } from "vue";
import type { NormalizedFeature } from "@/types/feature";
import { getBrowserDisplayName } from "@/types/feature";
import type {
  Trigger,
  BrowserSupportTrigger,
  BrowserVersionTrigger,
  UsageThresholdTrigger,
} from "@/types/featureTracking";

interface Props {
  feature: NormalizedFeature;
  triggers: Trigger[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:triggers": [triggers: Trigger[]];
}>();

type TriggerType = "browser_support" | "browser_version" | "usage_threshold";

const selectedType = ref<TriggerType>("browser_support");
const selectedBrowser = ref("chrome");
const selectedStatus = ref<"full" | "partial">("full");
const selectedVersion = ref("");
const selectedUsageType = ref<"full" | "partial" | "combined">("combined");
const selectedThreshold = ref(95);

const availableBrowsers = computed(() => {
  return Object.keys(props.feature.support);
});

const browserVersionsForSelected = computed(() => {
  const browserSupport = props.feature.support[selectedBrowser.value];
  if (!browserSupport || !browserSupport.versions) return [];
  return browserSupport.versions.map((v) => v.version);
});

function addTrigger() {
  let newTrigger: Trigger;

  if (selectedType.value === "browser_support") {
    newTrigger = {
      type: "browser_support",
      browser: selectedBrowser.value,
      targetStatus: selectedStatus.value,
    } as BrowserSupportTrigger;
  } else if (selectedType.value === "browser_version") {
    if (!selectedVersion.value) {
      alert("Please enter a version number");
      return;
    }
    newTrigger = {
      type: "browser_version",
      browser: selectedBrowser.value,
      version: selectedVersion.value,
      targetStatus: selectedStatus.value,
    } as BrowserVersionTrigger;
  } else {
    newTrigger = {
      type: "usage_threshold",
      usageType: selectedUsageType.value,
      threshold: selectedThreshold.value,
    } as UsageThresholdTrigger;
  }

  emit("update:triggers", [...props.triggers, newTrigger]);
}

function removeTrigger(index: number) {
  const updated = props.triggers.filter((_, i) => i !== index);
  emit("update:triggers", updated);
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
        <select v-model="selectedType">
          <option value="browser_support">Browser Support</option>
          <option value="browser_version">Specific Browser Version</option>
          <option value="usage_threshold">Usage Threshold</option>
        </select>
      </div>

      <template v-if="selectedType === 'browser_support'">
        <div class="form-group">
          <label>Browser</label>
          <select v-model="selectedBrowser">
            <option
              v-for="browser in availableBrowsers"
              :key="browser"
              :value="browser"
            >
              {{ getBrowserDisplayName(browser) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Target Status</label>
          <select v-model="selectedStatus">
            <option value="full">Full Support</option>
            <option value="partial">Partial Support</option>
          </select>
        </div>
      </template>

      <template v-else-if="selectedType === 'browser_version'">
        <div class="form-group">
          <label>Browser</label>
          <select v-model="selectedBrowser">
            <option
              v-for="browser in availableBrowsers"
              :key="browser"
              :value="browser"
            >
              {{ getBrowserDisplayName(browser) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Version</label>
          <input
            v-model="selectedVersion"
            type="text"
            placeholder="e.g., 130"
            list="version-suggestions"
          />
          <datalist id="version-suggestions">
            <option
              v-for="version in browserVersionsForSelected.slice(0, 5)"
              :key="version"
              :value="version"
            />
          </datalist>
          <small v-if="browserVersionsForSelected.length > 0" class="hint">
            Recent versions:
            {{ browserVersionsForSelected.slice(0, 3).join(", ") }}
          </small>
        </div>

        <div class="form-group">
          <label>Target Status</label>
          <select v-model="selectedStatus">
            <option value="full">Full Support</option>
            <option value="partial">Partial Support</option>
          </select>
        </div>
      </template>

      <template v-else-if="selectedType === 'usage_threshold'">
        <div class="form-group">
          <label>Usage Type</label>
          <select v-model="selectedUsageType">
            <option value="full">Full Support Only</option>
            <option value="partial">Partial Support Only</option>
            <option value="total">Total (Full + Partial)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Threshold: {{ selectedThreshold }}%</label>
          <input
            v-model.number="selectedThreshold"
            type="range"
            min="20"
            max="100"
            step="1"
          />
        </div>
      </template>

      <button @click="addTrigger">+ Add Trigger</button>
    </div>

    <div v-if="triggers.length > 0" class="triggers-list">
      <h4>Configured Triggers ({{ triggers.length }})</h4>
      <div
        v-for="(trigger, index) in triggers"
        :key="index"
        class="trigger-item"
      >
        <span>{{ getTriggerDescription(trigger) }}</span>
        <button @click="removeTrigger(index)">Remove</button>
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
