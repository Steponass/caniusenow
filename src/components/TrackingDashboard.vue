<script setup lang="ts">
import { computed } from 'vue';
import { useTrackingStore } from '../stores/featureTrackingStore';
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
        No active trackings. Search for features to start tracking.
      </p>
      <p v-else-if="activeTab === 'notified'">
        You'll see features here when your notification criteria are met.
      </p>
      <p v-else>
        Features you've marked as complete will appear here.
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
  gap: 0.5rem;
}

.tabs button {
  padding: 0.75rem 1.5rem;
}


.tracking-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>