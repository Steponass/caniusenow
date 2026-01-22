import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CaniuseData, Feature } from '../types/caniuse';

export const useCaniuseStore = defineStore('featureStore', () => {
  // State
  const data = ref<CaniuseData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isLoaded = computed(() => data.value !== null);
  
  const lastUpdated = computed(() => {
    if (!data.value) return null;
    return new Date(data.value.lastUpdated);
  });

  const featureCount = computed(() => {
    if (!data.value) return 0;
    return Object.keys(data.value.features).length;
  });

  // Actions
  async function loadData() {
    // Already loaded
    if (data.value) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/caniuse-data.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.statusText}`);
      }

      const jsonData = await response.json() as CaniuseData;
      data.value = jsonData;

      console.log(`✅ Loaded ${Object.keys(jsonData.features).length} features`);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load data';
      console.error('Error loading caniuse data:', err);
    } finally {
      loading.value = false;
    }
  }

  function searchFeatures(query: string): Feature[] {
    if (!data.value || !query) return [];

    const lowerQuery = query.toLowerCase().trim();
    
    return Object.values(data.value.features).filter((feature) => 
      feature.title.toLowerCase().includes(lowerQuery) ||
      feature.id.toLowerCase().includes(lowerQuery)
    );
  }

  function getFeature(id: string): Feature | null {
    if (!data.value) return null;
    return data.value.features[id] || null;
  }

  function getAllFeatures(): Feature[] {
    if (!data.value) return [];
    return Object.values(data.value.features);
  }

  return {
    // State
    data,
    loading,
    error,
    
    // Getters
    isLoaded,
    lastUpdated,
    featureCount,
    
    // Actions
    loadData,
    searchFeatures,
    getFeature,
    getAllFeatures
  };
});