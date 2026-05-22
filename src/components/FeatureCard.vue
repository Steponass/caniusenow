<script setup lang="ts">
import FormattedText from "./FormattedText.vue";
import { useFeatureStore } from "@stores/featureStore";
import type { FeatureIndex, NormalizedFeature } from "@/types/feature";

interface FeatureCardProps {
  feature: FeatureIndex;
}

const props = defineProps<FeatureCardProps>();

const emit = defineEmits<{
  featureClick: [feature: NormalizedFeature];
}>();

const featureStore = useFeatureStore();

async function handleFeatureCardClick(): Promise<void> {
  const fullFeature = await featureStore.loadFeature(props.feature.id);
  if (fullFeature) {
    emit("featureClick", fullFeature);
  }
}

function getStatusColor(usage: number): string {
  if (usage >= 95) return "var(--clr-high-support)";
  if (usage >= 80) return "var(--clr-medium-support)";
  return "var(--clr-low-support)";
}

const usagePercentage = Math.round(props.feature.usage);
const statusColor = getStatusColor(props.feature.usage);
</script>


<template>
      <div
        :key="feature.id"
        class="feature-card"
        tabindex="1"
        @click="handleFeatureCardClick"
        @keydown.enter="handleFeatureCardClick"
        @keydown.space="handleFeatureCardClick"
      >
        <div class="card-header">
        <FormattedText :text="feature.name" tag="h6" class="feature-title"/>
          <div
            class="feature-usage-badge"
            :style="{ backgroundColor: statusColor }"
          >
            <p>{{usagePercentage}}%</p>
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
</template>

<style scoped>

.feature-card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
  row-gap: var(--space-12-16px);
  padding: var(--space-16px);
  background: var(--clr-bg-raised);
  border-radius: var(--radius-8px);
  box-shadow: var(--shadow-elevation-3), var(--shadow-elevation-1);
  cursor: pointer;
  transition: var(--transition-hover);
  @media (hover: hover) {
    &:hover {
      box-shadow: var(--shadow-elevation-5);
      transform: translateY(-2px);

    }
  }
  &:active {
    transform: translateY(1px);
      box-shadow: var(--shadow-elevation-2);
  }
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
  min-width: 6ch;
  text-align: center;
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