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
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title xmlns="">github</title><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"/></svg>
            </button>
            <button 
              :class="{ active: activeTab === 'google' }"
              @click="activeTab = 'google'"
            >
              Google
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title xmlns="">google</title><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81"/></svg>
            </button>
            <button 
              :class="{ active: activeTab === 'email' }"
              @click="activeTab = 'email'"
            >
              Email
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title xmlns="">outline-email</title><path fill="currentColor" d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2zm-2 0l-8 5l-8-5zm0 12H4V8l8 5l8-5z"/></svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title xmlns="">github</title><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"/></svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title xmlns="">google</title><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81"/></svg>
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