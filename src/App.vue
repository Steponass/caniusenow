<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCaniuseStore } from './stores/featureStore';
import { useAuthStore } from './stores/authStore';
import { useTrackingStore } from './stores/featureTrackingStore';
import AppHeader from './components/AppHeader.vue';
import AuthModal from './components/AuthModal.vue';
import FeatureGrid from './components/FeatureGrid.vue';
import FeatureDetailModal from './components/FeatureDetailModal.vue';
import TrackingDashboard from './components/TrackingDashboard.vue';
import type { NormalizedFeature } from './types/caniuse';
import type { Trigger } from './types/featureTracking';

const featureStore = useCaniuseStore();
const authStore = useAuthStore();
const trackingStore = useTrackingStore();

const isAuthModalOpen = ref(false);
const isFeatureModalOpen = ref(false);
const selectedFeature = ref<NormalizedFeature | null>(null);
const showTrackingDashboard = ref(false);

onMounted(async () => {
  await authStore.initialize();
  await featureStore.loadIndex();

  if (authStore.isAuthenticated) {
    await trackingStore.loadUserTrackings();
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
}

function handleCloseFeatureModal() {
  isFeatureModalOpen.value = false;
  selectedFeature.value = null;
}

async function handleStartTracking(triggers: Trigger[]) {
  if (!selectedFeature.value) return;

  try {
    await trackingStore.addTracking(
      selectedFeature.value.id,
      selectedFeature.value.name,
      triggers
    );

    handleCloseFeatureModal();
    showTrackingDashboard.value = true;
  } catch (error) {
    console.error('Failed to start tracking:', error);
    alert('Failed to start tracking. Please try again.');
  }
}

function toggleTrackingDashboard() {
  showTrackingDashboard.value = !showTrackingDashboard.value;
}
</script>

<template>
  <div id="app">
    <AppHeader @open-auth-modal="handleOpenAuthModal" />

    <main class="main-content">
      <div class="container">
        <section class="hero-section">
          <h1 class="hero-title">Browser Feature Compatibility Tracker</h1>
          <p class="hero-subtitle">
            Track web platform features and get notified when they reach your target browser support
          </p>
        </section>

        <section v-if="authStore.isAuthenticated" class="tracking-toggle">
          <button class="toggle-btn" @click="toggleTrackingDashboard">
            {{ showTrackingDashboard ? 'Browse Features' : 'My Trackings' }}
            <span v-if="!showTrackingDashboard && trackingStore.activeTrackings.length > 0" class="badge">
              {{ trackingStore.activeTrackings.length }}
            </span>
          </button>
        </section>

        <section v-if="!showTrackingDashboard" class="features-section">
          <FeatureGrid @feature-click="handleFeatureClick" />
        </section>

        <section v-else-if="authStore.isAuthenticated" class="dashboard-section">
          <h2>My Tracked Features</h2>
          <TrackingDashboard />
        </section>

        <section v-else class="auth-prompt">
          <p>Sign in to view your tracked features</p>
          <button class="btn-primary" @click="handleOpenAuthModal">
            Sign In
          </button>
        </section>
      </div>
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

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: #111827;
  background-color: #f9fafb;
  line-height: 1.6;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
  font-size: 1rem;
}

input,
select {
  font-family: inherit;
  font-size: 1rem;
}

h1, h2, h3, h4, h5, h6 {
  line-height: 1.2;
}

a {
  color: inherit;
  text-decoration: none;
}
</style>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 2rem 1rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  margin-bottom: 3rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  max-width: 700px;
  margin: 0 auto;
}

.tracking-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.toggle-btn {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-btn:hover {
  background: #2563eb;
}

.toggle-btn .badge {
  background: #1e40af;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
}

.features-section {
  margin-bottom: 2rem;
}

.dashboard-section h2 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
}

.auth-prompt {
  text-align: center;
  padding: 4rem 2rem;
}

.auth-prompt p {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .main-content {
    padding: 1rem 0.5rem;
  }
}
</style>
