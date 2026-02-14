<script setup lang="ts">
import { useFeatureStore } from "@stores/featureStore";
import type { FeatureIndex, NormalizedFeature } from "@/types/feature";
import FormattedText from "./FormattedText.vue";

interface Props {
  features: FeatureIndex[];
}

const props = defineProps<Props>();

const featureStore = useFeatureStore();

const emit = defineEmits<{
  featureClick: [feature: NormalizedFeature];
}>();

async function handleFeatureClick(feature: FeatureIndex) {
  // Load full feature data when card is clicked
  const fullFeature = await featureStore.loadFeature(feature.id);
  if (fullFeature) {
    emit("featureClick", fullFeature);
  }
}

function getStatusColor(usage: number): string {
  if (usage >= 95) return "#0C8D62";
  if (usage >= 80) return "#BA7908";
  return "#CA4E4E";
}

</script>

<template>
    <div v-if="features.length > 0" class="feature-grid">
      <!-- Feature Card -->
      <div
        v-for="feature in features"
        :key="feature.id"
        class="feature-card"
        tabindex="1"
        @click="handleFeatureClick(feature)"
      >
        <div class="card-header">
        <FormattedText :text="feature.name" tag="h6" class="feature-title"/>
          <div
            class="feature-usage-badge"
            :style="{ backgroundColor: getStatusColor(feature.usage) }"
          >
            <p>{{ Math.round(feature.usage) }}%</p>
          </div>
        </div>

        <!-- Feature Description -->
        <FormattedText :text="feature.description" tag="p" class="feature-description" />
          <div class="card-meta-row">
            <span
              class="category-badge"
            >
              {{ feature.category }}
            </span>

            <img
              v-if="feature.baseline"
              class="baseline-badge"
              :src="`/images/Baseline-${feature.baseline}.svg`"
              :alt="`Baseline ${feature.baseline}`"
            />
          </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <h5>Use the search bar to find features</h5>
    </div>
</template>

<style scoped>

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  grid-auto-rows: auto;
  gap: var(--space-16-24px);
}

.feature-card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
  row-gap: 0;
  padding: var(--space-16px);
  background: var(--clr-bg-raised);
  border-radius: var(--radius-8px);
  box-shadow: var(--shadow-elevation-3);
  cursor: pointer;
  transition: var(--transition-hover);
}

.feature-card:hover {
  box-shadow: var(--shadow-elevation-5);
  transform: translateY(-2px);
}

.card-header {
  max-width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-12-16px);
}

.feature-title {
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;
  word-break: break-word;
}

.feature-usage-badge {
  padding: var(--space-4px) var(--space-8px);
  border-radius: var(--radius-16px);
}

.feature-usage-badge p {
    color: white;
}

.feature-description {
  color: var(--clr-text-weak);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.baseline-badge {
  max-height: var(--space-16px);
}


</style>
