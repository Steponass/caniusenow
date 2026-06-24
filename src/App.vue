<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useFeatureStore } from "@stores/featureStore";
import { useAuthStore } from "@stores/authStore";
import { useTrackingStore } from "@stores/featureTrackingStore";
import { useFeatureUrl } from "@/composables/useFeatureUrl";

import AppHeader from "@components/AppHeader.vue";
import AppFooter from "@components/AppFooter.vue";
import AuthModal from "@components/AuthModal.vue";
import FeatureGrid from "@components/FeatureGrid.vue";
import FeatureDetailModal from "@components/FeatureDetailModal.vue";
import TrackingDashboard from "@components/TrackingDashboard.vue";
import ScrollToTop from "@components/ScrollToTop.vue";

import type { NormalizedFeature } from "@/types/feature";
import type { FeatureTracking } from "@/types/featureTracking";
import IntroModal from "@components/IntroModal.vue";

const featureStore = useFeatureStore();
const authStore = useAuthStore();
const trackingStore = useTrackingStore();
const {
  featureId,
  triggers,
  setFeature,
  clearUrl,
  resetTriggerState,
  setTriggers,
} = useFeatureUrl();

const appHeader = ref<InstanceType<typeof AppHeader>>();
const isAuthModalOpen = ref(false);
const isFeatureModalOpen = ref(false);
const selectedFeature = ref<NormalizedFeature | null>(null);
const selectedTracking = ref<FeatureTracking | null>(null);
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
    showTrackingDashboard.value = true;
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
  selectedTracking.value = null;
  resetTriggerState();
  clearUrl();
}

function handleTrackingFeatureClick(
  feature: NormalizedFeature,
  tracking: FeatureTracking,
): void {
  selectedFeature.value = feature;
  selectedTracking.value = tracking;
  setTriggers(tracking.triggers);
  setFeature(feature.id);
  isFeatureModalOpen.value = true;
}

async function handleSaveTracking(): Promise<void> {
  if (!selectedTracking.value) return;

  try {
    await trackingStore.updateTracking(
      selectedTracking.value.id,
      { triggers: triggers.value },
    );
    handleCloseFeatureModal();
  } catch (error) {
    console.error("Failed to save tracking changes:", error);
    alert("Failed to save changes. Contact Step!");
  }
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
  if (showTrackingDashboard.value) {
    appHeader.value?.clearSearch();
    searchQuery.value = "";
  }
}

function handleSearch(query: string) {
  searchQuery.value = query;
}
</script>

<template>
  <div id="app">
    <AppHeader ref="appHeader" @open-auth-modal="handleOpenAuthModal" @search="handleSearch" />

    <main>

      <IntroModal/>
        <section class="top-panel" v-if="authStore.isAuthenticated">
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

        <section v-if="!showTrackingDashboard || filteredFeatures.length > 0" class="feature-section">
          <FeatureGrid :features="filteredFeatures" @feature-click="handleFeatureClick" />
        </section>

        <section
          v-if="authStore.isAuthenticated && showTrackingDashboard && filteredFeatures.length === 0"
        >
          <h2>My Tracked Features</h2>
          <TrackingDashboard
          @feature-click="handleTrackingFeatureClick"
          />
        </section>
          <ScrollToTop/>
    </main>

    <AuthModal :is-open="isAuthModalOpen" @close="handleCloseAuthModal" />

    <FeatureDetailModal
      :feature="selectedFeature"
      :is-open="isFeatureModalOpen"
      :existing-tracking="selectedTracking"
      @close="handleCloseFeatureModal"
      @start-tracking="handleStartTracking"
      @save-changes="handleSaveTracking"
    />
  </div>

  <AppFooter />
</template>

<style scoped>
#app {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background: var(--clr-bg-base);
}

main {
  width: min(1920px, 100%);
  margin-inline: auto;
  padding-inline: var(--space-16px);
  margin-top: var(--space-24-32px);
}

/* .feature-section {
  display: flex;
  justify-content: center;
} */

section h2 {
  margin-block: var(--space-16-24px);
  padding-block-end: var(--space-16px);
}
</style>
