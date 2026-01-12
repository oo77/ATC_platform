<template>
  <div 
    class="canvas-wrapper"
    :style="{
      width: `${templateData.width * zoom}px`,
      height: `${templateData.height * zoom}px`,
    }"
    @click.self="$emit('select', null)"
  >
    <div 
      class="canvas-content"
      :style="{
        width: `${templateData.width}px`,
        height: `${templateData.height}px`,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
        background: backgroundStyle,
      }"
    >
      <!-- Элементы сортируются по zIndex -->
      <div
        v-for="element in sortedElements"
        :key="element.id"
        class="canvas-element"
        :class="{
          selected: element.id === selectedElementId,
          locked: element.locked,
        }"
        :style="getElementStyle(element)"
        @mousedown.stop="handleMouseDown($event, element)"
        @dblclick.stop="handleDoubleClick(element)"
      >
        <!-- Текстовый элемент -->
        <template v-if="element.type === 'text'">
          <div 
            class="text-content"
            :style="getTextStyle(element as TextElement)"
            :contenteditable="editingId === element.id"
            @blur="handleTextBlur($event, element)"
            @keydown.enter.prevent="handleTextEnter"
            ref="textEditorRef"
          >
            {{ (element as TextElement).content }}
          </div>
        </template>
        
        <!-- Переменная -->
        <template v-else-if="element.type === 'variable'">
          <div 
            class="variable-content"
            :style="getTextStyle(element as VariableElement)"
          >
            <span class="variable-badge">{{ getVariableLabel((element as VariableElement).variableKey) }}</span>
            {{ (element as VariableElement).placeholder }}
          </div>
        </template>
        
        <!-- Изображение -->
        <template v-else-if="element.type === 'image'">
          <img 
            :src="(element as ImageElement).src"
            :style="{
              width: '100%',
              height: '100%',
              objectFit: (element as ImageElement).objectFit,
              opacity: (element as ImageElement).opacity,
            }"
            draggable="false"
          >
        </template>
        
        <!-- QR-код -->
        <template v-else-if="element.type === 'qr'">
          <div class="qr-placeholder" :style="{ background: (element as QRElement).backgroundColor }">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="80%" 
              height="80%" 
              viewBox="0 0 24 24" 
              fill="none" 
              :stroke="(element as QRElement).color" 
              stroke-width="1.5"
            >
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
            <span class="qr-label">QR</span>
          </div>
        </template>
        
        <!-- Фигура -->
        <template v-else-if="element.type === 'shape'">
          <svg 
            class="shape-svg"
            :width="element.width" 
            :height="element.height"
          >
            <rect 
              v-if="(element as ShapeElement).shapeType === 'rectangle'"
              x="0" 
              y="0" 
              :width="element.width" 
              :height="element.height"
              :fill="(element as ShapeElement).fillColor"
              :stroke="(element as ShapeElement).strokeColor"
              :stroke-width="(element as ShapeElement).strokeWidth"
            />
            <ellipse 
              v-else-if="(element as ShapeElement).shapeType === 'circle'"
              :cx="element.width / 2" 
              :cy="element.height / 2"
              :rx="element.width / 2 - (element as ShapeElement).strokeWidth / 2"
              :ry="element.height / 2 - (element as ShapeElement).strokeWidth / 2"
              :fill="(element as ShapeElement).fillColor"
              :stroke="(element as ShapeElement).strokeColor"
              :stroke-width="(element as ShapeElement).strokeWidth"
            />
            <line 
              v-else-if="(element as ShapeElement).shapeType === 'line'"
              x1="0" 
              y1="0"
              :x2="element.width" 
              :y2="element.height"
              :stroke="(element as ShapeElement).strokeColor"
              :stroke-width="(element as ShapeElement).strokeWidth"
            />
          </svg>
        </template>
        
        <!-- Ручки изменения размера (только для выбранного элемента) -->
        <template v-if="element.id === selectedElementId && !element.locked">
          <div class="resize-handle nw" @mousedown.stop="handleResizeStart($event, element, 'nw')"></div>
          <div class="resize-handle ne" @mousedown.stop="handleResizeStart($event, element, 'ne')"></div>
          <div class="resize-handle sw" @mousedown.stop="handleResizeStart($event, element, 'sw')"></div>
          <div class="resize-handle se" @mousedown.stop="handleResizeStart($event, element, 'se')"></div>
          <div class="resize-handle n" @mousedown.stop="handleResizeStart($event, element, 'n')"></div>
          <div class="resize-handle s" @mousedown.stop="handleResizeStart($event, element, 's')"></div>
          <div class="resize-handle e" @mousedown.stop="handleResizeStart($event, element, 'e')"></div>
          <div class="resize-handle w" @mousedown.stop="handleResizeStart($event, element, 'w')"></div>
        </template>
        
        <!-- Иконка блокировки -->
        <div v-if="element.locked" class="lock-indicator">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { AVAILABLE_VARIABLES } from '~/composables/useCertificateEditor'
import type { 
  CertificateTemplateData, 
  TemplateElement,
  TextElement,
  VariableElement,
  ImageElement,
  QRElement,
  ShapeElement,
  VariableSource,
} from '~/types/certificate'

const props = defineProps<{
  templateData: CertificateTemplateData
  selectedElementId: string | null
  zoom: number
}>()

const emit = defineEmits<{
  (e: 'select', id: string | null): void
  (e: 'update-element', id: string, updates: Partial<TemplateElement>): void
  (e: 'delete-element', id: string): void
}>()

const editingId = ref<string | null>(null)
const textEditorRef = ref<HTMLElement | null>(null)

// Состояние для drag & drop
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragElementX = ref(0)
const dragElementY = ref(0)
const dragElement = ref<TemplateElement | null>(null)

// Состояние для resize
const isResizing = ref(false)
const resizeHandle = ref<string>('')
const resizeStartX = ref(0)
const resizeStartY = ref(0)
const resizeStartWidth = ref(0)
const resizeStartHeight = ref(0)
const resizeStartElX = ref(0)
const resizeStartElY = ref(0)
const resizeElement = ref<TemplateElement | null>(null)

// Сортировка элементов по zIndex
const sortedElements = computed(() => {
  return [...props.templateData.elements].sort((a, b) => a.zIndex - b.zIndex)
})

// Стиль фона
const backgroundStyle = computed(() => {
  const bg = props.templateData.background
  if (bg.type === 'color') {
    return bg.value
  } else if (bg.type === 'image') {
    return `url(${bg.value}) center/cover no-repeat`
  }
  return '#FFFFFF'
})

// Получение стиля элемента
function getElementStyle(element: TemplateElement) {
  return {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
  }
}

// Получение стиля текста
function getTextStyle(element: TextElement | VariableElement) {
  // Маппинг textAlign на justify-content для flex-контейнера
  const justifyMap: Record<string, string> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  }
  
  return {
    fontFamily: element.fontFamily,
    fontSize: `${element.fontSize}px`,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textAlign: element.textAlign,
    justifyContent: justifyMap[element.textAlign] || 'flex-start',
    color: element.color,
    lineHeight: element.lineHeight,
    backgroundColor: element.backgroundColor || 'transparent',
  }
}

// Получение метки переменной
function getVariableLabel(key: VariableSource): string {
  const variable = AVAILABLE_VARIABLES.find(v => v.key === key)
  if (!variable) return key
  
  const parts = key.split('.')
  const firstPart = parts[0]
  return firstPart ? firstPart.charAt(0).toUpperCase() : 'V'
}

// Обработка начала перетаскивания
function handleMouseDown(e: MouseEvent, element: TemplateElement) {
  if (element.locked) {
    emit('select', element.id)
    return
  }
  
  emit('select', element.id)
  
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  dragElementX.value = element.x
  dragElementY.value = element.y
  dragElement.value = element
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// Обработка перетаскивания
function handleMouseMove(e: MouseEvent) {
  if (isDragging.value && dragElement.value) {
    const deltaX = (e.clientX - dragStartX.value) / props.zoom
    const deltaY = (e.clientY - dragStartY.value) / props.zoom
    
    const newX = Math.max(0, Math.min(props.templateData.width - dragElement.value.width, dragElementX.value + deltaX))
    const newY = Math.max(0, Math.min(props.templateData.height - dragElement.value.height, dragElementY.value + deltaY))
    
    emit('update-element', dragElement.value.id, { x: newX, y: newY })
  }
  
  if (isResizing.value && resizeElement.value) {
    handleResize(e)
  }
}

// Завершение перетаскивания
function handleMouseUp() {
  isDragging.value = false
  dragElement.value = null
  isResizing.value = false
  resizeElement.value = null
  
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// Начало изменения размера
function handleResizeStart(e: MouseEvent, element: TemplateElement, handle: string) {
  isResizing.value = true
  resizeHandle.value = handle
  resizeStartX.value = e.clientX
  resizeStartY.value = e.clientY
  resizeStartWidth.value = element.width
  resizeStartHeight.value = element.height
  resizeStartElX.value = element.x
  resizeStartElY.value = element.y
  resizeElement.value = element
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// Логика изменения размера
function handleResize(e: MouseEvent) {
  if (!resizeElement.value) return
  
  const deltaX = (e.clientX - resizeStartX.value) / props.zoom
  const deltaY = (e.clientY - resizeStartY.value) / props.zoom
  
  let newWidth = resizeStartWidth.value
  let newHeight = resizeStartHeight.value
  let newX = resizeStartElX.value
  let newY = resizeStartElY.value
  
  const minSize = 20
  
  switch (resizeHandle.value) {
    case 'se':
      newWidth = Math.max(minSize, resizeStartWidth.value + deltaX)
      newHeight = Math.max(minSize, resizeStartHeight.value + deltaY)
      break
    case 'sw':
      newWidth = Math.max(minSize, resizeStartWidth.value - deltaX)
      newHeight = Math.max(minSize, resizeStartHeight.value + deltaY)
      newX = resizeStartElX.value + (resizeStartWidth.value - newWidth)
      break
    case 'ne':
      newWidth = Math.max(minSize, resizeStartWidth.value + deltaX)
      newHeight = Math.max(minSize, resizeStartHeight.value - deltaY)
      newY = resizeStartElY.value + (resizeStartHeight.value - newHeight)
      break
    case 'nw':
      newWidth = Math.max(minSize, resizeStartWidth.value - deltaX)
      newHeight = Math.max(minSize, resizeStartHeight.value - deltaY)
      newX = resizeStartElX.value + (resizeStartWidth.value - newWidth)
      newY = resizeStartElY.value + (resizeStartHeight.value - newHeight)
      break
    case 'n':
      newHeight = Math.max(minSize, resizeStartHeight.value - deltaY)
      newY = resizeStartElY.value + (resizeStartHeight.value - newHeight)
      break
    case 's':
      newHeight = Math.max(minSize, resizeStartHeight.value + deltaY)
      break
    case 'e':
      newWidth = Math.max(minSize, resizeStartWidth.value + deltaX)
      break
    case 'w':
      newWidth = Math.max(minSize, resizeStartWidth.value - deltaX)
      newX = resizeStartElX.value + (resizeStartWidth.value - newWidth)
      break
  }
  
  emit('update-element', resizeElement.value.id, {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  })
}

// Двойной клик для редактирования текста
function handleDoubleClick(element: TemplateElement) {
  if (element.type === 'text' && !element.locked) {
    editingId.value = element.id
    nextTick(() => {
      const editors = document.querySelectorAll('.text-content[contenteditable="true"]')
      const editor = editors[editors.length - 1] as HTMLElement
      if (editor) {
        editor.focus()
        // Выделяем весь текст
        const range = document.createRange()
        range.selectNodeContents(editor)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    })
  }
}

// Завершение редактирования текста
function handleTextBlur(e: FocusEvent, element: TemplateElement) {
  if (element.type === 'text') {
    const target = e.target as HTMLElement
    const newContent = target.textContent || ''
    emit('update-element', element.id, { content: newContent })
    editingId.value = null
  }
}

// Enter завершает редактирование
function handleTextEnter() {
  const editor = document.querySelector('.text-content[contenteditable="true"]') as HTMLElement
  if (editor) {
    editor.blur()
  }
}
</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.canvas-content {
  position: relative;
  background: white;
}

.canvas-element {
  position: absolute;
  cursor: move;
  user-select: none;
  border: 2px solid transparent;
  transition: border-color 0.15s;
}

.canvas-element:hover:not(.locked) {
  border-color: rgba(59, 130, 246, 0.3);
}

.canvas-element.selected {
  border-color: #3B82F6;
}

.canvas-element.locked {
  cursor: default;
  opacity: 0.8;
}

.canvas-element.locked.selected {
  border-color: #9CA3AF;
  border-style: dashed;
}

/* Текст */
.text-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;
}

.text-content[contenteditable="true"] {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2px;
}

/* Переменная */
.variable-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  border-radius: 4px;
  position: relative;
}

.variable-badge {
  position: absolute;
  top: -8px;
  left: 4px;
  background: #4F46E5;
  color: white;
  font-size: 8px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  text-transform: uppercase;
}

/* QR-код */
.qr-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #9CA3AF;
  border-radius: 4px;
}

.qr-label {
  font-size: 10px;
  font-weight: 600;
  color: #6B7280;
  margin-top: 4px;
}

/* Фигуры */
.shape-svg {
  display: block;
}

/* Ручки изменения размера */
.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid #3B82F6;
  border-radius: 2px;
  z-index: 10;
}

.resize-handle.nw { top: -5px; left: -5px; cursor: nwse-resize; }
.resize-handle.ne { top: -5px; right: -5px; cursor: nesw-resize; }
.resize-handle.sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
.resize-handle.se { bottom: -5px; right: -5px; cursor: nwse-resize; }
.resize-handle.n { top: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.resize-handle.s { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.resize-handle.e { right: -5px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
.resize-handle.w { left: -5px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }

/* Индикатор блокировки */
.lock-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #6B7280;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
