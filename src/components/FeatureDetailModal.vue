<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Feature } from '../types/caniuse';
import type { Trigger } from '../types/featureTracking';
import TriggerBuilder from './TriggerBuilder.vue';

interface Props {
  feature: Feature | null;
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

  return Object.entries(props.feature.stats).map(([browserId, versions]) => {
    const versionNumbers = Object.keys(versions);
    const latestVersion = versionNumbers[0];

    return {
      id: browserId,
      name: browserId,
      latestVersion,
      //@ts-ignore
      latestSupport: versions[latestVersion]
    };
  });
});

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
            <h2>{{ feature.title }}</h2>
            <a 
              :href="feature.caniuseUrl" 
              target="_blank" 
              rel="noopener noreferrer"
              class="external-link"
            >
              Full details on caniuse.com ↗
            </a>
          </div>
          <button class="close-btn" @click="handleClose">✕</button>
        </div>

        <div class="modal-body">
          <section class="usage-section">
            <h3>Global Usage</h3>
            <div class="usage-stats">
              <div class="stat">
                <span class="label">Full Support:</span>
                <span class="value">{{ feature.usage.full }}%</span>
              </div>
              <div class="stat">
                <span class="label">Partial Support:</span>
                <span class="value">{{ feature.usage.partial }}%</span>
              </div>
              <div class="stat">
                <span class="label">Combined:</span>
                <span class="value">{{ feature.usage.combined }}%</span>
              </div>
            </div>
          </section>

          <section class="browser-section">
            <h3>Browser Support (Latest Versions)</h3>
            <div class="browser-list">
              <div 
                v-for="browser in browserList.slice(0, 10)" 
                :key="browser.id"
                class="browser-row"
              >
                <span class="browser-name">{{ browser.name }}</span>
                <span class="version">v{{ browser.latestVersion }}</span>
                <span 
                  class="status-badge"
                  :class="browser.latestSupport.status"
                >
                  {{ browser.latestSupport.status }}
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
}

.close-btn {
  width: 2rem;
  height: 2rem;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.section-description {
  margin-bottom: 1rem;
}

.usage-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
  text-transform: uppercase;
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