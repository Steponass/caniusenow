import { useColorMode } from '@vueuse/core';
import { computed } from 'vue';

/**
 * Theme management composable
 * 
 * Provides theme switching with smooth transitions using View Transitions API.
 * Supports three modes:
 * - 'light': Always light theme
 * - 'dark': Always dark theme  
 * - 'auto': Follow system preference (default)
 * 
 * The actual theme applied is stored in data-theme attribute on <html>
 * which can be 'light' or 'dark' (auto resolves to one of these)
 */
export function useTheme() {
  /**
   * User's theme preference (light/dark/auto)
   * Persists to localStorage as 'vueuse-color-scheme'
   */
  const mode = useColorMode({
    selector: 'html',
    attribute: 'data-theme',
    modes: {
      light: 'light',
      dark: 'dark',
      auto: 'auto',
    },
    storageKey: 'theme-preference',
    emitAuto: true, // Keep 'auto' as the value instead of resolving to actual theme
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

  /**
   * Whether dark theme is currently active
   */
  const isDark = computed(() => currentTheme.value === 'dark');

  /**
   * Cycle through theme modes: light → dark → auto → light...
   */
  function cycleTheme() {
    const order: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = order.indexOf(mode.value as 'light' | 'dark' | 'auto');
    const nextIndex = (currentIndex + 1) % order.length;
    
    const nextMode = order[nextIndex]!;
    toggleTheme(nextMode);
  }

  /**
   * Toggle to a specific theme with smooth transition
   * Uses View Transitions API if available, falls back to instant change
   */
  function toggleTheme(newMode: 'light' | 'dark' | 'auto') {
    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      mode.value = newMode;
      return;
    }

    // Use View Transitions for smooth theme change
    document.startViewTransition(() => {
      mode.value = newMode;
    });
  }

  /**
   * Set theme to light
   */
  function setLight() {
    toggleTheme('light');
  }

  /**
   * Set theme to dark
   */
  function setDark() {
    toggleTheme('dark');
  }

  /**
   * Set theme to auto (follow system)
   */
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
    // Current state
    mode,              // 'light' | 'dark' | 'auto'
    currentTheme,      // 'light' | 'dark' (resolved)
    isDark,            // boolean
    
    // Actions
    cycleTheme,        // Cycle through all modes
    toggleTheme,       // Set specific mode with transition
    setLight,          // Shorthand: set to light
    setDark,           // Shorthand: set to dark
    setAuto,           // Shorthand: set to auto
  };
}