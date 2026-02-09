<script setup lang="ts">
import { computed } from "vue";
import type { NormalizedFeature } from "@/types/feature";
import FormattedText from "./FormattedText.vue";
import { getBrowserDisplayName } from "@/types/feature";
import TriggerBuilder from "./TriggerBuilder.vue";
import { useFeatureUrl } from "@/composables/useFeatureUrl";

interface Props {
  feature: NormalizedFeature | null;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  startTracking: [];
}>();

const { triggers } = useFeatureUrl();

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

function handleStartTracking() {
  if (triggers.value.length === 0) {
    alert("Gotta add at least one notification trigger");
    return;
  }

  emit("startTracking");
}
</script>

<template>
  <div v-if="isOpen && feature" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <div>
          <FormattedText :text="feature.name" tag="h3" />
          <FormattedText :text="feature.description" tag="p"/>
          <div class="meta-badges">
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
        <button @click="handleClose">✕</button>
      </div>

      <div class="modal-body">
        <section>
          <h3>Support stats <span class="value">({{ feature.usage.type }})</span></h3>
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
          <h3>Browsers</h3>
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
          <h3>Notification Triggers</h3>
          <p class="section-description">
            Get an email once selected criteria are true
          </p>
          <TriggerBuilder :feature="feature" />
        </section>
      </div>

      <div class="modal-footer">
        <button @click="handleClose">Cancel</button>
        <button @click="handleStartTracking" :disabled="triggers.length === 0">
          Start Tracking
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal-content {
  overscroll-behavior: contain;
  background-color: var(--clr-bg-overlay);
  border-radius: var(--radius-16px);
  width: min(600px, 98%);
  max-height: 95vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: var(--space-16-24px);
  display: flex;
  justify-content: space-between;
  align-items: start;
  box-shadow: var(--shadow-elevation-2);
}

.meta-badges {
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
}

.modal-body {
  padding: var(--space-16-24px);
  overflow-y: auto;
}

section {
  padding-block-end: var(--space-16px);
}

.usage-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-16px);
}

.stat {
  padding: var(--space-12px);
  border-radius: var(--radius-4px);
  display: flex;
  flex-direction: column;
  gap: var(--space-8px);
  background-color: var(--clr-bg-raised);
}

.browser-list {  
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
  gap: var(--space-8px);
}

.browser-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; 
  gap: var(--space-8px);
  background-color: var(--clr-bg-raised);
  border: 1px solid var(--clr-stroke-weak);
  border-radius: var(--radius-4px);
  padding-block: var(--space-4px);
}
.browser-name {
  text-align: center;
}

.status-badge.status-y {
  color: #065f46;
}

.status-badge.status-a {
  color: #92400e;
}

.status-badge.status-n {
  color: #991b1b;
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
</style>
