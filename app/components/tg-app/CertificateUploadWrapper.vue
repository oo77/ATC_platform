<template>
  <div class="tg-upload-wrapper">
    <!-- Переключатель режимов -->
    <div class="tg-mode-switch">
      <button
        class="tg-mode-btn"
        :class="{ active: mode === 'ai' }"
        @click="mode = 'ai'"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
        <span class="tg-mode-label">AI импорт</span>
        <span class="tg-mode-badge">Новое</span>
      </button>
      <button
        class="tg-mode-btn"
        :class="{ active: mode === 'manual' }"
        @click="mode = 'manual'"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        <span class="tg-mode-label">Вручную</span>
      </button>
    </div>

    <!-- AI режим -->
    <CertificateAIUploadTab
      v-if="mode === 'ai'"
      :organization-id="organizationId"
      :permissions="permissions"
      :representative="representative"
    />

    <!-- Ручной режим -->
    <CertificateManualUploadTab
      v-else
      :organization-id="organizationId"
      :permissions="permissions"
      :representative="representative"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import CertificateAIUploadTab from "./CertificateAIUploadTab.vue";
import CertificateManualUploadTab from "./CertificateManualUploadTab.vue";

defineProps({
  organizationId: {
    type: String,
    required: true,
  },
  permissions: {
    type: Object,
    required: true,
  },
  representative: {
    type: Object,
    default: null,
  },
});

const mode = ref("ai"); // По умолчанию AI режим
</script>

<style scoped>
.tg-upload-wrapper {
  padding: 0;
}

/* Mode Switch */
.tg-mode-switch {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.25rem;
  background: #f1f5f9;
  border-radius: 12px;
}

.tg-mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tg-mode-btn.active {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tg-mode-btn:not(.active):active {
  background: #e2e8f0;
}

.tg-mode-btn svg {
  color: #64748b;
  flex-shrink: 0;
}

.tg-mode-btn.active svg {
  color: #2563eb;
}

.tg-mode-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
}

.tg-mode-btn.active .tg-mode-label {
  color: #1e293b;
}

.tg-mode-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  font-size: 0.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}
</style>
