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
          <h5>Sign in to track features</h5>
          <button @click="emit('close')">✕</button>
        </div>
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
            <p>Sign in with your GitHub account</p>
            <button 
              class="btn-oauth" 
              @click="handleGithubSignIn"
              :disabled="loading"
            >
              {{ loading ? 'Signing in...' : 'Continue with GitHub' }}
            </button>
          </div>

          <div v-else-if="activeTab === 'google'" class="tab-content">
            <p>Sign in with your Google account</p>
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
              <p>Magic link sent to {{ email }}</p>
              <p>Check your email und sign in with the link</p>
            </div>
            <div v-else class="tab-content">
              <input 
                v-model="email" 
                type="email" 
                placeholder="your@email.com"
                @keyup.enter="handleMagicLink"
              />
              <button 
                @click="handleMagicLink"
                :disabled="loading"
              >
                {{ loading ? 'Sending...' : 'Send Magic Link' }}
              </button>
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
  background: hsla(0, 0%, 0%, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11;
}

.modal-content {
  background-color: var(--clr-bg-overlay);
  width: min(98%, 480px);
  min-height: 240px;
  border-radius: var(--radius-4px);
  padding: var(--space-8-12px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-block-end: var(--space-24-32px);
}

.tabs {
  display: flex;
  gap: var(--space-12-16px);
  margin-block-end: var(--space-16-24px);
}

.tabs button {
  flex: 1;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8-12px);
}

.tab-content input {
  padding: var(--space-4-8px);
  border-radius: var(--radius-2px);
  border: 1px solid var(--clr-stroke-weak);
}

.error-message {
  padding-block: var(--space-12-16px);
  background: #fee2e2;
  color: var(--clr-text-strong);
  border: 1px solid var(--clr-support-low);
}

</style>