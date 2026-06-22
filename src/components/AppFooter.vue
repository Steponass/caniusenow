<script setup>
import { ref } from 'vue'
import PrivacyPolicyModal from '@components/PrivacyPolicyModal.vue'
const PrivacyDialog = ref(null)
</script>
w
<template>
  <footer>
      <button @click="PrivacyDialog.open()">Privacy Policy</button>
      <PrivacyPolicyModal ref="PrivacyDialog" />
      <p>made by <a href="https://steponas.com" target="_blank" rel="noopener noreferrer">S.D.</a></p>
  </footer>
</template>

<style scoped>

footer {
  width: 100%;
  padding-block: var(--space-12px);
  padding-inline: var(--space-16px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--clr-raised);
  box-shadow: var(--shadow-elevation-4);
  a {
    text-decoration: underline;
    transition: var(--transition-hover-quick);
    &:hover {
      text-decoration: none;
    }
  }
}
</style>