<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

const { mode, cycleTheme } = useTheme();

/**
 * Get icon and label for current theme mode
 */
function getThemeDisplay() {
  switch (mode.value) {
    case 'light':
      return { icon: '☀️', label: 'Light' };
    case 'dark':
      return { icon: '🌙', label: 'Dark' };
    case 'auto':
      return { icon: '🔄', label: 'Auto' };
    default:
      return { icon: '❓', label: 'Unknown' };
  }
}

/**
 * Get the next theme in the cycle for tooltip
 */
function getNextTheme() {
  const order = ['light', 'dark', 'auto'];
  const currentIndex = order.indexOf(mode.value as string);
  const nextIndex = (currentIndex + 1) % order.length;
  const nextMode = order[nextIndex];
  
  switch (nextMode) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'auto':
      return 'Auto';
    default:
      return '';
  }
}
</script>

<template>
  <button 
    class="theme-toggle"
    @click="cycleTheme"
    :title="`Current: ${getThemeDisplay().label}. Click for ${getNextTheme()}`"
    :aria-label="`Switch theme. Current: ${getThemeDisplay().label}`"
  >
    <span class="theme-icon" aria-hidden="true">{{ getThemeDisplay().icon }}</span>
    <span class="theme-label">{{ getThemeDisplay().label }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  cursor: pointer;
  transition: var(--transition-hover);
  font-size: 0.875rem;
  font-weight: 500;
}

.theme-icon {
  font-size: 1.25rem;
  line-height: 1;
  display: flex;
  align-items: center;
}

.theme-label {
  min-width: 3rem;
  text-align: left;
}

</style>