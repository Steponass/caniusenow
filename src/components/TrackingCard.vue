<script setup lang="ts">
import { useTrackingStore } from '@stores/featureTrackingStore';
import { getBrowserDisplayName } from '@/types/feature';
import FormattedText from "./FormattedText.vue";
import type { FeatureTracking } from '@/types/featureTracking';

interface Props {
  tracking: FeatureTracking;
}

const props = defineProps<Props>();

const trackingStore = useTrackingStore();

async function handleDelete() {
  if (confirm('Sure you\'re done tracking this?')) {
    await trackingStore.deleteTracking(props.tracking.id);
  }
}

function getTriggerDescription(trigger: any): string {
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
</script>

<template>
  <div class="tracking-card">
    <div class="card-header">
      <FormattedText :text="tracking.feature_title" tag="h4" />
      <span 
        class="status-badge"
        :class="tracking.status"
      >
        {{ tracking.status }}
      </span>
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

      <div v-if="tracking.notified_at">
        Notified: {{ new Date(tracking.notified_at).toLocaleDateString() }}
      </div>
    </div>

    <div class="card-actions">
      <button @click="handleDelete">
        Delete
      </button>
    </div>
  </div>
</template>

<style scoped>
.tracking-card {
  padding: var(--space-16px);
  background: var(--clr-bg-raised);
  border-radius: var(--radius-8px);
  box-shadow: var(--shadow-elevation-3);
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

.status-badge {
  padding: var(--space-4px) var(--space-12px);
  border-radius: 9999px;
  text-transform: uppercase;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

</style>