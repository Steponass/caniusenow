<script setup lang="ts">
import { ref, computed } from 'vue';
import type { NormalizedFeature } from '../types/caniuse';
import type { Trigger } from '../types/featureTracking';
import TriggerBuilder from './TriggerBuilder.vue';

interface Props {
  feature: NormalizedFeature | null;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  startTracking: [triggers: Trigger[]];
}>();

const triggers = ref<Trigger[]>([]);

const browserList = computed(() => {
  if (!props.feature) return [];

  return Object.entries(props.feature.support).map(([browserId, supportDetail]) => {
    const latestVersion = supportDetail.versions?.[0]?.version || 'current';
    const currentStatus = supportDetail.current;

    return {
      id: browserId,
      name: browserId,
      latestVersion,
      currentStatus,
      firstFull: supportDetail.firstFull,
      firstPartial: supportDetail.firstPartial
    };
  });
});

const usageByCategory = computed(() => {
  if (!props.feature) return { desktop: 0, mobile: 0 };

  const desktop = Object.values(props.feature.usage.byBrowser.desktop).reduce((a, b) => a + b, 0) /
    Object.keys(props.feature.usage.byBrowser.desktop).length || 0;
  const mobile = Object.values(props.feature.usage.byBrowser.mobile).reduce((a, b) => a + b, 0) /
    Object.keys(props.feature.usage.byBrowser.mobile).length || 0;

  return { desktop, mobile };
});

function getSupportStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'y': 'Full',
    'a': 'Partial',
    'n': 'None',
    'p': 'Prefix',
    'd': 'Disabled',
    'x': 'Prefixed',
    'u': 'Unknown'
  };
  return statusMap[status] || 'Unknown';
}

function handleClose() {
  triggers.value = [];
  emit('close');
}

function handleStartTracking() {
  if (triggers.value.length === 0) {
    alert('Please add at least one notification trigger');
    return;
  }

  emit('startTracking', triggers.value);
  triggers.value = [];
}

function handleTriggersUpdate(newTriggers: Trigger[]) {
  triggers.value = newTriggers;
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen && feature" class="modal-overlay" @click="handleClose">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div>
            <h2>{{ feature.name }}</h2>
            <p class="feature-description">{{ feature.description }}</p>
            <div class="meta-badges">
              <span class="category-badge">{{ feature.category }}</span>
              <span v-if="feature.baseline" class="baseline-badge">
                Baseline {{ feature.baseline }}
              </span>
            </div>
            <div v-if="feature.links.length > 0" class="links">
              <a
                v-for="link in feature.links.slice(0, 3)"
                :key="link.url"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="external-link"
              >
                {{ link.title }} ↗
              </a>
              <a
                v-if="feature.mdn"
                :href="feature.mdn"
                target="_blank"
                rel="noopener noreferrer"
                class="external-link"
              >
                MDN Docs ↗
              </a>
            </div>
          </div>
          <button class="close-btn" @click="handleClose">✕</button>
        </div>

        <div class="modal-body">
          <section class="usage-section">
            <h3>Global Usage</h3>
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
            <div class="usage-breakdown">
              <div class="stat">
                <span class="label">Desktop Avg:</span>
                <span class="value">{{ Math.round(usageByCategory.desktop) }}%</span>
              </div>
              <div class="stat">
                <span class="label">Mobile Avg:</span>
                <span class="value">{{ Math.round(usageByCategory.mobile) }}%</span>
              </div>
              <div class="stat">
                <span class="label">Data Type:</span>
                <span class="value">{{ feature.usage.type }}</span>
              </div>
            </div>
          </section>

          <section class="browser-section">
            <h3>Browser Support</h3>
            <div class="browser-list">
              <div
                v-for="browser in browserList"
                :key="browser.id"
                class="browser-row"
              >
                <span class="browser-name">{{ browser.name }}</span>
                <span class="version">{{ browser.latestVersion }}</span>
                <span
                  class="status-badge"
                  :class="`status-${browser.currentStatus}`"
                >
                  {{ getSupportStatusLabel(browser.currentStatus) }}
                </span>
                <span v-if="browser.firstFull" class="first-support">
                  Since v{{ browser.firstFull }}
                </span>
              </div>
            </div>
          </section>

          <section class="trigger-section">
            <h3>Notification Triggers</h3>
            <p class="section-description">
              Set conditions to receive an email when this feature becomes production-ready.
            </p>
            <TriggerBuilder 
              :feature="feature"
              :triggers="triggers"
              @update:triggers="handleTriggersUpdate"
            />
          </section>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="handleClose">
            Cancel
          </button>
          <button 
            class="btn-primary" 
            @click="handleStartTracking"
            :disabled="triggers.length === 0"
          >
            Start Tracking
          </button>
        </div>
      </div>
    </div>
  </Teleport>
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
  background-color: lightblue;
  border-radius: 0.75rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
}

.feature-description {
  margin: 0.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.meta-badges {
  display: flex;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.category-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  background-color: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.baseline-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  background-color: #10b981;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.75rem;
}

.external-link {
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.875rem;
}

.external-link:hover {
  text-decoration: underline;
}

.close-btn {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.section-description {
  margin-bottom: 1rem;
}

.usage-stats,
.usage-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat .value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.browser-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.browser-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.browser-name {
  flex: 1;
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.status-y {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge.status-a {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.status-n {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-badge.status-p,
.status-badge.status-x {
  background-color: #e0e7ff;
  color: #3730a3;
}

.status-badge.status-d,
.status-badge.status-u {
  background-color: #f3f4f6;
  color: #374151;
}

.first-support {
  font-size: 0.75rem;
  color: #6b7280;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-secondary,
.btn-primary {
  padding: 0.625rem 1.25rem;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>