import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  FeatureIndex,
  NormalizedFeature,
  FeatureCache,
} from "@/types/feature";

export const useFeatureStore = defineStore("featureStore", () => {
  const index = ref<FeatureIndex[]>([]);
  const featureCache = ref<FeatureCache>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isLoaded = computed(() => index.value.length > 0);
  const featureCount = computed(() => index.value.length);

  async function loadIndex() {
    if (index.value.length > 0) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch("/data/index.json");

      if (!response.ok) {
        throw new Error(`Failed to load index: ${response.statusText}`);
      }

      const indexData = (await response.json()) as FeatureIndex[];
      index.value = indexData;

      console.log(`✅ Loaded index with ${indexData.length} features`);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load index";
      console.error("Error loading feature index:", err);
    } finally {
      loading.value = false;
    }
  }

  async function loadFeature(
    featureId: string,
  ): Promise<NormalizedFeature | null> {
    // Check cache first
    if (featureCache.value[featureId]) {
      return featureCache.value[featureId];
    }

    try {
      const response = await fetch(`/data/features/${featureId}.json`);

      if (!response.ok) {
        throw new Error(
          `Failed to load feature ${featureId}: ${response.statusText}`,
        );
      }

      const featureData = (await response.json()) as NormalizedFeature;

      // Cache the loaded feature
      featureCache.value[featureId] = featureData;

      return featureData;
    } catch (err) {
      console.error(`Error loading feature ${featureId}:`, err);
      return null;
    }
  }

  function searchFeatures(query: string): FeatureIndex[] {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase().trim();

    return index.value.filter(
      (feature) =>
        feature.name.toLowerCase().includes(lowerQuery) ||
        feature.id.toLowerCase().includes(lowerQuery) ||
        feature.description.toLowerCase().includes(lowerQuery),
    );
  }

  function getFeatureFromIndex(featureId: string): FeatureIndex | null {
    return index.value.find((f) => f.id === featureId) || null;
  }

  function getAllFeaturesFromIndex(): FeatureIndex[] {
    return index.value;
  }

  function getFeatureFromCache(featureId: string): NormalizedFeature | null {
    return featureCache.value[featureId] || null;
  }

  return {
    index,
    featureCache,
    loading,
    error,
    isLoaded,
    featureCount,
    loadIndex,
    loadFeature,
    searchFeatures,
    getFeatureFromIndex,
    getAllFeaturesFromIndex,
    getFeatureFromCache,
  };
});
