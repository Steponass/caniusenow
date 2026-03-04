<script setup lang="ts">
import { computed } from 'vue';
import { useTrackingStore } from '@stores/featureTrackingStore';
import type { NormalizedFeature } from '@/types/feature';
import type { FeatureTracking } from '@/types/featureTracking';
import TrackingCard from './TrackingCard.vue';

type Tab = 'active' | 'notified';

const trackingStore = useTrackingStore();

const emit = defineEmits<{
  featureClick: [feature: NormalizedFeature, tracking: FeatureTracking];
}>();

const activeTab = defineModel<Tab>('activeTab', { default: 'active' });

const displayedTrackings = computed(() => {
  switch (activeTab.value) {
    case 'active':
      return trackingStore.activeTrackings;
    case 'notified':
      return trackingStore.notifiedTrackings;
    default:
      return [];
  }
});
</script>

<template>
  <div class="tracking-dashboard">
    <div class="tabs">
      <button
        :class="{ active: activeTab === 'active' }"
        @click="activeTab = 'active'"
      >
        Active ({{ trackingStore.activeTrackings.length }})
      </button>
      <button
        :class="{ active: activeTab === 'notified' }"
        @click="activeTab = 'notified'"
      >
        Notified ({{ trackingStore.notifiedTrackings.length }})
      </button>
    </div>

    <div v-if="trackingStore.loading">
      Loading trackings...
    </div>

    <div v-else-if="displayedTrackings.length === 0">
      <p v-if="activeTab === 'active'">
        Nothing tracked yet!
      </p>
      <p v-else="activeTab === 'notified'">
        Features when your notification criteria are met.
      </p>
    </div>

    <div v-else class="tracking-list">
      <TrackingCard
        v-for="tracking in displayedTrackings"
        :key="tracking.id"
        :tracking="tracking"
        @feature-click="(feature, tracking) => emit('featureClick', feature, tracking)"

      />
    </div>
  </div>
</template>

<style scoped>

.tabs {
  display: flex;
  gap: var(--space-8-12px);
  padding-block-end: var(--space-24-32px);
}

.tracking-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  grid-auto-rows: auto;
  gap: var(--space-16-24px);
}
</style>