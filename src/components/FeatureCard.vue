<script setup lang="ts">
import type { Feature } from '../types/caniuse';

interface Props {
  feature: Feature;
}

defineProps<Props>();

const emit = defineEmits<{
  click: [feature: Feature];
}>();

function getStatusColor(full: number): string {
  if (full >= 95) return '#10b981';
  if (full >= 80) return '#f59e0b';
  return '#ef4444';
}
</script>

<template>
  <div class="feature-card" @click="emit('click', feature)">
    <div class="card-header">
      <h3 class="feature-title">{{ feature.title }}</h3>
      <div 
        class="usage-badge"
        :style="{ backgroundColor: getStatusColor(feature.usage.full) }"
      >
        {{ feature.usage.full }}%
      </div>
    </div>

    <div class="card-body">
      <div class="usage-breakdown">
        <span>Full: {{ feature.usage.full }}%</span>
        <span>Partial: {{ feature.usage.partial }}%</span>
      </div>

      <a 
        :href="feature.caniuseUrl" 
        target="_blank" 
        rel="noopener noreferrer"
        @click.stop
      >
        View on caniuse.com ↗
      </a>
    </div>


  </div>
</template>

<style scoped>
.feature-card {
  border: 1px solid #e5e7eb;
  padding: 1rem;
  transition: box-shadow, transform 0.3s ease-out;
}

.feature-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-3px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
}

.feature-title {
  flex: 1;
}

.usage-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  color: white;
  flex-shrink: 0;
}

.card-body {
  margin-bottom: 1rem;
}

.usage-breakdown {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.card-footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 0.75rem;
}

.btn-track {
  width: 100%;
}

</style>