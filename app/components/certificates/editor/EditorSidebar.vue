<template>
  <div class="editor-sidebar">
    <!-- Когда элемент не выбран -->
    <template v-if="!selectedElement">
      <div class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </div>
        <p class="empty-title">Выберите элемент</p>
        <p class="empty-text">Кликните на элемент на холсте, чтобы редактировать его свойства</p>
      </div>
    </template>
    
    <!-- Свойства выбранного элемента -->
    <template v-else>
      <div class="sidebar-header">
        <span class="element-type-badge" :class="selectedElement.type">
          {{ getElementTypeLabel(selectedElement.type) }}
        </span>
        <div class="header-actions">
          <button 
            class="action-btn"
            :class="{ active: selectedElement.locked }"
            @click="$emit('toggle-lock')"
            :title="selectedElement.locked ? 'Разблокировать' : 'Заблокировать'"
          >
            <svg v-if="selectedElement.locked" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
            </svg>
          </button>
          <button 
            class="action-btn delete"
            @click="$emit('delete')"
            title="Удалить"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Позиция и размер -->
      <div class="sidebar-section">
        <h4 class="section-title">Позиция и размер</h4>
        
        <div class="input-grid">
          <div class="input-group">
            <label>X</label>
            <input 
              type="number" 
              :value="Math.round(selectedElement.x)"
              @input="updateNumericProp('x', $event)"
              :disabled="selectedElement.locked"
            >
          </div>
          <div class="input-group">
            <label>Y</label>
            <input 
              type="number" 
              :value="Math.round(selectedElement.y)"
              @input="updateNumericProp('y', $event)"
              :disabled="selectedElement.locked"
            >
          </div>
          <div class="input-group">
            <label>Ширина</label>
            <input 
              type="number" 
              :value="Math.round(selectedElement.width)"
              @input="updateNumericProp('width', $event)"
              :disabled="selectedElement.locked"
              min="20"
            >
          </div>
          <div class="input-group">
            <label>Высота</label>
            <input 
              type="number" 
              :value="Math.round(selectedElement.height)"
              @input="updateNumericProp('height', $event)"
              :disabled="selectedElement.locked"
              min="20"
            >
          </div>
        </div>
        
        <div class="input-group full">
          <label>Поворот (°)</label>
          <input 
            type="range" 
            :value="selectedElement.rotation"
            @input="updateNumericProp('rotation', $event)"
            :disabled="selectedElement.locked"
            min="0"
            max="360"
          >
          <span class="range-value">{{ selectedElement.rotation }}°</span>
        </div>
      </div>
      
      <!-- Настройки текста (для text и variable) -->
      <template v-if="selectedElement.type === 'text' || selectedElement.type === 'variable'">
        <div class="sidebar-section">
          <h4 class="section-title">Текст</h4>
          
          <!-- Содержимое (только для text) -->
          <div v-if="selectedElement.type === 'text'" class="input-group full">
            <label>Содержимое</label>
            <textarea 
              :value="(selectedElement as TextElement).content"
              @input="updateTextProp('content', $event)"
              :disabled="selectedElement.locked"
              rows="2"
            ></textarea>
          </div>
          
          <!-- Переменная (только для variable) -->
          <div v-if="selectedElement.type === 'variable'" class="input-group full">
            <label>Переменная</label>
            <select 
              :value="(selectedElement as VariableElement).variableKey"
              @change="updateVariableKey($event)"
              :disabled="selectedElement.locked"
            >
              <optgroup v-for="group in variableGroups" :key="group.name" :label="group.name">
                <option v-for="v in group.variables" :key="v.key" :value="v.key">
                  {{ v.label }}
                </option>
              </optgroup>
            </select>
          </div>
          
          <div class="input-group full">
            <label>Шрифт</label>
            <select 
              :value="getTextProp('fontFamily')"
              @change="updateTextProp('fontFamily', $event)"
              :disabled="selectedElement.locked"
            >
              <option v-for="font in AVAILABLE_FONTS" :key="font" :value="font">
                {{ font }}
              </option>
            </select>
          </div>
          
          <div class="input-grid">
            <div class="input-group">
              <label>Размер</label>
              <input 
                type="number" 
                :value="getTextProp('fontSize')"
                @input="updateTextProp('fontSize', $event)"
                :disabled="selectedElement.locked"
                min="8"
                max="200"
              >
            </div>
            <div class="input-group">
              <label>Межстрочный</label>
              <input 
                type="number" 
                :value="getTextProp('lineHeight')"
                @input="updateTextProp('lineHeight', $event)"
                :disabled="selectedElement.locked"
                min="0.5"
                max="3"
                step="0.1"
              >
            </div>
          </div>
          
          <div class="button-group">
            <button 
              class="style-btn"
              :class="{ active: getTextProp('fontWeight') === 'bold' }"
              @click="toggleFontWeight"
              :disabled="selectedElement.locked"
              title="Жирный"
            >
              <strong>B</strong>
            </button>
            <button 
              class="style-btn"
              :class="{ active: getTextProp('fontStyle') === 'italic' }"
              @click="toggleFontStyle"
              :disabled="selectedElement.locked"
              title="Курсив"
            >
              <em>I</em>
            </button>
            <div class="separator"></div>
            <button 
              class="style-btn"
              :class="{ active: getTextProp('textAlign') === 'left' }"
              @click="setTextAlign('left')"
              :disabled="selectedElement.locked"
              title="По левому краю"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="21" y1="6" x2="3" y2="6"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
                <line x1="17" y1="18" x2="3" y2="18"/>
              </svg>
            </button>
            <button 
              class="style-btn"
              :class="{ active: getTextProp('textAlign') === 'center' }"
              @click="setTextAlign('center')"
              :disabled="selectedElement.locked"
              title="По центру"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="21" y1="6" x2="3" y2="6"/>
                <line x1="17" y1="12" x2="7" y2="12"/>
                <line x1="19" y1="18" x2="5" y2="18"/>
              </svg>
            </button>
            <button 
              class="style-btn"
              :class="{ active: getTextProp('textAlign') === 'right' }"
              @click="setTextAlign('right')"
              :disabled="selectedElement.locked"
              title="По правому краю"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="21" y1="6" x2="3" y2="6"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
                <line x1="21" y1="18" x2="7" y2="18"/>
              </svg>
            </button>
          </div>
          
          <div class="input-group full">
            <label>Цвет</label>
            <div class="color-picker">
              <input 
                type="color" 
                :value="getTextProp('color')"
                @input="updateTextProp('color', $event)"
                :disabled="selectedElement.locked"
              >
              <input 
                type="text" 
                :value="getTextProp('color')"
                @input="updateTextProp('color', $event)"
                :disabled="selectedElement.locked"
                class="color-text"
              >
            </div>
          </div>
          
          <div class="input-group full">
            <label>Заливка фона</label>
            <div class="color-picker">
              <input 
                type="color" 
                :value="getBackgroundColor()"
                @input="updateBackgroundColor($event)"
                :disabled="selectedElement.locked || isTransparentBackground()"
              >
              <input 
                type="text" 
                :value="getBackgroundColor()"
                @input="updateBackgroundColor($event)"
                :disabled="selectedElement.locked || isTransparentBackground()"
                class="color-text"
              >
            </div>
            <div class="checkbox-group mt-1">
              <label>
                <input 
                  type="checkbox"
                  :checked="isTransparentBackground()"
                  @change="toggleTransparentBackground"
                  :disabled="selectedElement.locked"
                >
                Без заливки
              </label>
            </div>
          </div>
        </div>
      </template>
      
      <!-- Настройки изображения -->
      <template v-if="selectedElement.type === 'image'">
        <div class="sidebar-section">
          <h4 class="section-title">Изображение</h4>
          
          <div class="input-group full">
            <label>Подгонка</label>
            <select 
              :value="(selectedElement as ImageElement).objectFit"
              @change="updateProp('objectFit', ($event.target as HTMLSelectElement).value)"
              :disabled="selectedElement.locked"
            >
              <option value="contain">Вместить</option>
              <option value="cover">Заполнить</option>
              <option value="fill">Растянуть</option>
            </select>
          </div>
          
          <div class="input-group full">
            <label>Прозрачность</label>
            <input 
              type="range" 
              :value="(selectedElement as ImageElement).opacity"
              @input="updateNumericProp('opacity', $event)"
              :disabled="selectedElement.locked"
              min="0"
              max="1"
              step="0.05"
            >
            <span class="range-value">{{ Math.round((selectedElement as ImageElement).opacity * 100) }}%</span>
          </div>
          
          <button class="change-image-btn" @click="handleChangeImage" :disabled="selectedElement.locked">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Заменить изображение
          </button>
          <input 
            ref="imageInputRef"
            type="file" 
            accept="image/*" 
            class="hidden-input"
            @change="onImageSelected"
          >
        </div>
      </template>
      
      <!-- Настройки QR-кода -->
      <template v-if="selectedElement.type === 'qr'">
        <div class="sidebar-section">
          <h4 class="section-title">QR-код</h4>
          
          <div class="input-group full">
            <label>Источник данных</label>
            <select 
              :value="(selectedElement as QRElement).dataSource"
              @change="updateProp('dataSource', ($event.target as HTMLSelectElement).value)"
              :disabled="selectedElement.locked"
            >
              <option value="certificate_url">URL сертификата</option>
              <option value="certificate_number">Номер сертификата</option>
              <option value="custom">Кастомный</option>
            </select>
          </div>
          
          <div v-if="(selectedElement as QRElement).dataSource === 'custom'" class="input-group full">
            <label>Данные</label>
            <input 
              type="text"
              :value="(selectedElement as QRElement).customData"
              @input="updateProp('customData', ($event.target as HTMLInputElement).value)"
              :disabled="selectedElement.locked"
              placeholder="Введите данные для QR"
            >
          </div>
          
          <div class="input-grid">
            <div class="input-group">
              <label>Цвет</label>
              <input 
                type="color" 
                :value="(selectedElement as QRElement).color"
                @input="updateProp('color', ($event.target as HTMLInputElement).value)"
                :disabled="selectedElement.locked"
              >
            </div>
            <div class="input-group">
              <label>Фон</label>
              <input 
                type="color" 
                :value="(selectedElement as QRElement).backgroundColor"
                @input="updateProp('backgroundColor', ($event.target as HTMLInputElement).value)"
                :disabled="selectedElement.locked"
              >
            </div>
          </div>
        </div>
      </template>
      
      <!-- Настройки фигуры -->
      <template v-if="selectedElement.type === 'shape'">
        <div class="sidebar-section">
          <h4 class="section-title">Фигура</h4>
          
          <div class="input-group full">
            <label>Тип</label>
            <select 
              :value="(selectedElement as ShapeElement).shapeType"
              @change="updateProp('shapeType', ($event.target as HTMLSelectElement).value)"
              :disabled="selectedElement.locked"
            >
              <option value="rectangle">Прямоугольник</option>
              <option value="circle">Круг</option>
              <option value="line">Линия</option>
            </select>
          </div>
          
          <div class="input-grid">
            <div class="input-group">
              <label>Заливка</label>
              <input 
                type="color" 
                :value="(selectedElement as ShapeElement).fillColor === 'transparent' ? '#ffffff' : (selectedElement as ShapeElement).fillColor"
                @input="updateProp('fillColor', ($event.target as HTMLInputElement).value)"
                :disabled="selectedElement.locked"
              >
            </div>
            <div class="input-group">
              <label>Обводка</label>
              <input 
                type="color" 
                :value="(selectedElement as ShapeElement).strokeColor"
                @input="updateProp('strokeColor', ($event.target as HTMLInputElement).value)"
                :disabled="selectedElement.locked"
              >
            </div>
          </div>
          
          <div class="input-group full">
            <label>Толщина обводки</label>
            <input 
              type="range" 
              :value="(selectedElement as ShapeElement).strokeWidth"
              @input="updateNumericProp('strokeWidth', $event)"
              :disabled="selectedElement.locked"
              min="0"
              max="20"
            >
            <span class="range-value">{{ (selectedElement as ShapeElement).strokeWidth }}px</span>
          </div>
          
          <div class="checkbox-group">
            <label>
              <input 
                type="checkbox"
                :checked="(selectedElement as ShapeElement).fillColor === 'transparent'"
                @change="toggleTransparentFill"
                :disabled="selectedElement.locked"
              >
              Без заливки
            </label>
          </div>
        </div>
      </template>
      
      <!-- Действия -->
      <div class="sidebar-section actions-section">
        <h4 class="section-title">Действия</h4>
        
        <div class="action-buttons">
          <button class="action-button" @click="$emit('duplicate')" :disabled="selectedElement.locked">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            Дублировать
          </button>
          <button class="action-button" @click="$emit('bring-to-front')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="8" height="8" x="8" y="8" rx="1"/>
              <path d="M4 16V6a2 2 0 0 1 2-2h10"/>
              <path d="M14 22h4a2 2 0 0 0 2-2v-4"/>
            </svg>
            На передний план
          </button>
          <button class="action-button" @click="$emit('send-to-back')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="8" height="8" x="8" y="8" rx="1"/>
              <path d="M4 10v10a2 2 0 0 0 2 2h10"/>
              <path d="M10 4H6a2 2 0 0 0-2 2v4"/>
            </svg>
            На задний план
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AVAILABLE_VARIABLES, AVAILABLE_FONTS } from '~/composables/useCertificateEditor'
import type { 
  TemplateElement,
  TextElement,
  VariableElement,
  ImageElement,
  QRElement,
  ShapeElement,
  VariableSource,
} from '~/types/certificate'

const props = defineProps<{
  selectedElement: TemplateElement | null
}>()

const emit = defineEmits<{
  (e: 'update', id: string, updates: Partial<TemplateElement>): void
  (e: 'delete'): void
  (e: 'duplicate'): void
  (e: 'bring-to-front'): void
  (e: 'send-to-back'): void
  (e: 'toggle-lock'): void
}>()

const imageInputRef = ref<HTMLInputElement | null>(null)

// Группы переменных
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

function getElementTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: 'Текст',
    variable: 'Переменная',
    image: 'Изображение',
    qr: 'QR-код',
    shape: 'Фигура',
  }
  return labels[type] || type
}

function getTextProp(prop: string): any {
  if (!props.selectedElement) return ''
  return (props.selectedElement as any)[prop]
}

function updateProp(prop: string, value: any) {
  if (!props.selectedElement) return
  emit('update', props.selectedElement.id, { [prop]: value })
}

function updateNumericProp(prop: string, event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(value)) {
    updateProp(prop, value)
  }
}

function updateTextProp(prop: string, event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  // Для fontSize и lineHeight конвертируем в число
  if (prop === 'fontSize' || prop === 'lineHeight') {
    updateProp(prop, parseFloat(target.value))
  } else {
    updateProp(prop, target.value)
  }
}

function updateVariableKey(event: Event) {
  const value = (event.target as HTMLSelectElement).value as VariableSource
  const variable = AVAILABLE_VARIABLES.find(v => v.key === value)
  emit('update', props.selectedElement!.id, {
    variableKey: value,
    placeholder: variable?.placeholder || '[Переменная]',
  })
}

function toggleFontWeight() {
  const current = getTextProp('fontWeight')
  updateProp('fontWeight', current === 'bold' ? 'normal' : 'bold')
}

function toggleFontStyle() {
  const current = getTextProp('fontStyle')
  updateProp('fontStyle', current === 'italic' ? 'normal' : 'italic')
}

function setTextAlign(align: 'left' | 'center' | 'right') {
  updateProp('textAlign', align)
}

// Функции для работы с заливкой фона текста
function getBackgroundColor(): string {
  if (!props.selectedElement) return '#ffffff'
  const bg = (props.selectedElement as any).backgroundColor
  // Если transparent или undefined, показываем белый в пикере
  return (!bg || bg === 'transparent') ? '#ffffff' : bg
}

function isTransparentBackground(): boolean {
  if (!props.selectedElement) return true
  const bg = (props.selectedElement as any).backgroundColor
  return !bg || bg === 'transparent'
}

function updateBackgroundColor(event: Event) {
  const value = (event.target as HTMLInputElement).value
  updateProp('backgroundColor', value)
}

function toggleTransparentBackground() {
  const current = (props.selectedElement as any).backgroundColor
  updateProp('backgroundColor', (!current || current === 'transparent') ? '#ffffff' : 'transparent')
}

function toggleTransparentFill() {
  const current = (props.selectedElement as ShapeElement).fillColor
  updateProp('fillColor', current === 'transparent' ? '#ffffff' : 'transparent')
}

function handleChangeImage() {
  imageInputRef.value?.click()
}

function onImageSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (event) => {
    const src = event.target?.result as string
    updateProp('src', src)
  }
  reader.readAsDataURL(file)
  
  input.value = ''
}
</script>

<style scoped>
.editor-sidebar {
  width: 280px;
  background: white;
  border-left: 1px solid var(--color-gray-200);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

:root.dark .editor-sidebar {
  background: var(--color-gray-800);
  border-color: var(--color-gray-700);
}

/* Пустое состояние */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.empty-icon {
  color: var(--color-gray-400);
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin: 0 0 0.5rem 0;
}

:root.dark .empty-title {
  color: var(--color-gray-300);
}

.empty-text {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin: 0;
  line-height: 1.5;
}

/* Заголовок */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--color-gray-100);
}

:root.dark .sidebar-header {
  border-color: var(--color-gray-700);
}

.element-type-badge {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.element-type-badge.text {
  background: #DBEAFE;
  color: #1E40AF;
}

.element-type-badge.variable {
  background: #EDE9FE;
  color: #5B21B6;
}

.element-type-badge.image {
  background: #D1FAE5;
  color: #065F46;
}

.element-type-badge.qr {
  background: #FEE2E2;
  color: #991B1B;
}

.element-type-badge.shape {
  background: #FEF3C7;
  color: #92400E;
}

.header-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  color: var(--color-gray-500);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

.action-btn.active {
  background: var(--color-gray-200);
  color: var(--color-gray-900);
}

.action-btn.delete:hover {
  background: #FEE2E2;
  color: #DC2626;
}

:root.dark .action-btn:hover {
  background: var(--color-gray-700);
  color: var(--color-gray-300);
}

:root.dark .action-btn.delete:hover {
  background: rgba(220, 38, 38, 0.2);
  color: #F87171;
}

/* Секции */
.sidebar-section {
  padding: 1rem;
  border-bottom: 1px solid var(--color-gray-100);
}

:root.dark .sidebar-section {
  border-color: var(--color-gray-700);
}

.section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-gray-500);
  margin: 0 0 0.75rem 0;
  letter-spacing: 0.05em;
}

/* Поля ввода */
.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-group.full {
  margin-bottom: 0.75rem;
}

.input-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-gray-600);
}

:root.dark .input-group label {
  color: var(--color-gray-400);
}

.input-group input[type="number"],
.input-group input[type="text"],
.input-group select,
.input-group textarea {
  padding: 0.5rem;
  font-size: 0.875rem;
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  color: var(--color-gray-900);
  transition: border-color 0.15s;
}

.input-group input:focus,
.input-group select:focus,
.input-group textarea:focus {
  outline: none;
  border-color: #3B82F6;
}

.input-group input:disabled,
.input-group select:disabled,
.input-group textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

:root.dark .input-group input,
:root.dark .input-group select,
:root.dark .input-group textarea {
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
  color: var(--color-gray-200);
}

.input-group input[type="range"] {
  flex: 1;
}

.range-value {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  min-width: 40px;
  text-align: right;
}

/* Кнопки стилей */
.button-group {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.style-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  color: var(--color-gray-600);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s;
}

.style-btn:hover:not(:disabled) {
  background: var(--color-gray-100);
  border-color: var(--color-gray-300);
}

.style-btn.active {
  background: #3B82F6;
  border-color: #3B82F6;
  color: white;
}

.style-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:root.dark .style-btn {
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
  color: var(--color-gray-400);
}

.separator {
  width: 1px;
  background: var(--color-gray-200);
  margin: 0 0.25rem;
}

:root.dark .separator {
  background: var(--color-gray-600);
}

/* Цветовой выбор */
.color-picker {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-picker input[type="color"] {
  width: 36px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  cursor: pointer;
}

.color-picker .color-text {
  flex: 1;
  font-family: monospace;
  font-size: 0.8125rem;
}

/* Checkbox */
.checkbox-group {
  margin-top: 0.5rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-gray-700);
  cursor: pointer;
}

:root.dark .checkbox-group label {
  color: var(--color-gray-300);
}

/* Кнопка смены изображения */
.change-image-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem;
  background: var(--color-gray-50);
  border: 1px dashed var(--color-gray-300);
  border-radius: 0.5rem;
  color: var(--color-gray-600);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
}

.change-image-btn:hover:not(:disabled) {
  background: var(--color-gray-100);
  border-color: var(--color-gray-400);
}

.change-image-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:root.dark .change-image-btn {
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
  color: var(--color-gray-400);
}

/* Действия */
.actions-section {
  margin-top: auto;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  color: var(--color-gray-700);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.15s;
}

.action-button:hover:not(:disabled) {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:root.dark .action-button {
  border-color: var(--color-gray-600);
  color: var(--color-gray-300);
}

:root.dark .action-button:hover:not(:disabled) {
  background: var(--color-gray-700);
}

.hidden-input {
  display: none;
}

/* Утилитарные классы */
.mt-1 {
  margin-top: 0.25rem;
}
</style>
