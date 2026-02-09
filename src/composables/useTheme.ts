import { useColorMode } from '@vueuse/core';
import { computed } from 'vue';

export function useTheme() {

  const mode = useColorMode({
    selector: 'html',
    attribute: 'data-theme',
    modes: {
      light: 'light',
      dark: 'dark',
      auto: 'auto',
    },
    storageKey: 'theme-preference',
    emitAuto: true,
  });

  /**
   * The actual theme currently applied (light or dark)
   * When mode is 'auto', this reflects the system preference
   */
  const currentTheme = computed(() => {
    if (mode.value === 'auto') {
      // Check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode.value as 'light' | 'dark';
  });

  const isDark = computed(() => currentTheme.value === 'dark');

  function cycleTheme() {
    const order: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = order.indexOf(mode.value as 'light' | 'dark' | 'auto');
    const nextIndex = (currentIndex + 1) % order.length;
    
    const nextMode = order[nextIndex]!;
    toggleTheme(nextMode);
  }

  /**
   * Toggle to a specific theme
   * Uses View Transitions API if available, falls back to instant change
   */
  function toggleTheme(newMode: 'light' | 'dark' | 'auto') {
    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      mode.value = newMode;
      return;
    }

    // Use View Transitions
    document.startViewTransition(() => {
      mode.value = newMode;
    });
  }

  function setLight() {
    toggleTheme('light');
  }

  function setDark() {
    toggleTheme('dark');
  }

  function setAuto() {
    toggleTheme('auto');
  }

  // Watch for system preference changes when in auto mode
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', () => {
      // Trigger reactivity update when system preference changes
      // This ensures currentTheme updates when user changes OS theme
      if (mode.value === 'auto') {
        // Force Vue to re-evaluate currentTheme computed
        mode.value = 'auto';
      }
    });
  }

  return {
    mode,
    currentTheme,
    isDark,
    cycleTheme,
    toggleTheme,
    setLight,
    setDark,
    setAuto,
  };
}