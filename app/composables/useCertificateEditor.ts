/**
 * Composable для визуального редактора сертификатов
 * Управляет состоянием холста, элементами и историей изменений
 */

import { ref, computed, shallowRef, watch } from 'vue'
import type { 
  CertificateTemplateData, 
  TemplateElement, 
  TextElement,
  VariableElement,
  ImageElement,
  QRElement,
  ShapeElement,
  TemplateLayout,
  TemplateBackground,
  VariableSource
} from '~/types/certificate'
import { LAYOUT_DIMENSIONS } from '~/types/certificate'

// Доступные переменные для вставки
export const AVAILABLE_VARIABLES: { key: VariableSource; label: string; placeholder: string }[] = [
  // Студент
  { key: 'student.fullName', label: 'ФИО студента', placeholder: 'Иванов Иван Иванович' },
  { key: 'student.shortName', label: 'ФИО сокращённо', placeholder: 'Иванов И.И.' },
  { key: 'student.lastName', label: 'Фамилия', placeholder: 'Иванов' },
  { key: 'student.firstName', label: 'Имя', placeholder: 'Иван' },
  { key: 'student.middleName', label: 'Отчество', placeholder: 'Иванович' },
  { key: 'student.organization', label: 'Организация', placeholder: 'ООО "Компания"' },
  { key: 'student.position', label: 'Должность', placeholder: 'Инженер' },
  { key: 'student.department', label: 'Отдел', placeholder: 'Отдел разработки' },
  { key: 'student.pinfl', label: 'ПИНФЛ', placeholder: '12345678901234' },
  // Курс
  { key: 'course.name', label: 'Название курса', placeholder: 'Охрана труда и техника безопасности' },
  { key: 'course.shortName', label: 'Краткое название курса', placeholder: 'ОТиТБ' },
  { key: 'course.code', label: 'Код курса', placeholder: 'OT-001' },
  { key: 'course.totalHours', label: 'Общее кол-во часов', placeholder: '72' },
  { key: 'course.description', label: 'Описание курса', placeholder: 'Курс по охране труда...' },
  // Группа
  { key: 'group.code', label: 'Код группы', placeholder: 'GR-2025-001' },
  { key: 'group.startDate', label: 'Дата начала обучения', placeholder: '01.12.2025' },
  { key: 'group.endDate', label: 'Дата окончания обучения', placeholder: '26.12.2025' },
  { key: 'group.classroom', label: 'Аудитория', placeholder: 'Ауд. 101' },
  // Сертификат
  { key: 'certificate.number', label: 'Номер сертификата', placeholder: 'CERT25-0001' },
  { key: 'certificate.issueDate', label: 'Дата выдачи', placeholder: '26.12.2025' },
  { key: 'certificate.issueDateFormatted', label: 'Дата выдачи (прописью)', placeholder: '26 декабря 2025 года' },
]

// Доступные шрифты (реэкспорт из useGoogleFonts)
import { ALL_FONTS } from './useGoogleFonts'
export const AVAILABLE_FONTS = ALL_FONTS

// Цвета по умолчанию для палитры
export const DEFAULT_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#1E3A5F', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED',
  '#0D9488', '#0891B2', '#4F46E5', '#C026D3', '#E11D48', '#EA580C',
]

/**
 * Генерация уникального ID
 */
function generateId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Создание пустого шаблона
 */
export function createEmptyTemplate(layout: TemplateLayout = 'A4_landscape'): CertificateTemplateData {
  const dimensions = LAYOUT_DIMENSIONS[layout]
  return {
    version: '1.0',
    layout,
    width: dimensions.width,
    height: dimensions.height,
    background: {
      type: 'color',
      value: '#FFFFFF',
    },
    elements: [],
  }
}

/**
 * Создание текстового элемента
 */
export function createTextElement(options: Partial<TextElement> = {}): TextElement {
  return {
    id: generateId(),
    type: 'text',
    x: options.x ?? 100,
    y: options.y ?? 100,
    width: options.width ?? 300,
    height: options.height ?? 50,
    rotation: options.rotation ?? 0,
    zIndex: options.zIndex ?? 1,
    locked: options.locked ?? false,
    content: options.content ?? 'Новый текст',
    fontFamily: options.fontFamily ?? 'Inter',
    fontSize: options.fontSize ?? 24,
    fontWeight: options.fontWeight ?? 'normal',
    fontStyle: options.fontStyle ?? 'normal',
    textAlign: options.textAlign ?? 'center',
    color: options.color ?? '#000000',
    lineHeight: options.lineHeight ?? 1.2,
    backgroundColor: options.backgroundColor ?? 'transparent',
  }
}

/**
 * Создание элемента переменной
 */
export function createVariableElement(
  variableKey: VariableSource,
  options: Partial<VariableElement> = {}
): VariableElement {
  const variable = AVAILABLE_VARIABLES.find(v => v.key === variableKey)
  return {
    id: generateId(),
    type: 'variable',
    x: options.x ?? 100,
    y: options.y ?? 100,
    width: options.width ?? 350,
    height: options.height ?? 40,
    rotation: options.rotation ?? 0,
    zIndex: options.zIndex ?? 1,
    locked: options.locked ?? false,
    variableKey,
    placeholder: variable?.placeholder ?? '[Переменная]',
    fontFamily: options.fontFamily ?? 'Inter',
    fontSize: options.fontSize ?? 20,
    fontWeight: options.fontWeight ?? 'bold',
    fontStyle: options.fontStyle ?? 'normal',
    textAlign: options.textAlign ?? 'center',
    color: options.color ?? '#1E3A5F',
    lineHeight: options.lineHeight ?? 1.2,
    backgroundColor: options.backgroundColor ?? 'transparent',
  }
}

/**
 * Создание элемента изображения
 */
export function createImageElement(src: string, options: Partial<ImageElement> = {}): ImageElement {
  return {
    id: generateId(),
    type: 'image',
    x: options.x ?? 50,
    y: options.y ?? 50,
    width: options.width ?? 150,
    height: options.height ?? 150,
    rotation: options.rotation ?? 0,
    zIndex: options.zIndex ?? 0,
    locked: options.locked ?? false,
    src,
    objectFit: options.objectFit ?? 'contain',
    opacity: options.opacity ?? 1,
  }
}

/**
 * Создание элемента QR-кода
 */
export function createQRElement(options: Partial<QRElement> = {}): QRElement {
  return {
    id: generateId(),
    type: 'qr',
    x: options.x ?? 50,
    y: options.y ?? 50,
    width: options.width ?? 100,
    height: options.height ?? 100,
    rotation: options.rotation ?? 0,
    zIndex: options.zIndex ?? 1,
    locked: options.locked ?? false,
    dataSource: options.dataSource ?? 'certificate_url',
    customData: options.customData,
    size: options.size ?? 100,
    color: options.color ?? '#000000',
    backgroundColor: options.backgroundColor ?? '#FFFFFF',
  }
}

/**
 * Создание элемента фигуры
 */
export function createShapeElement(
  shapeType: 'rectangle' | 'circle' | 'line',
  options: Partial<ShapeElement> = {}
): ShapeElement {
  return {
    id: generateId(),
    type: 'shape',
    x: options.x ?? 100,
    y: options.y ?? 100,
    width: options.width ?? 200,
    height: options.height ?? 100,
    rotation: options.rotation ?? 0,
    zIndex: options.zIndex ?? 0,
    locked: options.locked ?? false,
    shapeType,
    fillColor: options.fillColor ?? 'transparent',
    strokeColor: options.strokeColor ?? '#000000',
    strokeWidth: options.strokeWidth ?? 2,
  }
}

/**
 * Основной composable редактора
 */
export function useCertificateEditor() {
  // Данные шаблона
  const templateData = ref<CertificateTemplateData>(createEmptyTemplate())
  
  // Выбранный элемент
  const selectedElementId = ref<string | null>(null)
  
  // История изменений для Undo/Redo
  const history = ref<CertificateTemplateData[]>([])
  const historyIndex = ref<number>(-1)
  const maxHistoryLength = 50
  
  // Флаги состояния
  const isDirty = ref(false)
  const isLoading = ref(false)
  const isSaving = ref(false)
  
  // Масштаб холста
  const zoom = ref(1)
  const minZoom = 0.25
  const maxZoom = 2
  
  // Вычисляемые свойства
  const selectedElement = computed(() => {
    if (!selectedElementId.value) return null
    return templateData.value.elements.find((el: TemplateElement) => el.id === selectedElementId.value) ?? null
  })
  
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
  
  const elementsCount = computed(() => templateData.value.elements.length)
  
  // Сохранение состояния в историю
  function saveToHistory() {
    // Удаляем все состояния после текущего (при новом действии после undo)
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    
    // Добавляем текущее состояние
    history.value.push(JSON.parse(JSON.stringify(templateData.value)))
    
    // Ограничиваем длину истории
    if (history.value.length > maxHistoryLength) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
    
    isDirty.value = true
  }
  
  // Отмена действия
  function undo() {
    if (!canUndo.value) return
    historyIndex.value--
    templateData.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    isDirty.value = true
  }
  
  // Повтор действия
  function redo() {
    if (!canRedo.value) return
    historyIndex.value++
    templateData.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    isDirty.value = true
  }
  
  // Инициализация шаблона
  function initTemplate(data?: CertificateTemplateData) {
    if (data) {
      templateData.value = JSON.parse(JSON.stringify(data))
    } else {
      templateData.value = createEmptyTemplate()
    }
    
    // Сбрасываем историю
    history.value = [JSON.parse(JSON.stringify(templateData.value))]
    historyIndex.value = 0
    selectedElementId.value = null
    isDirty.value = false
  }
  
  // Изменение макета
  function setLayout(layout: TemplateLayout) {
    saveToHistory()
    const dimensions = LAYOUT_DIMENSIONS[layout]
    templateData.value.layout = layout
    templateData.value.width = dimensions.width
    templateData.value.height = dimensions.height
  }
  
  // Изменение фона
  function setBackground(background: TemplateBackground) {
    saveToHistory()
    templateData.value.background = background
  }
  
  // Добавление элемента
  function addElement(element: TemplateElement) {
    saveToHistory()
    // Устанавливаем zIndex выше всех текущих
    const maxZIndex = Math.max(0, ...templateData.value.elements.map((el: TemplateElement) => el.zIndex))
    element.zIndex = maxZIndex + 1
    templateData.value.elements.push(element)
    selectedElementId.value = element.id
  }
  
  // Обновление элемента
  function updateElement(id: string, updates: Partial<TemplateElement>) {
    const index = templateData.value.elements.findIndex((el: TemplateElement) => el.id === id)
    if (index === -1) return
    
    saveToHistory()
    templateData.value.elements[index] = {
      ...templateData.value.elements[index],
      ...updates,
    } as TemplateElement
  }
  
  // Удаление элемента
  function deleteElement(id: string) {
    saveToHistory()
    templateData.value.elements = templateData.value.elements.filter((el: TemplateElement) => el.id !== id)
    if (selectedElementId.value === id) {
      selectedElementId.value = null
    }
  }
  
  // Удаление выбранного элемента
  function deleteSelectedElement() {
    if (selectedElementId.value) {
      deleteElement(selectedElementId.value)
    }
  }
  
  // Дублирование элемента
  function duplicateElement(id: string) {
    const element = templateData.value.elements.find((el: TemplateElement) => el.id === id)
    if (!element) return
    
    const newElement = {
      ...JSON.parse(JSON.stringify(element)),
      id: generateId(),
      x: element.x + 20,
      y: element.y + 20,
    }
    
    addElement(newElement)
  }
  
  // Перемещение элемента на передний план
  function bringToFront(id: string) {
    const maxZIndex = Math.max(...templateData.value.elements.map((el: TemplateElement) => el.zIndex))
    updateElement(id, { zIndex: maxZIndex + 1 })
  }
  
  // Перемещение элемента на задний план
  function sendToBack(id: string) {
    const minZIndex = Math.min(...templateData.value.elements.map((el: TemplateElement) => el.zIndex))
    updateElement(id, { zIndex: minZIndex - 1 })
  }
  
  // Блокировка/разблокировка элемента
  function toggleLock(id: string) {
    const element = templateData.value.elements.find((el: TemplateElement) => el.id === id)
    if (element) {
      updateElement(id, { locked: !element.locked })
    }
  }
  
  // Выбор элемента
  function selectElement(id: string | null) {
    selectedElementId.value = id
  }
  
  // Изменение масштаба
  function setZoom(value: number) {
    zoom.value = Math.min(maxZoom, Math.max(minZoom, value))
  }
  
  function zoomIn() {
    setZoom(zoom.value + 0.1)
  }
  
  function zoomOut() {
    setZoom(zoom.value - 0.1)
  }
  
  function resetZoom() {
    zoom.value = 1
  }
  
  // Экспорт данных для сохранения
  function exportData(): CertificateTemplateData {
    return JSON.parse(JSON.stringify(templateData.value))
  }
  
  return {
    // Состояние
    templateData,
    selectedElementId,
    selectedElement,
    zoom,
    isDirty,
    isLoading,
    isSaving,
    
    // Вычисляемые
    canUndo,
    canRedo,
    elementsCount,
    
    // Методы инициализации
    initTemplate,
    exportData,
    
    // Методы истории
    undo,
    redo,
    saveToHistory,
    
    // Методы макета и фона
    setLayout,
    setBackground,
    
    // Методы элементов
    addElement,
    updateElement,
    deleteElement,
    deleteSelectedElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    toggleLock,
    selectElement,
    
    // Методы масштаба
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    
    // Константы
    minZoom,
    maxZoom,
  }
}
