/**
 * Composable для управления темой (dark/light mode)
 * Сохраняет выбор в localStorage
 */
export const useTheme = () => {
  const isDarkMode = useState('dark-mode', () => false)

  // Применяем тему только на клиенте
  const applyTheme = () => {
    if (import.meta.client) {
      if (isDarkMode.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  // Инициализация только на клиенте через onMounted
  onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    isDarkMode.value = savedTheme === 'dark'
    applyTheme()
    
    // Watch для реактивного обновления темы
    watch(isDarkMode, () => {
      applyTheme()
      localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
    })
  })

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
  }

  return {
    isDarkMode,
    toggleTheme
  }
}
