import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@utils/supabase';
import type { User, Session } from '@/types/auth';

/**
 * Builds a redirect URL stripped of any hash fragments.
 * Prevents stale auth tokens from being included in the OAuth redirect,
 * which causes Supabase to append a second hash fragment (##access_token=...#access_token=...).
 */
function getCleanRedirectUrl(): string {
  const url = new URL(window.location.href);
  url.hash = '';
  return url.toString();
}

/**
 * Removes auth-related hash fragments from the URL bar
 * after Supabase has consumed them to establish a session.
 */
function clearAuthHashFragment(): void {
  if (window.location.hash.includes('access_token')) {
    window.history.replaceState(
      {},
      '',
      window.location.pathname + window.location.search
    );
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(true);

  const isAuthenticated = computed(() => !!user.value);

  async function initialize() {
    loading.value = true;

    try {
      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      session.value = currentSession;
      user.value = currentSession?.user ?? null;

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession;
        user.value = newSession?.user ?? null;

        // Clean up hash fragment after Supabase has consumed the tokens
        clearAuthHashFragment();
      });
    } catch (err) {
      console.error('Error initializing auth:', err);
    } finally {
      loading.value = false;
    }
  }

  async function signInWithGithub() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: getCleanRedirectUrl()
      }
    });

    if (error) {
      console.error('GitHub sign in error:', error);
      throw error;
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getCleanRedirectUrl()
      }
    });

    if (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  async function signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getCleanRedirectUrl()
      }
    });

    if (error) {
      console.error('Magic link error:', error);
      throw error;
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }

    user.value = null;
    session.value = null;

    // Clean any leftover auth fragments from the URL
    if (window.location.hash) {
      window.history.replaceState(
        {},
        '',
        window.location.pathname + window.location.search
      );
    }
  }

  return {
    user,
    session,
    loading,
    isAuthenticated,
    initialize,
    signInWithGithub,
    signInWithGoogle,
    signInWithMagicLink,
    signOut
  };
});