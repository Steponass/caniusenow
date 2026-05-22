<script setup lang="ts">
import type { FeatureIndex, NormalizedFeature } from "@/types/feature";
import FeatureCard from "./FeatureCard.vue";

interface FeatureGridProps {
  features: FeatureIndex[];
}

const props = defineProps<FeatureGridProps>();

const emit = defineEmits<{
  featureClick: [feature: NormalizedFeature];
}>();

function handleFeatureCardClick(feature: NormalizedFeature): void {
  emit("featureClick", feature);
}

</script>

<template>
    <section v-if="features.length > 0" class="feature-grid">
      <FeatureCard
      v-for="feature in features"
      :key="feature.id"
      :feature="feature"
      @feature-click="handleFeatureCardClick"
    />
    </section>

    <!-- Empty State -->
    <section v-else class="empty-state">
      <h5>Use the search bar to find features</h5>
    </section>
</template>

<style scoped>

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  grid-auto-rows: auto;
  gap: var(--space-16-24px);
}

.empty-state {
  padding: var(--space-24-32px);
  text-align: center;
}

</style>
