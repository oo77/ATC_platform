<template>
  <div class="editor-toolbar">
    <div class="toolbar-section">
      <h3 class="section-title">Элементы</h3>
      
      <button class="tool-btn" @click="$emit('add-text')" title="Добавить текст">
        <div class="tool-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4,7 4,4 20,4 20,7"/>
            <line x1="9" y1="20" x2="15" y2="20"/>
            <line x1="12" y1="4" x2="12" y2="20"/>
          </svg>
        </div>
        <span class="tool-label">Текст</span>
      </button>
      
      <div class="tool-dropdown">
        <button class="tool-btn" @click="toggleVariableMenu" title="Добавить переменную">
          <div class="tool-icon variable-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <path d="M8 10h8"/>
              <path d="M8 14h4"/>
            </svg>
          </div>
          <span class="tool-label">Переменная</span>
          <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        
        <div v-if="showVariableMenu" class="dropdown-menu">
          <div class="dropdown-header">Выберите переменную</div>
          <div class="dropdown-group" v-for="group in variableGroups" :key="group.name">
            <div class="group-title">{{ group.name }}</div>
            <button 
              v-for="variable in group.variables" 
              :key="variable.key"
              class="dropdown-item"
              @click="selectVariable(variable.key)"
            >
              <span class="var-label">{{ variable.label }}</span>
              <span class="var-placeholder">{{ variable.placeholder }}</span>
            </button>
          </div>
        </div>
      </div>
      
      <button class="tool-btn" @click="handleImageUpload" title="Добавить изображение">
        <div class="tool-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </div>
        <span class="tool-label">Изображение</span>
      </button>
      <input 
        ref="imageInputRef"
        type="file" 
        accept="image/*" 
        class="hidden-input"
        @change="onImageSelected"
      >
      
      <button class="tool-btn" @click="$emit('add-qr')" title="Добавить QR-код">
        <div class="tool-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="5" height="5" x="3" y="3" rx="1"/>
            <rect width="5" height="5" x="16" y="3" rx="1"/>
            <rect width="5" height="5" x="3" y="16" rx="1"/>
            <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
            <path d="M21 21v.01"/>
            <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
            <path d="M3 12h.01"/>
            <path d="M12 3h.01"/>
            <path d="M12 16v.01"/>
            <path d="M16 12h1"/>
            <path d="M21 12v.01"/>
            <path d="M12 21v-1"/>
          </svg>
        </div>
        <span class="tool-label">QR-код</span>
      </button>
      
      <div class="tool-dropdown">
        <button class="tool-btn" @click="toggleShapeMenu" title="Добавить фигуру">
          <div class="tool-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="5" y="5" rx="2"/>
            </svg>
          </div>
          <span class="tool-label">Фигуры</span>
          <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        
        <div v-if="showShapeMenu" class="dropdown-menu shapes-menu">
          <button class="dropdown-item shape-item" @click="selectShape('rectangle')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="18" height="14" x="3" y="5" rx="2"/>
            </svg>
            <span>Прямоугольник</span>
          </button>
          <button class="dropdown-item shape-item" @click="selectShape('circle')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/>
            </svg>
            <span>Круг</span>
          </button>
          <button class="dropdown-item shape-item" @click="selectShape('line')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 19L19 5"/>
            </svg>
            <span>Линия</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="toolbar-section">
      <h3 class="section-title">Макет</h3>
      
      <div class="layout-options">
        <button 
          class="layout-btn"
          :class="{ active: currentLayout === 'A4_landscape' }"
          @click="$emit('set-layout', 'A4_landscape')"
          title="A4 альбомная"
        >
          <div class="layout-preview landscape"></div>
          <span>Альбомная</span>
        </button>
        <button 
          class="layout-btn"
          :class="{ active: currentLayout === 'A4_portrait' }"
          @click="$emit('set-layout', 'A4_portrait')"
          title="A4 книжная"
        >
          <div class="layout-preview portrait"></div>
          <span>Книжная</span>
        </button>
      </div>
    </div>
    
    <div class="toolbar-section">
      <h3 class="section-title">Фон</h3>
      
      <div class="background-options">
        <button 
          class="bg-btn"
          @click="setBackgroundColor('#FFFFFF')"
          title="Белый фон"
        >
          <div class="color-swatch" style="background: #FFFFFF; border: 1px solid #E5E7EB;"></div>
        </button>
        <button 
          class="bg-btn"
          @click="setBackgroundColor('#FFF8E7')"
          title="Кремовый фон"
        >
          <div class="color-swatch" style="background: #FFF8E7;"></div>
        </button>
        <button 
          class="bg-btn"
          @click="setBackgroundColor('#F0F9FF')"
          title="Голубоватый фон"
        >
          <div class="color-swatch" style="background: #F0F9FF;"></div>
        </button>
        <button 
          class="bg-btn"
          @click="setBackgroundColor('#F0FDF4')"
          title="Зеленоватый фон"
        >
          <div class="color-swatch" style="background: #F0FDF4;"></div>
        </button>
        <button 
          class="bg-btn upload-bg"
          @click="handleBackgroundUpload"
          title="Загрузить фон"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </button>
      </div>
      <input 
        ref="bgInputRef"
        type="file" 
        accept="image/*" 
        class="hidden-input"
        @change="onBackgroundSelected"
      >
    </div>
    
    <div class="toolbar-section presets-section">
      <h3 class="section-title">Шаблоны</h3>
      
      <button class="preset-btn" @click="applyPreset('classic')" title="Классический">
        <div class="preset-preview classic">
          <div class="pp-line"></div>
          <div class="pp-line short"></div>
          <div class="pp-line"></div>
        </div>
        <span>Классический</span>
      </button>
      
      <button class="preset-btn" @click="applyPreset('modern')" title="Современный">
        <div class="preset-preview modern">
          <div class="pp-line"></div>
          <div class="pp-line short"></div>
          <div class="pp-line"></div>
        </div>
        <span>Современный</span>
      </button>
      
      <button class="preset-btn" @click="applyPreset('minimal')" title="Минималистичный">
        <div class="preset-preview minimal">
          <div class="pp-line"></div>
          <div class="pp-line short"></div>
        </div>
        <span>Минимальный</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { AVAILABLE_VARIABLES } from '~/composables/useCertificateEditor'
import { getPreset } from '~/utils/certificatePresets'
import type { VariableSource, TemplateLayout, TemplateBackground, ShapeType, CertificateTemplateData } from '~/types/certificate'

const props = defineProps<{
  currentLayout: TemplateLayout
}>()

const emit = defineEmits<{
  (e: 'add-text'): void
  (e: 'add-variable', key: VariableSource): void
  (e: 'add-image', src: string): void
  (e: 'add-qr'): void
  (e: 'add-shape', type: ShapeType): void
  (e: 'set-layout', layout: TemplateLayout): void
  (e: 'set-background', bg: TemplateBackground): void
  (e: 'apply-preset', data: CertificateTemplateData): void
}>()

const showVariableMenu = ref(false)
const showShapeMenu = ref(false)
const imageInputRef = ref<HTMLInputElement | null>(null)
const bgInputRef = ref<HTMLInputElement | null>(null)

// Группировка переменных для удобного отображения
const variableGroups = computed(() => [
  {
    name: 'Студент',
    variables: AVAILABLE_VARIABLES.filter(v => v.key.startsWith('student.')),
  },
  {
    name: 'Курс',
    variables: AVAILABLE_VARIABLES.filter(v => v.key.startsWith('course.')),
  },
  {
    name: 'Группа',
    variables: AVAILABLE_VARIABLES.filter(v => v.key.startsWith('group.')),
  },
  {
    name: 'Сертификат',
    variables: AVAILABLE_VARIABLES.filter(v => v.key.startsWith('certificate.')),
  },
])

function toggleVariableMenu() {
  showVariableMenu.value = !showVariableMenu.value
  showShapeMenu.value = false
}

function toggleShapeMenu() {
  showShapeMenu.value = !showShapeMenu.value
  showVariableMenu.value = false
}

function selectVariable(key: VariableSource) {
  emit('add-variable', key)
  showVariableMenu.value = false
}

function selectShape(type: ShapeType) {
  emit('add-shape', type)
  showShapeMenu.value = false
}

function handleImageUpload() {
  imageInputRef.value?.click()
}

function onImageSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (event) => {
    const src = event.target?.result as string
    emit('add-image', src)
  }
  reader.readAsDataURL(file)
  
  // Сброс input для повторной загрузки того же файла
  input.value = ''
}

function handleBackgroundUpload() {
  bgInputRef.value?.click()
}

function onBackgroundSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (event) => {
    const src = event.target?.result as string
    emit('set-background', { type: 'image', value: src })
  }
  reader.readAsDataURL(file)
  
  input.value = ''
}

function setBackgroundColor(color: string) {
  emit('set-background', { type: 'color', value: color })
}

function applyPreset(preset: 'classic' | 'modern' | 'minimal') {
  const presetData = getPreset(preset)
  emit('apply-preset', presetData)
}

// Закрытие меню при клике вне
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.tool-dropdown')) {
    showVariableMenu.value = false
    showShapeMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.editor-toolbar {
  width: 220px;
  background: white;
  border-right: 1px solid var(--color-gray-200);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
}

:root.dark .editor-toolbar {
  background: var(--color-gray-800);
  border-color: var(--color-gray-700);
}

.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-gray-500);
  margin: 0 0 0.25rem 0;
  letter-spacing: 0.05em;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.tool-btn:hover {
  background: var(--color-gray-100);
  border-color: var(--color-gray-200);
}

:root.dark .tool-btn:hover {
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
}

.tool-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-gray-100);
  border-radius: 0.375rem;
  color: var(--color-gray-600);
}

:root.dark .tool-icon {
  background: var(--color-gray-700);
  color: var(--color-gray-400);
}

.variable-icon {
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  color: #4F46E5;
}

:root.dark .variable-icon {
  background: linear-gradient(135deg, #312E81, #3730A3);
  color: #A5B4FC;
}

.tool-label {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
}

:root.dark .tool-label {
  color: var(--color-gray-300);
}

.dropdown-arrow {
  color: var(--color-gray-400);
  transition: transform 0.2s;
}

.tool-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

:root.dark .dropdown-menu {
  background: var(--color-gray-800);
  border-color: var(--color-gray-700);
}

.dropdown-header {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray-500);
  border-bottom: 1px solid var(--color-gray-100);
}

:root.dark .dropdown-header {
  border-color: var(--color-gray-700);
}

.dropdown-group {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-gray-100);
}

:root.dark .dropdown-group {
  border-color: var(--color-gray-700);
}

.dropdown-group:last-child {
  border-bottom: none;
}

.group-title {
  padding: 0.25rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-gray-400);
  letter-spacing: 0.05em;
}

.dropdown-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.dropdown-item:hover {
  background: var(--color-gray-100);
}

:root.dark .dropdown-item:hover {
  background: var(--color-gray-700);
}

.var-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-gray-800);
}

:root.dark .var-label {
  color: var(--color-gray-200);
}

.var-placeholder {
  font-size: 0.7rem;
  color: var(--color-gray-500);
  font-family: monospace;
}

.shapes-menu .dropdown-item {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.shape-item svg {
  color: var(--color-gray-500);
}

.shape-item span {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-gray-700);
}

:root.dark .shape-item span {
  color: var(--color-gray-300);
}

/* Layout options */
.layout-options {
  display: flex;
  gap: 0.5rem;
}

.layout-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem;
  background: transparent;
  border: 2px solid var(--color-gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-btn:hover {
  border-color: var(--color-gray-300);
}

.layout-btn.active {
  border-color: #3B82F6;
  background: #EFF6FF;
}

:root.dark .layout-btn {
  border-color: var(--color-gray-600);
}

:root.dark .layout-btn.active {
  border-color: #3B82F6;
  background: rgba(59, 130, 246, 0.1);
}

.layout-preview {
  background: var(--color-gray-300);
  border-radius: 2px;
}

.layout-preview.landscape {
  width: 40px;
  height: 28px;
}

.layout-preview.portrait {
  width: 28px;
  height: 40px;
}

.layout-btn span {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-gray-600);
}

:root.dark .layout-btn span {
  color: var(--color-gray-400);
}

/* Background options */
.background-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.bg-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: transparent;
  border: 2px solid var(--color-gray-200);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.bg-btn:hover {
  border-color: var(--color-gray-400);
}

:root.dark .bg-btn {
  border-color: var(--color-gray-600);
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 0.25rem;
}

.upload-bg {
  color: var(--color-gray-500);
}

.upload-bg:hover {
  color: var(--color-gray-700);
}

:root.dark .upload-bg:hover {
  color: var(--color-gray-300);
}

/* Presets */
.presets-section {
  margin-top: auto;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.375rem;
}

.preset-btn:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
}

:root.dark .preset-btn {
  border-color: var(--color-gray-600);
}

:root.dark .preset-btn:hover {
  background: var(--color-gray-700);
}

.preset-preview {
  width: 48px;
  height: 32px;
  border-radius: 0.25rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 3px;
  padding: 4px;
}

.preset-preview.classic {
  background: linear-gradient(to bottom, #FEF3C7, #FDE68A);
  border: 1px solid #F59E0B;
}

.preset-preview.modern {
  background: linear-gradient(135deg, #EEF2FF, #C7D2FE);
  border: 1px solid #6366F1;
}

.preset-preview.minimal {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
}

.pp-line {
  width: 80%;
  height: 3px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1px;
}

.pp-line.short {
  width: 50%;
}

.preset-btn span {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-gray-700);
}

:root.dark .preset-btn span {
  color: var(--color-gray-300);
}

.hidden-input {
  display: none;
}
</style>
