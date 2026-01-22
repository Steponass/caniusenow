import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../utils/supabase';
import type { User, Session } from '../types/auth';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(true);

  // Getters
  const isAuthenticated = computed(() => !!user.value);

  // Actions
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
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('GitHub sign in error:', error);
      throw error;
    }
  }

  async function signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
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
  }

  return {
    // State
    user,
    session,
    loading,
    
    // Getters
    isAuthenticated,
    
    // Actions
    initialize,
    signInWithGithub,
    signInWithMagicLink,
    signOut
  };
});