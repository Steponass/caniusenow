<script setup lang="ts">
import { computed } from 'vue';
import { useTrackingStore } from '@stores/featureTrackingStore';
import TrackingCard from './TrackingCard.vue';

type Tab = 'active' | 'notified' | 'completed';

const trackingStore = useTrackingStore();

const activeTab = defineModel<Tab>('activeTab', { default: 'active' });

const displayedTrackings = computed(() => {
  switch (activeTab.value) {
    case 'active':
      return trackingStore.activeTrackings;
    case 'notified':
      return trackingStore.notifiedTrackings;
    case 'completed':
      return trackingStore.completedTrackings;
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
      <button
        :class="{ active: activeTab === 'completed' }"
        @click="activeTab = 'completed'"
      >
        Completed ({{ trackingStore.completedTrackings.length }})
      </button>
    </div>

    <div v-if="trackingStore.loading">
      Loading trackings...
    </div>

    <div v-else-if="displayedTrackings.length === 0">
      <p v-if="activeTab === 'active'">
        Nothing being tracked yet!
      </p>
      <p v-else-if="activeTab === 'notified'">
        Features when your notification criteria are met.
      </p>
      <p v-else>
        Features you're done with following appear here.
      </p>
    </div>

    <div v-else class="tracking-list">
      <TrackingCard
        v-for="tracking in displayedTrackings"
        :key="tracking.id"
        :tracking="tracking"
      />
    </div>
  </div>
</template>

<style scoped>

.tabs {
  display: flex;
  gap: var(--space-8-12px);
}

.tracking-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-16-24px);
}
</style>