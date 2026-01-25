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

async function handleMarkComplete() {
  if (confirm('Mark this feature as completed?')) {
    await trackingStore.markAsCompleted(props.tracking.id);
  }
}

async function handleDelete() {
  if (confirm('Delete this tracking?')) {
    await trackingStore.deleteTracking(props.tracking.id);
  }
}

function getTriggerDescription(trigger: any): string {
  if (trigger.type === 'browser_support') {
    return `${getBrowserDisplayName(trigger.browser)} has ${trigger.targetStatus} support`;
  } else if (trigger.type === 'browser_version') {
    return `${getBrowserDisplayName(trigger.browser)} ${trigger.version}+ has ${trigger.targetStatus} support`;
  } else {
    const usageLabel = trigger.usageType === 'full' ? 'full support' :
                      trigger.usageType === 'partial' ? 'partial support' :
                      (trigger.usageType === 'combined') ? 'total (full + partial)' :
                      'total (full + partial)';
    return `${usageLabel} usage ≥ ${trigger.threshold}%`;
  }
}
</script>

<template>
  <div class="tracking-card">
    <div class="card-header">
      <FormattedText :text="tracking.feature_title" tag="h3" />
      <span 
        class="status-badge"
        :class="tracking.status"
      >
        {{ tracking.status }}
      </span>
    </div>

    <div>
      <div>
        <strong>Triggers:</strong>
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
      <button 
        v-if="tracking.status === 'notified'"
        @click="handleMarkComplete"
      >
        Mark Complete
      </button>
      <button @click="handleDelete">
        Delete
      </button>
    </div>
  </div>
</template>

<style scoped>
.tracking-card {
  background: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.notified {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.completed {
  background: #e5e7eb;
  color: #374151;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

</style>