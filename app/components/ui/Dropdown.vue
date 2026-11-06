<template>
  <!--
    UiDropdown — единое меню действий («Документы ▾», «Действия ▾», «⋯» в строке таблицы).
    Заменяет самописные выпадашки без «клик-вне» и пункты-кнопки, выстроенные в ряд.
    Меню телепортируется в body и позиционируется по координатам триггера,
    поэтому не обрезается контейнерами с overflow (таблицы, карточки).
  -->
  <div ref="rootRef" class="inline-flex">
    <!-- Триггер: можно передать свой через слот #trigger, иначе рисуем UiButton -->
    <slot name="trigger" :open="open" :toggle="toggle">
      <UiButton
        :variant="variant"
        :size="size"
        :icon="iconOnly"
        :end-icon="iconOnly ? undefined : ChevronDown"
        :start-icon="triggerIcon"
        :aria-label="iconOnly ? ariaLabel || label : undefined"
        :title="iconOnly ? ariaLabel || label : undefined"
        aria-haspopup="menu"
        :aria-expanded="open"
        @click="toggle"
      >
        <template v-if="iconOnly">
          <MoreHorizontal class="h-4 w-4" />
        </template>
        <template v-else>{{ label }}</template>
      </UiButton>
    </slot>

    <Teleport to="body">
      <Transition name="ui-dd">
        <div
          v-if="open"
          ref="menuRef"
          role="menu"
          :style="menuStyle"
          class="fixed z-[99999] min-w-[220px] max-w-[320px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
          @keydown="onMenuKeydown"
        >
          <!-- Группы пунктов; между группами — разделитель, у группы — подпись -->
          <template v-for="(group, gi) in visibleGroups" :key="gi">
            <div v-if="gi > 0" class="my-1.5 h-px bg-gray-100 dark:bg-gray-800" role="separator"></div>
            <p
              v-if="group.label"
              class="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold tracking-wide text-gray-400 dark:text-gray-500"
            >
              {{ group.label }}
            </p>

            <template v-for="item in group.items" :key="item.key">
              <!-- Пункт-ссылка (навигация) -->
              <NuxtLink
                v-if="item.to && !item.disabled"
                :to="item.to"
                role="menuitem"
                :class="itemClass(item)"
                @click="close"
              >
                <ItemBody :item="item" />
              </NuxtLink>

              <!-- Пункт-действие. Во время загрузки блокируем, но меню не закрываем -->
              <button
                v-else
                type="button"
                role="menuitem"
                :disabled="item.disabled || item.loading"
                :class="itemClass(item)"
                @click="select(item)"
              >
                <ItemBody :item="item" />
              </button>
            </template>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onBeforeUnmount, ref, watch, type Component, type PropType } from 'vue'
import { ChevronDown, Loader2, MoreHorizontal } from 'lucide-vue-next'

export interface DropdownItem {
  /** Уникальный ключ — возвращается в событии select */
  key: string
  label: string
  /** Серая подпись под названием (например, «для начала обучения») */
  description?: string
  icon?: Component
  /** Красный пункт — для опасных действий */
  danger?: boolean
  disabled?: boolean
  /** Показывает спиннер вместо иконки (идёт генерация документа) */
  loading?: boolean
  /** Скрыть пункт (удобно для проверок прав: hidden: !canEdit) */
  hidden?: boolean
  to?: string
}
export interface DropdownGroup {
  label?: string
  items: DropdownItem[]
}

const props = withDefaults(
  defineProps<{
    groups: DropdownGroup[]
    label?: string
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft'
    size?: 'xs' | 'sm' | 'md' | 'lg'
    /** Только кнопка «⋯» (для строк таблицы) */
    iconOnly?: boolean
    ariaLabel?: string
    triggerIcon?: object
    align?: 'start' | 'end'
  }>(),
  { label: 'Действия', variant: 'outline', size: 'md', iconOnly: false, align: 'end' },
)

const emit = defineEmits<{ select: [key: string] }>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

// Прячем скрытые пункты и пустые группы: если нечего показывать — меню не рисуется вовсе
const visibleGroups = computed(() =>
  props.groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.hidden) }))
    .filter((g) => g.items.length > 0),
)

// Внутренний компонент тела пункта: иконка/спиннер + название + описание
const ItemBody = defineComponent({
  props: { item: { type: Object as PropType<DropdownItem>, required: true } },
  setup(p) {
    return () =>
      h('span', { class: 'flex w-full items-start gap-2.5' }, [
        p.item.loading
          ? h(Loader2, { class: 'mt-0.5 h-4 w-4 shrink-0 animate-spin' })
          : p.item.icon
            ? h(p.item.icon, { class: 'mt-0.5 h-4 w-4 shrink-0 opacity-70' })
            : null,
        h('span', { class: 'min-w-0 flex-1 text-left' }, [
          h('span', { class: 'block truncate text-sm font-medium' }, p.item.label),
          p.item.description
            ? h('span', { class: 'block truncate text-xs font-normal text-gray-400 dark:text-gray-500' }, p.item.description)
            : null,
        ]),
      ])
  },
})

const itemClass = (item: DropdownItem) => [
  'flex w-full items-center rounded-lg px-2.5 py-2 text-left transition-colors outline-none',
  'focus-visible:bg-gray-100 dark:focus-visible:bg-white/10',
  item.danger
    ? 'text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10'
    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/[0.06]',
  item.disabled || item.loading ? 'cursor-not-allowed opacity-50' : '',
]

/** Позиционируем меню под триггером, разворачивая вверх, если снизу не хватает места */
const place = () => {
  const trg = rootRef.value?.getBoundingClientRect()
  const menu = menuRef.value
  if (!trg || !menu) return
  const gap = 6
  const mh = menu.offsetHeight
  const mw = menu.offsetWidth
  const below = window.innerHeight - trg.bottom - gap
  const openUp = below < mh && trg.top > below
  const top = openUp ? Math.max(8, trg.top - mh - gap) : trg.bottom + gap
  let left = props.align === 'end' ? trg.right - mw : trg.left
  left = Math.min(Math.max(8, left), window.innerWidth - mw - 8)
  menuStyle.value = { top: `${top}px`, left: `${left}px`, maxHeight: `${window.innerHeight - 16}px` }
}

const onOutside = (e: MouseEvent) => {
  const t = e.target as Node
  if (!rootRef.value?.contains(t) && !menuRef.value?.contains(t)) close()
}
const onEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    close()
    // Возвращаем фокус на триггер — клавиатурный пользователь не «теряется»
    ;(rootRef.value?.querySelector('button') as HTMLElement | null)?.focus()
  }
}

const toggle = () => (open.value ? close() : openMenu())
const openMenu = async () => {
  open.value = true
  await nextTick()
  place()
  // Фокус на первый доступный пункт для работы с клавиатуры
  ;(menuRef.value?.querySelector('[role="menuitem"]:not(:disabled)') as HTMLElement | null)?.focus()
}
const close = () => {
  open.value = false
}

/** Навигация стрелками ↑/↓ по пунктам */
const onMenuKeydown = (e: KeyboardEvent) => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  const items = Array.from(menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [])
  const idx = items.indexOf(document.activeElement as HTMLElement)
  const next = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length
  items[next]?.focus()
}

const select = (item: DropdownItem) => {
  if (item.disabled || item.loading) return
  emit('select', item.key)
  close()
}

// Слушатели вешаем только пока меню открыто — не нагружаем страницу лишними обработчиками
watch(open, (v) => {
  const fn = v ? document.addEventListener : document.removeEventListener
  fn.call(document, 'mousedown', onOutside as any)
  fn.call(document, 'keydown', onEsc as any)
  fn.call(window, 'resize', close as any)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onOutside as any)
  document.removeEventListener('keydown', onEsc as any)
  window.removeEventListener('resize', close as any)
})

// Хотим, чтобы родитель мог открыть/закрыть меню программно
defineExpose({ open: openMenu, close })
</script>

<style>
/* Мягкое появление меню (глобально, т.к. меню телепортировано в body) */
.ui-dd-enter-active,
.ui-dd-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.ui-dd-enter-from,
.ui-dd-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
