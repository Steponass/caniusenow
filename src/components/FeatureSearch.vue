<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  resultsCount?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  search: [query: string];
}>();

const searchQuery = ref('');

const hasSearchQuery = computed(() => searchQuery.value.trim().length >= 2);

const shouldShowHint = computed(() =>
  searchQuery.value.trim().length > 0 && searchQuery.value.trim().length < 2
);

function handleInput() {
  emit('search', searchQuery.value);
}

function clearSearch() {
  searchQuery.value = '';
  emit('search', '');
}
</script>

<template>
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search features (min 2 characters)..."
        class="search-input"
        @input="handleInput"
      />
      <span v-if="searchQuery" class="clear-button" @click="clearSearch">
        ✕
      </span>
    </div>

    <div v-if="shouldShowHint" class="search-hint">
      Type at least 2 characters to search
    </div>

    <div v-if="hasSearchQuery && resultsCount !== undefined" class="search-results-info">
      Found {{ resultsCount }} feature{{ resultsCount !== 1 ? 's' : '' }}
    </div>
</template>

<style scoped>

.search-bar {
  position: relative;
  width: min(100%, 600px);
}

.search-input {
  width: 100%;
  padding: var(--space-8px);
  border: 1px solid var(--clr-stroke-strong);
  border-radius: var(--radius-2px);
  box-shadow: var(--shadow-elevation-3);
}

.clear-button {
  position: absolute;
  right: var(--space-16px);
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

</style>