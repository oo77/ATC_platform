/**
 * Composable для работы с Google Fonts
 * 
 * Загружает шрифты динамически с Google Fonts API
 */

import { ref, onMounted } from 'vue'

// Популярные шрифты для сертификатов
export const GOOGLE_FONTS: { name: string; weights: number[] }[] = [
  { name: 'Inter', weights: [400, 500, 600, 700] },
  { name: 'Roboto', weights: [400, 500, 700] },
  { name: 'Open Sans', weights: [400, 600, 700] },
  { name: 'Montserrat', weights: [400, 500, 600, 700] },
  { name: 'Lato', weights: [400, 700] },
  { name: 'Poppins', weights: [400, 500, 600, 700] },
  { name: 'Playfair Display', weights: [400, 500, 600, 700] },
  { name: 'Lora', weights: [400, 500, 600, 700] },
  { name: 'Merriweather', weights: [400, 700] },
  { name: 'PT Sans', weights: [400, 700] },
  { name: 'PT Serif', weights: [400, 700] },
  { name: 'Noto Sans', weights: [400, 500, 600, 700] },
  { name: 'Raleway', weights: [400, 500, 600, 700] },
  { name: 'Nunito', weights: [400, 600, 700] },
  { name: 'Oswald', weights: [400, 500, 600, 700] },
  { name: 'Source Sans Pro', weights: [400, 600, 700] },
  { name: 'Ubuntu', weights: [400, 500, 700] },
  { name: 'Rubik', weights: [400, 500, 600, 700] },
  { name: 'Work Sans', weights: [400, 500, 600, 700] },
  { name: 'Fira Sans', weights: [400, 500, 600, 700] },
]

// Системные шрифты (всегда доступны)
export const SYSTEM_FONTS: string[] = [
  'Arial',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Helvetica',
  'Courier New',
]

// Все доступные шрифты
export const ALL_FONTS = [
  ...GOOGLE_FONTS.map(f => f.name),
  ...SYSTEM_FONTS,
]

// Кэш загруженных шрифтов
const loadedFonts = new Set<string>()

/**
 * Загрузить шрифт Google Fonts
 */
export function loadGoogleFont(fontName: string): void {
  // Проверяем, не загружен ли уже
  if (loadedFonts.has(fontName)) return
  
  // Проверяем, есть ли в списке Google Fonts
  const fontConfig = GOOGLE_FONTS.find(f => f.name === fontName)
  if (!fontConfig) {
    // Это системный шрифт, загрузка не нужна
    return
  }
  
  // Формируем URL для Google Fonts API
  const fontFamily = fontName.replace(/ /g, '+')
  const weights = fontConfig.weights.join(';')
  const linkUrl = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${weights}&display=swap`
  
  // Проверяем, не добавлен ли уже link
  const existingLink = document.querySelector(`link[href*="${fontFamily}"]`)
  if (existingLink) {
    loadedFonts.add(fontName)
    return
  }
  
  // Создаём link элемент
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = linkUrl
  link.setAttribute('data-font', fontName)
  
  document.head.appendChild(link)
  loadedFonts.add(fontName)
  
  console.log(`[GoogleFonts] Загружен шрифт: ${fontName}`)
}

/**
 * Загрузить несколько шрифтов
 */
export function loadGoogleFonts(fontNames: string[]): void {
  fontNames.forEach(font => loadGoogleFont(font))
}

/**
 * Предзагрузить все популярные шрифты
 */
export function preloadAllFonts(): void {
  // Загружаем чанками для оптимизации
  const fonts = GOOGLE_FONTS.map(f => f.name)
  
  // Формируем комбинированный URL
  const families = fonts.map(name => {
    const config = GOOGLE_FONTS.find(f => f.name === name)
    const fontFamily = name.replace(/ /g, '+')
    const weights = config?.weights.join(';') || '400;700'
    return `family=${fontFamily}:wght@${weights}`
  }).join('&')
  
  const linkUrl = `https://fonts.googleapis.com/css2?${families}&display=swap`
  
  // Проверяем, не добавлен ли уже
  if (document.querySelector(`link[data-fonts="all"]`)) return
  
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = linkUrl
  link.setAttribute('data-fonts', 'all')
  
  document.head.appendChild(link)
  
  fonts.forEach(font => loadedFonts.add(font))
  console.log(`[GoogleFonts] Предзагружены все шрифты (${fonts.length})`)
}

/**
 * Composable для работы со шрифтами в компоненте
 */
export function useGoogleFonts() {
  const fontsLoaded = ref(false)
  
  onMounted(() => {
    // Предзагружаем все шрифты при монтировании редактора
    preloadAllFonts()
    fontsLoaded.value = true
  })
  
  return {
    allFonts: ALL_FONTS,
    googleFonts: GOOGLE_FONTS,
    systemFonts: SYSTEM_FONTS,
    fontsLoaded,
    loadFont: loadGoogleFont,
    loadFonts: loadGoogleFonts,
  }
}
