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
      <h1>Can I Use It  Now?</h1>
    </div>
    <ThemeToggle />

    <FeatureSearch @search="handleSearch" />
    <nav>
      <div v-if="authStore.isAuthenticated">
        <span>{{ authStore.user?.email }}</span>
        <button @click="handleSignOut">Sign Out</button>
      </div>

      <div v-else>
        <button @click="handleSignIn">Sign In</button>
      </div>
    </nav>
  </header>
</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  font-size: var(--fontsize-h3);
}

nav {
  display: flex;
}
</style>
