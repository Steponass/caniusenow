<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCaniuseStore } from '../stores/featureStore';
import type { FeatureIndex, NormalizedFeature } from '../types/caniuse';

const featureStore = useCaniuseStore();

const emit = defineEmits<{
  featureClick: [feature: NormalizedFeature];
}>();

const searchQuery = ref('');

const filteredFeatures = computed(() => {
  // Only filter when search query has 2+ characters
  if (searchQuery.value.trim().length < 2) {
    return [];
  }

  return featureStore.searchFeatures(searchQuery.value);
});

const hasSearchQuery = computed(() => searchQuery.value.trim().length >= 2);

async function handleFeatureClick(feature: FeatureIndex) {
  // Load full feature data when card is clicked
  const fullFeature = await featureStore.loadFeature(feature.id);
  if (fullFeature) {
    emit('featureClick', fullFeature);
  }
}

function getStatusColor(usage: number): string {
  if (usage >= 95) return '#10b981';
  if (usage >= 80) return '#f59e0b';
  return '#ef4444';
}

function getSupportStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'y': 'Full',
    'a': 'Partial',
    'n': 'None',
    'p': 'Prefix',
    'd': 'Disabled',
    'x': 'Prefixed',
    'u': 'Unknown'
  };
  return statusMap[status] || 'Unknown';
}

function getBaselineBadgeColor(baseline: string | false): string {
  if (baseline === 'high') return '#10b981';
  if (baseline === 'low') return '#f59e0b';
  return '#6b7280';
}

function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    'CSS': '#3b82f6',
    'HTML5': '#ef4444',
    'JS API': '#f59e0b',
    'SVG': '#8b5cf6',
    'Other': '#6b7280'
  };
  return categoryColors[category] || '#6b7280';
}
</script>

<template>
  <div class="feature-grid-container">
    <!-- Search Bar Integration -->
    <div class="search-section">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search features (min 2 characters)..."
          class="search-input"
        />
        <span v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
          ✕
        </span>
      </div>

      <div v-if="searchQuery.trim().length > 0 && searchQuery.trim().length < 2" class="search-hint">
        Type at least 2 characters to search
      </div>

      <div v-if="hasSearchQuery" class="search-results-info">
        Found {{ filteredFeatures.length }} feature{{ filteredFeatures.length !== 1 ? 's' : '' }}
      </div>
    </div>

    <!-- Feature Grid -->
    <div v-if="hasSearchQuery && filteredFeatures.length > 0" class="feature-grid">
      <!-- Feature Card (inline component) -->
      <div
        v-for="feature in filteredFeatures"
        :key="feature.id"
        class="feature-card"
        @click="handleFeatureClick(feature)"
      >
        <div class="card-header">
          <h3 class="feature-title">{{ feature.name }}</h3>
          <div
            class="usage-badge"
            :style="{ backgroundColor: getStatusColor(feature.usage) }"
          >
            {{ Math.round(feature.usage) }}%
          </div>
        </div>

        <p class="feature-description">{{ feature.description }}</p>

        <div class="card-meta">
          <div class="meta-row">
            <span
              class="category-badge"
              :style="{ backgroundColor: getCategoryColor(feature.category) }"
            >
              {{ feature.category }}
            </span>

            <span
              v-if="feature.baseline"
              class="baseline-badge"
              :style="{ backgroundColor: getBaselineBadgeColor(feature.baseline) }"
            >
              Baseline {{ feature.baseline }}
            </span>
          </div>

          <div class="browser-support-summary">
            <div
              v-for="(status, browser) in feature.support"
              :key="browser"
              class="browser-icon"
              :class="`support-${status}`"
              :title="`${browser}: ${getSupportStatusLabel(status)}`"
            >
              {{ browser }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty States -->
    <div v-else-if="hasSearchQuery && filteredFeatures.length === 0" class="empty-state">
      <p>No features found for "{{ searchQuery }}"</p>
      <p class="empty-state-hint">Try a different search term</p>
    </div>

    <div v-else-if="!hasSearchQuery" class="empty-state">
      <p>Start typing to search features</p>
      <p class="empty-state-hint">Enter at least 2 characters</p>
    </div>
  </div>
</template>

<style scoped>
.feature-grid-container {
  width: 100%;
}

.search-section {
  margin-bottom: 2rem;
}

.search-bar {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.clear-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #6b7280;
  font-size: 1.25rem;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: #374151;
}

.search-hint {
  text-align: center;
  margin-top: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.search-results-info {
  text-align: center;
  margin-top: 1rem;
  color: #374151;
  font-weight: 500;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.feature-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #3b82f6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.feature-title {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  line-height: 1.4;
}

.usage-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.feature-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meta-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-badge,
.baseline-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.browser-support-summary {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.browser-icon {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.browser-icon.support-y {
  background-color: #d1fae5;
  color: #065f46;
}

.browser-icon.support-a {
  background-color: #fef3c7;
  color: #92400e;
}

.browser-icon.support-n {
  background-color: #fee2e2;
  color: #991b1b;
}

.browser-icon.support-p,
.browser-icon.support-x {
  background-color: #e0e7ff;
  color: #3730a3;
}

.browser-icon.support-d,
.browser-icon.support-u {
  background-color: #f3f4f6;
  color: #374151;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-state p {
  margin: 0;
  font-size: 1.125rem;
}

.empty-state-hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #9ca3af;
}
</style>
