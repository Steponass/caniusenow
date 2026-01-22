<script setup lang="ts">
import { useAuthStore } from "../stores/authStore";

const authStore = useAuthStore();

const emit = defineEmits<{
  openAuthModal: [];
}>();

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
      <h1>CanIUse Tracker</h1>
    </div>

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

nav {
  display: flex;
}
</style>
