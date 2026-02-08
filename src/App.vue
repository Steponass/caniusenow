<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useFeatureStore } from "@stores/featureStore";
import { useAuthStore } from "@stores/authStore";
import { useTrackingStore } from "@stores/featureTrackingStore";
import { useFeatureUrl } from "@/composables/useFeatureUrl";

import AppHeader from "@components/AppHeader.vue";
import AuthModal from "@components/AuthModal.vue";
import FeatureGrid from "@components/FeatureGrid.vue";
import FeatureDetailModal from "@components/FeatureDetailModal.vue";
import TrackingDashboard from "@components/TrackingDashboard.vue";

import type { NormalizedFeature } from "@/types/feature";

const featureStore = useFeatureStore();
const authStore = useAuthStore();
const trackingStore = useTrackingStore();
const {
  featureId,
  triggers,
  setFeature,
  clearUrl,
  resetTriggerState,
} = useFeatureUrl();

const isAuthModalOpen = ref(false);
const isFeatureModalOpen = ref(false);
const selectedFeature = ref<NormalizedFeature | null>(null);
const showTrackingDashboard = ref(false);
const searchQuery = ref("");

const filteredFeatures = computed(() => {
  if (searchQuery.value.trim().length < 2) {
    return [];
  }
  return featureStore.searchFeatures(searchQuery.value);
});

onMounted(async () => {
  await authStore.initialize();
  await featureStore.loadIndex();

  if (authStore.isAuthenticated) {
    await trackingStore.loadUserTrackings();
  }

  // If feature ID is in URL (from composable), load and open modal
  if (featureId.value) {
    const feature = await featureStore.loadFeature(featureId.value);
    if (feature) {
      selectedFeature.value = feature;
      isFeatureModalOpen.value = true;
    }
  }
});

// Watch for URL-driven feature changes (e.g., browser back/forward)
watch(featureId, async (newFeatureId, oldFeatureId) => {
  // Feature removed from URL (user hit back)
  if (!newFeatureId && oldFeatureId && isFeatureModalOpen.value) {
    isFeatureModalOpen.value = false;
    selectedFeature.value = null;
    return;
  }

  // Feature added to URL (external navigation)
  if (newFeatureId && newFeatureId !== selectedFeature.value?.id) {
    const feature = await featureStore.loadFeature(newFeatureId);
    if (feature) {
      selectedFeature.value = feature;
      isFeatureModalOpen.value = true;
    }
  }
});


function handleOpenAuthModal() {
  isAuthModalOpen.value = true;
}

function handleCloseAuthModal() {
  isAuthModalOpen.value = false;
}

function handleFeatureClick(feature: NormalizedFeature) {
  selectedFeature.value = feature;
  isFeatureModalOpen.value = true;
  setFeature(feature.id);
}

function handleCloseFeatureModal() {
  isFeatureModalOpen.value = false;
  selectedFeature.value = null;
  resetTriggerState();
  clearUrl();
}

async function handleStartTracking() {
  if (!selectedFeature.value) return;

  if (!authStore.isAuthenticated) {
    handleOpenAuthModal();
    return;
  }

  try {
    await trackingStore.addTracking(
      selectedFeature.value.id,
      selectedFeature.value.name,
      triggers.value,
    );

    handleCloseFeatureModal();
    showTrackingDashboard.value = true;
  } catch (error) {
    console.error("Failed to start tracking:", error);
    alert("Failed to add tracking. Contact Step!");
  }
}

function toggleTrackingDashboard() {
  showTrackingDashboard.value = !showTrackingDashboard.value;
}

function handleSearch(query: string) {
  searchQuery.value = query;
}
</script>

<template>
  <div id="app">
    <AppHeader @open-auth-modal="handleOpenAuthModal" @search="handleSearch" />

    <main>
        <section v-if="authStore.isAuthenticated">
          <button @click="toggleTrackingDashboard">
            {{ showTrackingDashboard ? "Browse Features" : "My Trackings" }}
            <span
              v-if="
                !showTrackingDashboard &&
                trackingStore.activeTrackings.length > 0
              "
            >
              {{ trackingStore.activeTrackings.length }}
            </span>
          </button>
        </section>

        <section v-if="!showTrackingDashboard" class="features-section">
          <FeatureGrid :features="filteredFeatures" @feature-click="handleFeatureClick" />
        </section>

        <section
          v-else="authStore.isAuthenticated"
        >
          <h2>My Tracked Features</h2>
          <TrackingDashboard />
        </section>
    </main>

    <AuthModal :is-open="isAuthModalOpen" @close="handleCloseAuthModal" />

    <FeatureDetailModal
      :feature="selectedFeature"
      :is-open="isFeatureModalOpen"
      @close="handleCloseFeatureModal"
      @start-tracking="handleStartTracking"
    />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--clr-bg-base);
}

main {
  width: min(1920px, 98%);
  margin-inline: auto;
  margin-top: var(--space-24-32px);
}

</style>
