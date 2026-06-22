<script setup lang="ts">
import { useTrackingStore } from '@stores/featureTrackingStore';
import { getBrowserDisplayName, type NormalizedFeature } from '@/types/feature';
import { useFeatureStore } from "@stores/featureStore";
import FormattedText from "./FormattedText.vue";
import type { FeatureTracking, Trigger } from '@/types/featureTracking';

interface Props {
  tracking: FeatureTracking;
  feature: NormalizedFeature
}

const props = defineProps<Props>();

const trackingStore = useTrackingStore();

const featureStore = useFeatureStore();

const emit = defineEmits<{
  featureClick: [feature: NormalizedFeature, tracking: FeatureTracking];
}>();

async function handleFeatureCardClick(): Promise<void> {
  const fullFeature = await featureStore.loadFeature(props.tracking.feature_id);
  if (fullFeature) {
    emit("featureClick", fullFeature, props.tracking);
  }
}

async function handleDelete() {
  if (confirm('Sure you\'re done tracking this?')) {
    await trackingStore.deleteTracking(props.tracking.id);
  }
}

function getTriggerDescription(trigger: Trigger): string {
  if (trigger.type === 'browser_support') {
    return `${getBrowserDisplayName(trigger.browser)} has ${trigger.targetStatus} support`;
  } else if (trigger.type === 'browser_version') {
    return `${getBrowserDisplayName(trigger.browser)} ${trigger.version}+ has ${trigger.targetStatus} support`;
  } else if (trigger.type === 'usage_threshold') {
    const usageLabel = trigger.usageType === 'full' ? 'full support' :
      trigger.usageType === 'partial' ? 'partial support' :
        (trigger.usageType === 'combined') ? 'total (full + partial)' :
          'total (full + partial)';
    return `${usageLabel} usage ≥ ${trigger.threshold}%`;
  } else {
    const baselineLabel = trigger.targetStatus === 'low'
      ? 'newly available (low)'
      : 'widely available (high)';
    return `Baseline status reaches ${baselineLabel}`;
  }
}

function getStatusColor(usage: number): string {
  if (usage >= 95) return "var(--clr-high-support)";
  if (usage >= 80) return "var(--clr-medium-support)";
  return "var(--clr-low-support)";
}

const usagePercentage = Math.round(props.feature.usage.global.total);
const statusColor = getStatusColor(props.feature.usage.global.total);
</script>

<template>
  <div class="tracking-card" tabindex="1" @click="handleFeatureCardClick" @keydown.enter="handleFeatureCardClick"
    @keydown.space="handleFeatureCardClick">
    <div class="card-header">
      <FormattedText :text="tracking.feature_title" tag="h5" />
      <div class="feature-usage-badge" :style="{ backgroundColor: statusColor }">
        <p>{{ usagePercentage }}%</p>
      </div>
    </div>

    <div>
      <div>
        <h6>Triggers:</h6>
        <ul>
          <li v-for="(trigger, index) in tracking.triggers" :key="index">
            {{ getTriggerDescription(trigger) }}
          </li>
        </ul>
      </div>

      <span class="status-badge" :class="tracking.status">
        {{ tracking.status }}
      </span>
      <div v-if="tracking.notified_at">
        Notified: {{ new Date(tracking.notified_at).toLocaleDateString() }}
      </div>
    </div>

    <div class="card-actions">
      <button @click.stop="handleDelete">
        Delete
      </button>
    </div>
  </div>
</template>

<style scoped>
.tracking-card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
  row-gap: 0;
  padding: var(--space-16px) var(--space-24px);
  background: var(--clr-bg-raised);
  border-radius: var(--radius-8px);
  box-shadow: var(--shadow-elevation-3), var(--shadow-elevation-1);
  cursor: pointer;
  transition: var(--transition-hover);
}

.tracking-card:hover {
  box-shadow: var(--shadow-elevation-5);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: var(--space-12-16px);
}

.feature-usage-badge {
  min-width: 6ch;
  text-align: center;
  padding: var(--space-4px) var(--space-8px);
  border-radius: var(--radius-16px);
}

.status-badge {
  padding: var(--space-4px) var(--space-12px);
  border-radius: 9999px;
  text-transform: uppercase;
}

.card-actions {
  display: flex;
  gap: var(--space-8px);
  padding-top: var(--space-12-16px);
}

ul {
  list-style-position: inside;
}
</style>