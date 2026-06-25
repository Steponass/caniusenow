<script setup>
import { ref } from 'vue'
const PrivacyDialog = ref(null);
const open = () => PrivacyDialog.value.showModal()
defineExpose({ open })

function handleClose() {
  PrivacyDialog.value.close();
}
</script>

<template>
  <dialog ref="PrivacyDialog">
    <button class="modal-close-btn" @click="handleClose">✕</button>
    <h1>Privacy Policy</h1>
    <h6>Last updated: June 2026</h6>
    <p>Can I Use It Now? is a free tool that notifies you when browser features reach the support level you care about.
      This policy explains what data we collect and why.</p>

    <h2>What I collect</h2>
    <p>When you create an account, we store your email address and the name of the sign-in provider you used (GitHub or
    Google). I also store the browser features you choose to track and the notification conditions you set.
    No analytics, no tracking cookies, no ads.</p>

    <h2>Why I collect it</h2>
    <p>Your email is used solely to send you the notifications you signed up for. Your tracking preferences are stored so I
    know when to notify you.</p>

    <h2>Who can access it</h2>
    <p>Your data is stored securely via Supabase. Notification emails are delivered through Pingram (formerly
    NotificationAPI). My hosting provider Cloudflare may collect standard server logs (IP addresses, request timestamps)
    as part of normal infrastructure operation — I don't access or use that data.
    I don't and won't sell, share, or rent your data to anyone, ever.</p>

    <h2>Deleting your data</h2>
    <p>To delete your account and all associated data, email me at steponas.dabuzinskas@gmail.com and I'll take care of it
    promptly.</p>

    <h2>Changes to this policy</h2>
    <p>If anything meaningful changes, we'll update the date at the top. Nuthin' sneaky.</p>

    <h2>Questions?</h2>
    <a href="mailto:steponas.dabuzinskas@gmail.com" target="blank">steponas.dabuzinskas@gmail.com</a>
  </dialog>
</template>

<style scoped>
  dialog {
    width: min(640px, 95%);
    height: fit-content;
    margin-inline: auto;
    border: none;
    box-shadow: var(--shadow-elevation-1);
    padding: var(--space-16-24px);
    border-radius: var(--radius-8px);
    background-color: var(--clr-bg-overlay);
    scrollbar-color: var(--clr-primary) var(--clr-bg-base);
    h1 {
      font-size: var(--fontsize-h2);
    }
    h2 {
      margin-block-start: var(--space-16px);
      font-size: var(--fontsize-h4);
    }
    p {
      margin-block-start: var(--space-8px);
      margin-block-end: var(--space-24px);
    }
  }

.modal-close-btn {
  padding: var(--space-4px) var(--space-8px);
  float: right;
}

  dialog::backdrop {
    background-color: var(--clr-backdrop);
  }
</style>