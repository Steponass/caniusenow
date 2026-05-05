<script setup lang="ts">
import { computed, ref, watch, nextTick, onUnmounted } from "vue";
import type { NormalizedFeature } from "@/types/feature";
import type { FeatureTracking } from "@/types/featureTracking";
import FormattedText from "./FormattedText.vue";
import { getBrowserDisplayName } from "@/types/feature";
import TriggerBuilder from "./TriggerBuilder.vue";
import { useFeatureUrl } from "@/composables/useFeatureUrl";

interface Props {
  feature: NormalizedFeature | null;
  isOpen: boolean;
  existingTracking?: FeatureTracking | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  startTracking: [];
  saveChanges: [];
}>();

const { triggers } = useFeatureUrl();

const isEditMode = computed(() => props.existingTracking != null);

// --- Focus trap & Esc key ---

const modalContentRef = ref<HTMLElement | null>(null);

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function getFocusableElements(): HTMLElement[] {
  if (!modalContentRef.value) return [];
  return Array.from(
    modalContentRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
  );
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    handleClose();
    return;
  }

  if (event.key === "Tab") {
    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const firstElement: HTMLElement | undefined = focusable[0];
    const lastElement: HTMLElement | undefined = focusable[focusable.length - 1];

    if (!firstElement || !lastElement) return;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      await nextTick();
      getFocusableElements()[0]?.focus();
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }
  }
);

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
});

const browserList = computed(() => {
  if (!props.feature) return [];

  return Object.entries(props.feature.support).map(
    ([browserId, supportDetail]) => {
      const latestVersion = supportDetail.versions?.[0]?.version || "current";
      const currentStatus = supportDetail.current;

      return {
        id: browserId,
        name: getBrowserDisplayName(browserId),
        latestVersion,
        currentStatus,
        firstFull: supportDetail.firstFull,
        firstPartial: supportDetail.firstPartial,
      };
    },
  );
});

function getSupportStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    y: "Full",
    a: "Partial",
    n: "None",
    p: "Prefix",
    d: "Disabled",
    x: "Prefixed",
    u: "Unknown",
  };
  return statusMap[status] || "Unknown";
}

function handleClose() {
  emit("close");
}

function handlePrimaryAction(): void {
  if (triggers.value.length === 0) {
    alert("Gotta add at least one notification trigger");
    return;
  }

  if (isEditMode.value) {
    emit("saveChanges");
  } else {
    emit("startTracking");
  }
}
</script>

<template>
  <div v-if="isOpen && feature" class="modal-overlay" @click="handleClose">
    <div ref="modalContentRef" class="modal-content" role="dialog" aria-modal="true" @click.stop>
      <div class="modal-header">
        <div class="modal-h-and-close-btn">
          <FormattedText :text="feature.name" tag="h4" />
          <button class="modal-close-btn" @click="handleClose">✕</button>
        </div>
          <FormattedText :text="feature.description" tag="p" />
          <div class="badges-and-links">
            <div class="badges">
              <span class="category-badge">{{ feature.category }}</span>
              <img v-if="feature.baseline" class="baseline-badge" :src="`/images/Baseline-${feature.baseline}.svg`"
              :alt="`Baseline ${feature.baseline}`" />
            </div>

            <div v-if="feature.caniuseUrl" class="links">
              <a v-if="feature.caniuseUrl" :href="feature.caniuseUrl" target="_blank" rel="noopener noreferrer">
              <strong>Caniuse.com ↗</strong>
              </a>
              <!-- Are other links even necessary when this tool is for reminders only? -->
              <!-- <a v-for="link in feature.links.slice(0, 3)" :key="link.url" :href="link.url" target="_blank"
              rel="noopener noreferrer" class="external-link">
              {{ link.title }} ↗
              </a> -->
            </div>
          </div>
      </div>

      <div class="modal-body">
        <section>
          <h5>Support stats
            <span class="value">({{ feature.usage.type }})

              <button class="popover-button" v-if="feature.usage.type === 'estimated'" popovertarget="feature-details-popover">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor"
                  viewBox="0 0 256 256">
                  <path
                    d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z">
                  </path>
                </svg></button>
            </span>
          </h5>
          <div class="usage-stats">
            <div class="stat">
              <span class="label">Full Support:</span>
              <span class="value">{{ Math.round(feature.usage.global.full) }}%</span>
            </div>
            <div class="stat">
              <span class="label">Partial Support:</span>
              <span class="value">{{ Math.round(feature.usage.global.partial) }}%</span>
            </div>
            <div class="stat">
              <span class="label">Total:</span>
              <span class="value">{{ Math.round(feature.usage.global.total) }}%</span>
            </div>
          </div>
        </section>

        <section>
          <h5>Browsers</h5>
          <div class="browser-list">
            <div v-for="browser in browserList" :key="browser.id" class="browser-row">
              <span class="browser-name">{{ browser.name }}</span>
              <span class="status-badge" :class="`status-${browser.currentStatus}`">
                {{ getSupportStatusLabel(browser.currentStatus) }}
              </span>
            </div>
          </div>
        </section>

        <section>
          <h5>Notification Triggers</h5>
          <TriggerBuilder :feature="feature" />
        </section>
      </div>

      <div class="modal-footer">
        <button @click="handleClose">Cancel</button>
        <button @click="handlePrimaryAction" :disabled="triggers.length === 0">
          {{ isEditMode ? 'Save Changes' : 'Track' }}
        </button>
      </div>
    </div>
    <div id="feature-details-popover" popover>
      <p>
        Double-check at
        <a v-if="feature.caniuseUrl" :href="feature.caniuseUrl" target="_blank" rel="noopener noreferrer">
        <strong>caniuse.com</strong>!
        </a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: var(--transition-hover-quick);
  @starting-style {
      backdrop-filter: blur(0px);
  }
}

.modal-content {
  background-color: var(--clr-bg-overlay);
  border-radius: var(--radius-16px);
  box-shadow: var(--shadow-elevation-4);
  width: min(960px, 98%);
  max-height: 95vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: var(--space-16-24px);
  max-width: 100%;
  box-shadow: var(--shadow-elevation-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-8px)
}

.modal-h-and-close-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-close-btn {
  padding: var(--space-4px) var(--space-8px);
}

.badges-and-links {
  display: flex;
  align-items: baseline;
  gap: var(--space-16-24px);
  margin-block: var(--space-8-12px);
}

.badges {
  display: flex;
  align-items: center;
  gap: var(--space-16px);
}

.category-badge {
  padding: var(--space-4px) var(--space-8px);
  border-radius: var(--radius-2px);
  background-color: #3b82f6;
  color: var(--clr-text-strong);
  text-transform: uppercase;
}

.baseline-badge {
  max-height: var(--space-16px);
}

.links a {
  display: flex;
  flex-wrap: wrap;
  text-decoration: underline;
  color: var(--clr-text-strong);
  @media (hover: hover) {
    &:hover {
      text-decoration: none;
    }
  }
}

.modal-body {
  padding: var(--space-16-24px);
  overflow-y: auto;
  /* scrollbar-color: var(--clr-stroke-strong); */
}

.modal-body h5 {
  margin-block-end: var(--space-8px);
}

section{
  margin-block-end: var(--space-16-24px);
}

.usage-stats {
  display: flex;  gap: var(--space-16px);
}

.stat {
  padding: var(--space-8px) var(--space-8px);
  border-radius: var(--radius-4px);
  border: 1px solid var(--clr-stroke-weak);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-8px);
  background-color: var(--clr-bg-raised);
}

.stat .value {
  font-weight: bold;
}

.browser-list {
  display: grid;
  grid-auto-rows: auto;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--space-8px);
}

.browser-row {
  display: grid;
  grid-row: span 2;
  grid-template-rows: subgrid;
  justify-items: center;
  gap: var(--space-4px);
  background-color: var(--clr-bg-raised);
  border: 1px solid var(--clr-stroke-weak);
  border-radius: var(--radius-4px);
  padding-block: var(--space-4px);
  padding-inline: var(--space-8px);
}

.browser-name {
  text-align: center;
}

.status-badge.status-y {
  color: var(--clr-browser-full-support);
}

.status-badge.status-a {
  color: var(--clr-medium-support);
}

.status-badge.status-n {
  color: var(--clr-low-support);
}

.status-badge.status-p,
.status-badge.status-x {
  color: #3730a3;
}

.status-badge.status-d,
.status-badge.status-u {
  color: #374151;
}

.modal-footer {
  padding: var(--space-16-24px);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-16px);
}

.modal-footer button:disabled {
  background-color: var(--clr-disabled);
  border: none;
}

.popover-button {
  display: inline-flex;
  vertical-align: top;
  background: none;
  border: none;
  padding: 0;
  margin-inline-start: -8px;
  cursor: pointer;
  transition: var(--transition-hover);
}

#feature-details-popover {
  width: min(360px, 95%);
  padding: var(--space-16px);
  color: var(--clr-text-strong);
  font-size: var(--fontsize-h6);
  background: var(--clr-bg-overlay);
  margin-inline: auto;
  align-self: center;
  border: 2px solid var(--clr-stroke-weak);
  border-radius: var(--radius-4px);
  opacity: 1;
  transform: translateY(0);
  transition: var(--transition-hover);
  @starting-style {
    opacity: 0;
    transform: translateY(50px);
  }
}

/* Not sure why didn't work via global.css */
#feature-details-popover a {
  text-decoration: underline;
  transform: var(--transition-hover);
  @media (hover: hover) {
    &:hover {
      text-decoration: none;
    }
  }
}
</style>