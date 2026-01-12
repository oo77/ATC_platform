/**
 * Composable для управления состоянием sidebar
 * Использует useState для глобального состояния в Nuxt
 */
export const useSidebar = () => {
  // Глобальное состояние через useState
  const isExpanded = useState('sidebar-expanded', () => true)
  const isMobileOpen = useState('sidebar-mobile-open', () => false)
  const isHovered = useState('sidebar-hovered', () => false)
  const openSubmenu = useState<string | null>('sidebar-submenu', () => null)
  const isMobile = useState('sidebar-is-mobile', () => false)

  // Обработка resize только на клиенте
  const handleResize = () => {
    const mobile = window.innerWidth < 768
    isMobile.value = mobile
    if (!mobile) {
      isMobileOpen.value = false
    }
  }

  // Инициализация только на клиенте через onMounted
  onMounted(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
  })
  
  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('resize', handleResize)
    }
  })

  const toggleSidebar = () => {
    if (isMobile.value) {
      isMobileOpen.value = !isMobileOpen.value
    } else {
      isExpanded.value = !isExpanded.value
    }
  }

  const toggleMobileSidebar = () => {
    isMobileOpen.value = !isMobileOpen.value
  }

  const setIsHovered = (value: boolean) => {
    isHovered.value = value
  }

  const toggleSubmenu = (item: string) => {
    openSubmenu.value = openSubmenu.value === item ? null : item
  }

  return {
    isExpanded: computed(() => (isMobile.value ? false : isExpanded.value)),
    isMobileOpen,
    isHovered,
    openSubmenu,
    isMobile,
    toggleSidebar,
    toggleMobileSidebar,
    setIsHovered,
    toggleSubmenu
  }
}
