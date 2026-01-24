import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../utils/supabase';
import { useAuthStore } from './authStore';
import type { FeatureTracking, Trigger } from '../types/featureTracking';

export const useTrackingStore = defineStore('tracking', () => {
  // State
  const trackings = ref<FeatureTracking[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeTrackings = computed(() => 
    trackings.value.filter(t => t.status === 'active')
  );

  const notifiedTrackings = computed(() => 
    trackings.value.filter(t => t.status === 'notified')
  );

  const completedTrackings = computed(() => 
    trackings.value.filter(t => t.status === 'completed')
  );

  // Actions
  async function loadUserTrackings() {
    const authStore = useAuthStore();
    
    if (!authStore.isAuthenticated) {
      trackings.value = [];
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('user_feature_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      trackings.value = (data || []) as FeatureTracking[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load trackings';
      console.error('Error loading trackings:', err);
    } finally {
      loading.value = false;
    }
  }

  async function addTracking(
    featureId: string,
    featureTitle: string,
    triggers: Trigger[]
  ): Promise<FeatureTracking> {
    const authStore = useAuthStore();

    if (!authStore.user) {
      throw new Error('Must be authenticated to track features');
    }

    if (!authStore.user.email) {
      throw new Error('User email is required to track features');
    }

    if (triggers.length === 0) {
      throw new Error('At least one trigger is required');
    }

    loading.value = true;
    error.value = null;

    try {
      const { data, error: insertError } = await supabase
        .from('user_feature_tracking')
        // @ts-ignore
        .insert({
          user_id: authStore.user.id,
          user_email: authStore.user.email,
          feature_id: featureId,
          feature_title: featureTitle,
          triggers: triggers,
          status: 'active'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error('No data returned from insert');

      const newTracking = data as FeatureTracking;
      trackings.value.unshift(newTracking);
      
      return newTracking;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add tracking. Contact Step!';
      console.error('Error adding tracking:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateTracking(
    id: string,
    updates: Partial<Pick<FeatureTracking, 'triggers' | 'status'>>
  ): Promise<FeatureTracking> {
    loading.value = true;
    error.value = null;

    try {
      const updatePayload: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.triggers !== undefined) {
        updatePayload.triggers = updates.triggers;
      }

      if (updates.status !== undefined) {
        updatePayload.status = updates.status;
      }

      const { data, error: updateError } = await supabase
        .from('user_feature_tracking')
        // @ts-ignore
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (!data) throw new Error('No data returned from update');

      const updatedTracking = data as FeatureTracking;
      const index = trackings.value.findIndex(t => t.id === id);
      if (index !== -1) {
        trackings.value[index] = updatedTracking;
      }

      return updatedTracking;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update tracking';
      console.error('Error updating tracking:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTracking(id: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from('user_feature_tracking')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      trackings.value = trackings.value.filter(t => t.id !== id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete tracking';
      console.error('Error deleting tracking:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function markAsCompleted(id: string): Promise<FeatureTracking> {
    return updateTracking(id, { status: 'completed' });
  }

  return {
    // State
    trackings,
    loading,
    error,
    
    // Getters
    activeTrackings,
    notifiedTrackings,
    completedTrackings,
    
    // Actions
    loadUserTrackings,
    addTracking,
    updateTracking,
    deleteTracking,
    markAsCompleted
  };
});