<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@stores/authStore';

interface Props {
  isOpen: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const authStore = useAuthStore();

type AuthTab = 'github' | 'google' | 'email';
const activeTab = ref<AuthTab>('github');
const email = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const magicLinkSent = ref(false);

async function handleGithubSignIn() {
  loading.value = true;
  error.value = null;

  try {
    await authStore.signInWithGithub();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Sign in failed';
  } finally {
    loading.value = false;
  }
}

async function handleGoogleSignIn() {
  loading.value = true;
  error.value = null;

  try {
    await authStore.signInWithGoogle();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Sign in failed';
  } finally {
    loading.value = false;
  }
}

async function handleMagicLink() {
  if (!email.value) {
    error.value = 'Please enter your email';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    await authStore.signInWithMagicLink(email.value);
    magicLinkSent.value = true;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to send magic link';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="emit('close')">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Sign in to track features</h2>
          <button @click="emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <div class="tabs">
            <button 
              :class="{ active: activeTab === 'github' }"
              @click="activeTab = 'github'"
            >
              GitHub
            </button>
            <button 
              :class="{ active: activeTab === 'google' }"
              @click="activeTab = 'google'"
            >
              Google  
            </button>
            <button 
              :class="{ active: activeTab === 'email' }"
              @click="activeTab = 'email'"
            >
              Email
            </button>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div v-if="activeTab === 'github'" class="tab-content">
            <p>Sign in with your GitHub account to start tracking features.</p>
            <button 
              class="btn-oauth" 
              @click="handleGithubSignIn"
              :disabled="loading"
            >
              {{ loading ? 'Signing in...' : 'Continue with GitHub' }}
            </button>
          </div>

          <div v-else-if="activeTab === 'google'" class="tab-content">
            <p>Sign in with your Google account to start tracking features.</p>
            <button 
              class="btn-oauth" 
              @click="handleGoogleSignIn"
              :disabled="loading"
            >
              {{ loading ? 'Signing in...' : 'Continue with Google' }}
            </button>
          </div>



          <div v-else-if="activeTab === 'email'" class="tab-content">
            <div v-if="magicLinkSent" class="success-message">
              <p>✓ Magic link sent to {{ email }}</p>
              <p>Check your email and click the link to sign in.</p>
            </div>
            <div v-else>
              <p>Enter your email to receive a magic sign-in link.</p>
              <input 
                v-model="email" 
                type="email" 
                placeholder="your@email.com"
                @keyup.enter="handleMagicLink"
              />
              <button 
                class="btn-oauth" 
                @click="handleMagicLink"
                :disabled="loading"
              >
                {{ loading ? 'Sending...' : 'Send Magic Link' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11;
  padding: 1rem;
}

.modal-content {
    background-color: lightblue;
  max-width: 450px;
  width: 100%;
}

.modal-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.tabs button {
  flex: 1;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-oauth {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  background: #3b82f6;
  color: white;
}

.btn-oauth:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.error-message {
  padding: 0.75rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.success-message {
  padding: 1rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 0.375rem;
  text-align: center;
}
</style>