<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
const emit = defineEmits(['close']);
const isIntroOpen = ref(false);
const dialogRef = ref<HTMLDialogElement | null>(null)

onMounted(() => {
  const visitCount = parseInt(localStorage.getItem("visitCount") || "0", 10);
    if (visitCount < 20) {
      isIntroOpen.value = true;
      localStorage.setItem("visitCount", (visitCount + 1).toString());
    }
});

watch(isIntroOpen, (val) => {
  if (val) dialogRef.value?.showModal()
  else dialogRef.value?.close()
})

function handleClose() {
  isIntroOpen.value = false; // triggers the watch → calls dialogRef.value?.close()
}

</script>

<template>
<dialog ref="dialogRef">
  <div class="intro-modal-container">
  <h1>Can I use it <span>now</span>?</h1>
  <p>Track web feature support and get notified.</p>
  <button @click="handleClose">Okay</button>
</div>
</dialog>
</template>

<style scoped>

dialog {
  width: min(540px, 95dvw);
  min-height: 300px;
  margin: auto;
  inset: 0;
  border: 2px solid var(--clr-stroke-weak)
}

.intro-modal-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-12-16px);
  gap: var(--space-24-32px);

  h1 {
    font-size: var(--fontsize-h4);
  }
  span {
    font-weight: 700;
  }
}
button {
  width: min(196px, 80%);
}

dialog::backdrop {
  background-color: var(--clr-backdrop);
}

</style>