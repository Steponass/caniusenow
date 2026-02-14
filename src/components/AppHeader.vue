<script setup lang="ts">

import FeatureSearch from "./FeatureSearch.vue";
import ThemeToggle from "./ThemeToggle.vue";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

const emit = defineEmits<{
  openAuthModal: [];
  search: [query: string];
}>();

function handleSearch(query: string) {
  emit('search', query);
}

async function handleSignOut() {
  try {
    await authStore.signOut();
  } catch (error) {
    console.error("Sign out failed:", error);
  }
}

function handleSignIn() {
  emit("openAuthModal");
}
</script>

<template>
  <header>
    <div class="logo">
      <h1>Can I Use It Now?</h1>
    </div>

    <FeatureSearch @search="handleSearch" />
    <div class="theme_and_sign_in">
      <ThemeToggle />
      <div v-if="authStore.isAuthenticated">
        <button @click="handleSignOut">
          Sign Out
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 256 256">
            <path
              d="M120,216a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H56V208h56A8,8,0,0,1,120,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L204.69,120H112a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,229.66,122.34Z">
            </path>
          </svg>
        </button>
      </div>

      <div v-else>
        <button @click="handleSignIn">
          Sign In
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
            <path
              d="M141.66,133.66l-40,40a8,8,0,0,1-11.32-11.32L116.69,136H24a8,8,0,0,1,0-16h92.69L90.34,93.66a8,8,0,0,1,11.32-11.32l40,40A8,8,0,0,1,141.66,133.66ZM200,32H136a8,8,0,0,0,0,16h56V208H136a8,8,0,0,0,0,16h64a8,8,0,0,0,8-8V40A8,8,0,0,0,200,32Z">
            </path>
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-block: var(--space-8px);
  padding-inline: var(--space-8-12px);
}

h1 {
  font-size: var(--fontsize-h5);
  font-weight: 700;
}

.theme_and_sign_in {
  display: flex;
  gap: var(--space-16-24px)
}
</style>
