<template>
  <div class="editor-page">
    <CertificateEditor
      v-if="template"
      :template-id="templateId"
      :template-name="template.name"
      :initial-data="template.templateData || undefined"
      @save="handleSave"
      @preview="handlePreview"
    />
    
    <!-- Загрузка -->
    <div v-else-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Загрузка шаблона...</p>
    </div>
    
    <!-- Ошибка -->
    <div v-else-if="error" class="error-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="m15 9-6 6"/>
        <path d="m9 9 6 6"/>
      </svg>
      <h2>Ошибка загрузки</h2>
      <p>{{ error }}</p>
      <button @click="loadTemplate">Повторить</button>
    </div>
    
    <!-- Модальное окно предпросмотра -->
    <Teleport to="body">
      <div v-if="showPreview" class="preview-modal" @click.self="closePreview">
        <div class="preview-content">
          <div class="preview-header">
            <h3>Предпросмотр сертификата</h3>
            <div class="preview-info" v-if="previewData">
              <span class="info-badge">{{ previewData.width }}×{{ previewData.height }}px</span>
              <span class="info-badge">{{ previewData.elementsCount }} элементов</span>
            </div>
            <button class="close-btn" @click="closePreview">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
          <div class="preview-body">
            <div class="preview-loading" v-if="previewLoading">
              <div class="loading-spinner"></div>
              <p>Генерация предпросмотра...</p>
            </div>
            <div v-else-if="previewError" class="preview-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
              <p>{{ previewError }}</p>
            </div>
            <div 
              v-else-if="previewHtml" 
              class="preview-certificate"
              :style="{
                width: `${(previewData?.width || 1123) * previewScale}px`,
                height: `${(previewData?.height || 794) * previewScale}px`,
              }"
            >
              <iframe
                ref="previewIframeRef"
                :srcdoc="previewHtml"
                class="preview-iframe"
                sandbox="allow-same-origin"
              ></iframe>
            </div>
            <div v-else class="preview-empty">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              <p>Нажмите "Обновить" для генерации предпросмотра</p>
            </div>
          </div>
          <div class="preview-footer">
            <div class="footer-left">
              <span class="scale-label">Масштаб:</span>
              <button 
                class="scale-btn" 
                :class="{ active: previewScale === 0.5 }"
                @click="previewScale = 0.5"
              >50%</button>
              <button 
                class="scale-btn" 
                :class="{ active: previewScale === 0.75 }"
                @click="previewScale = 0.75"
              >75%</button>
              <button 
                class="scale-btn" 
                :class="{ active: previewScale === 1 }"
                @click="previewScale = 1"
              >100%</button>
            </div>
            <div class="footer-right">
              <button class="btn-refresh" @click="loadPreview" :disabled="previewLoading">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24"/>
                  <path d="M21 3v6h-6"/>
                </svg>
                Обновить
              </button>
              <button class="btn-secondary" @click="closePreview">Закрыть</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- Уведомления -->
    <Teleport to="body">
      <div v-if="notification" class="notification" :class="notification.type">
        <svg v-if="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <path d="m9 11 3 3L22 4"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4"/>
          <path d="M12 16h.01"/>
        </svg>
        <span>{{ notification.message }}</span>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthFetch } from '~/composables/useAuthFetch'
import type { CertificateTemplate, CertificateTemplateData } from '~/types/certificate'
import CertificateEditor from '~/components/certificates/editor/CertificateEditor.vue'

definePageMeta({
  layout: 'blank',
})

const route = useRoute()
const router = useRouter()
const { authFetch } = useAuthFetch()

const templateId = computed(() => route.params.id as string)
const template = ref<CertificateTemplate | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null)

// Preview state
const showPreview = ref(false)
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const previewHtml = ref<string | null>(null)
const previewData = ref<{ width: number; height: number; elementsCount: number } | null>(null)
const previewScale = ref(0.75)
const previewIframeRef = ref<HTMLIFrameElement | null>(null)

// Загрузка шаблона
async function loadTemplate() {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await authFetch<{ success: boolean; template: CertificateTemplate }>(`/api/certificates/templates/${templateId.value}`)
    
    if (response.success) {
      template.value = response.template
      console.log('[CertificateEditor] Шаблон загружен:', template.value?.name)
    } else {
      throw new Error('Шаблон не найден')
    }
  } catch (e) {
    console.error('[CertificateEditor] Ошибка загрузки шаблона:', e)
    error.value = e instanceof Error ? e.message : 'Неизвестная ошибка'
  } finally {
    isLoading.value = false
  }
}

// Сохранение шаблона
async function handleSave(data: CertificateTemplateData) {
  isSaving.value = true
  
  try {
    const response = await authFetch<{ success: boolean; template: CertificateTemplate }>(`/api/certificates/templates/${templateId.value}`, {
      method: 'PUT',
      body: {
        templateData: data,
        layout: data.layout,
      },
    })
    
    if (response.success) {
      template.value = response.template
      showNotification('success', 'Шаблон успешно сохранён')
      console.log('[CertificateEditor] Шаблон сохранён')
    } else {
      throw new Error('Ошибка сохранения')
    }
  } catch (e) {
    console.error('[CertificateEditor] Ошибка сохранения:', e)
    showNotification('error', 'Ошибка сохранения шаблона')
  } finally {
    isSaving.value = false
  }
}

// Предпросмотр
async function handlePreview() {
  showPreview.value = true
  await nextTick()
  await loadPreview()
}

// Загрузка preview с сервера
async function loadPreview() {
  previewLoading.value = true
  previewError.value = null
  
  try {
    const response = await authFetch<{
      success: boolean;
      hasTemplate: boolean;
      preview?: {
        html: string;
        width: number;
        height: number;
        elementsCount: number;
      };
      message?: string;
    }>(`/api/certificates/templates/${templateId.value}/preview`)
    
    if (response.success && response.hasTemplate && response.preview) {
      previewHtml.value = response.preview.html
      previewData.value = {
        width: response.preview.width,
        height: response.preview.height,
        elementsCount: response.preview.elementsCount,
      }
    } else {
      previewError.value = response.message || 'Шаблон не настроен'
    }
  } catch (e) {
    console.error('[CertificateEditor] Ошибка загрузки preview:', e)
    previewError.value = 'Ошибка генерации предпросмотра'
  } finally {
    previewLoading.value = false
  }
}

// Закрытие preview
function closePreview() {
  showPreview.value = false
  previewHtml.value = null
  previewData.value = null
  previewError.value = null
}

// Показ уведомления
function showNotification(type: 'success' | 'error', message: string) {
  notification.value = { type, message }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

onMounted(() => {
  loadTemplate()
})
</script>

<style scoped>
.editor-page {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Загрузка */
.loading-state {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: var(--color-gray-100);
}

:root.dark .loading-state {
  background: var(--color-gray-900);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-gray-200);
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: var(--color-gray-600);
  font-size: 0.875rem;
}

/* Ошибка */
.error-state {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: var(--color-gray-100);
  text-align: center;
  padding: 2rem;
}

:root.dark .error-state {
  background: var(--color-gray-900);
}

.error-state svg {
  color: #DC2626;
}

.error-state h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0;
}

:root.dark .error-state h2 {
  color: white;
}

.error-state p {
  color: var(--color-gray-600);
  margin: 0;
}

.error-state button {
  padding: 0.625rem 1.5rem;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}

/* Модальное окно предпросмотра */
.preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.preview-content {
  background: white;
  border-radius: 1rem;
  width: 95vw;
  max-width: 1200px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

:root.dark .preview-content {
  background: var(--color-gray-800);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
  gap: 1rem;
}

:root.dark .preview-header {
  border-color: var(--color-gray-700);
}

.preview-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-900);
}

:root.dark .preview-header h3 {
  color: white;
}

.preview-info {
  display: flex;
  gap: 0.5rem;
  flex: 1;
}

.info-badge {
  padding: 0.25rem 0.75rem;
  background: var(--color-gray-100);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-gray-600);
}

:root.dark .info-badge {
  background: var(--color-gray-700);
  color: var(--color-gray-400);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: var(--color-gray-500);
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-900);
}

:root.dark .close-btn:hover {
  background: var(--color-gray-700);
  color: white;
}

.preview-body {
  flex: 1;
  overflow: auto;
  padding: 2rem;
  background: var(--color-gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

:root.dark .preview-body {
  background: var(--color-gray-900);
}

.preview-loading,
.preview-error,
.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
}

.preview-loading p,
.preview-error p,
.preview-empty p {
  color: var(--color-gray-500);
  font-size: 0.875rem;
  margin: 0;
}

.preview-error svg {
  color: #F59E0B;
}

.preview-empty svg {
  color: var(--color-gray-400);
}

.preview-certificate {
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  transform-origin: top left;
}

.preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-gray-200);
}

:root.dark .preview-footer {
  border-color: var(--color-gray-700);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.scale-label {
  font-size: 0.8125rem;
  color: var(--color-gray-500);
  margin-right: 0.25rem;
}

.scale-btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--color-gray-100);
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  color: var(--color-gray-600);
  cursor: pointer;
  transition: all 0.15s;
}

.scale-btn:hover {
  background: var(--color-gray-200);
}

.scale-btn.active {
  background: #3B82F6;
  border-color: #3B82F6;
  color: white;
}

:root.dark .scale-btn {
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
  color: var(--color-gray-400);
}

:root.dark .scale-btn:hover {
  background: var(--color-gray-600);
}

:root.dark .scale-btn.active {
  background: #3B82F6;
  border-color: #3B82F6;
  color: white;
}

.footer-right {
  display: flex;
  gap: 0.75rem;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: var(--color-gray-100);
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  color: var(--color-gray-700);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-refresh:hover:not(:disabled) {
  background: var(--color-gray-200);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:root.dark .btn-refresh {
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
  color: var(--color-gray-300);
}

.btn-secondary {
  padding: 0.625rem 1rem;
  background: transparent;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  color: var(--color-gray-700);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary:hover {
  background: var(--color-gray-50);
}

:root.dark .btn-secondary {
  border-color: var(--color-gray-600);
  color: var(--color-gray-300);
}

:root.dark .btn-secondary:hover {
  background: var(--color-gray-700);
}

/* Уведомления */
.notification {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  animation: slideIn 0.3s ease;
}

:root.dark .notification {
  background: var(--color-gray-800);
}

.notification.success {
  border-left: 4px solid #10B981;
}

.notification.success svg {
  color: #10B981;
}

.notification.error {
  border-left: 4px solid #EF4444;
}

.notification.error svg {
  color: #EF4444;
}

.notification span {
  color: var(--color-gray-900);
  font-weight: 500;
}

:root.dark .notification span {
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
