<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '@/composables/useTheme';

const { mode, cycleTheme } = useTheme();

const themeLabel = computed(() => {
  switch (mode.value) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'auto':
      return 'Auto';
    default:
      return 'Unknown';
  }
});

const nextThemeLabel = computed(() => {
  const order = ['light', 'dark', 'auto'] as const;
  const currentIndex = order.indexOf(mode.value as typeof order[number]);
  const nextIndex = (currentIndex + 1) % order.length;

  switch (order[nextIndex]) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'auto':
      return 'Auto';
    default:
      return '';
  }
});
</script>

<template>
  <button class="theme-toggle" @click="cycleTheme" :title="`Current: ${themeLabel}. Click for ${nextThemeLabel}`"
    :aria-label="`Switch theme. Current: ${themeLabel}`">
    <!-- Light theme icon -->
    <svg v-if="mode === 'light'" class="theme-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256" fill="currentColor">
      <path
        d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z" />
    </svg>

    <!-- Dark theme icon -->
    <svg v-else-if="mode === 'dark'" class="theme-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256" fill="currentColor">
      <path
        d="M240,96a8,8,0,0,1-8,8H216v16a8,8,0,0,1-16,0V104H184a8,8,0,0,1,0-16h16V72a8,8,0,0,1,16,0V88h16A8,8,0,0,1,240,96ZM144,56h8v8a8,8,0,0,0,16,0V56h8a8,8,0,0,0,0-16h-8V32a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16Zm72.77,97a8,8,0,0,1,1.43,8A96,96,0,1,1,95.07,37.8a8,8,0,0,1,10.6,9.06A88.07,88.07,0,0,0,209.14,150.33,8,8,0,0,1,216.77,153Zm-19.39,14.88c-1.79.09-3.59.14-5.38.14A104.11,104.11,0,0,1,88,64c0-1.79,0-3.59.14-5.38A80,80,0,1,0,197.38,167.86Z" />
    </svg>

    <!-- Auto theme icon -->
    <svg v-else class="theme-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M12.68 6h-1.36L7 16h2l.73-2h4.54l.73 2h2zm-2.38 6.5L12 8l1.7 4.5zm7.1 7.9L19 22h-5v-5l2 2c2.39-1.39 4-4.05 4-7c0-4.41-3.59-8-8-8s-8 3.59-8 8c0 2.95 1.61 5.53 4 6.92v2.24C4.47 19.61 2 16.1 2 12C2 6.5 6.5 2 12 2s10 4.5 10 10c0 3.53-1.83 6.62-4.6 8.4" />
    </svg>

    <span class="theme-label">{{ themeLabel }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-8px);
  background: transparent;
  border: transparent;
  padding-block: var(--space-4px);
  padding-inline: var(--space-8px);
  cursor: pointer;
  transition: var(--transition-hover);
  &:hover {
    transform: translateY(-1px);
    border: 1px solid var(--clr-stroke-weak);
  }
}

.theme-icon {
  width: var(--space-24px);
  height: var(--space-24px);
}

.theme-label {
  text-align: left;
}
</style>
