<template>
  <div class="editor-sidebar">
    <!-- Когда ничего не выбрано -->
    <template v-if="selectedElements.length === 0">
      <div class="empty-state">
        <div class="empty-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"
            />
          </svg>
        </div>
        <p class="empty-title">Выберите элемент</p>
        <p class="empty-text">
          Кликните на элемент на холсте, чтобы редактировать его свойства
        </p>
      </div>
    </template>

    <!-- Когда выбрано несколько элементов -->
    <template v-else-if="selectedElements.length > 1">
      <div class="sidebar-header">
        <span class="element-type-badge multi">
          Выбрано: {{ selectedElements.length }}
        </span>
        <div class="header-actions">
          <button
            class="action-btn"
            :class="{ active: allLocked }"
            @click="toggleLockAll"
            :title="allLocked ? 'Разблокировать все' : 'Заблокировать все'"
          >
            <svg v-if="allLocked" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
          </button>
          <button
            class="action-btn delete"
            @click="$emit('delete-multiple')"
            title="Удалить все"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Группировка -->
      <div class="sidebar-section group-section">
        <p v-if="groupState?.isOneWholeGroup" class="group-status">
          <span class="group-dot"></span>
          Группа из {{ selectedElements.length }} элементов
        </p>
        <div class="group-buttons">
          <button
            class="group-btn"
            :disabled="!groupState?.canGroup"
            @click="$emit('group')"
            title="Сгруппировать (Ctrl+G)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3" />
              <rect x="7" y="7" width="5" height="5" rx="1" />
              <rect x="12" y="12" width="5" height="5" rx="1" />
            </svg>
            Сгруппировать
            <kbd>Ctrl+G</kbd>
          </button>
          <button
            class="group-btn"
            :disabled="!groupState?.canUngroup"
            @click="$emit('ungroup')"
            title="Разгруппировать (Ctrl+Shift+G)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="8" height="8" rx="1" />
              <rect x="13" y="13" width="8" height="8" rx="1" />
            </svg>
            Разгруппировать
            <kbd>Ctrl+Shift+G</kbd>
          </button>
        </div>
        <p v-if="groupState?.canUngroup" class="mixed-note">
          Alt+клик — выбрать один элемент внутри группы
        </p>
      </div>

      <!-- Состав выделения по типам: клик оставляет в выделении только этот тип -->
      <div class="sidebar-section type-section">
        <div class="type-chips">
          <button
            v-for="group in typeGroups"
            :key="group.type"
            class="type-chip"
            :class="[group.type, { only: typeGroups.length === 1 }]"
            @click="selectOnlyType(group.type)"
            :disabled="typeGroups.length === 1"
            :title="
              typeGroups.length === 1
                ? 'Все выбранные элементы одного типа'
                : `Оставить в выделении только: ${getElementTypeLabel(group.type)}`
            "
          >
            {{ getElementTypeLabel(group.type) }}
            <span class="chip-count">{{ group.ids.length }}</span>
          </button>
        </div>
        <button
          v-if="commonType"
          class="select-same-btn"
          @click="$emit('select-same-type', commonType)"
          :title="`Выделить все элементы типа «${getElementTypeLabel(commonType)}» на странице`"
        >
          Выделить все «{{ getElementTypeLabel(commonType) }}» на странице
        </button>
        <p v-if="lockedCount > 0" class="mixed-note">
          Заблокировано {{ lockedCount }} — изменения их не затронут
        </p>
        <p v-if="!commonType && !isTextLikeSelection" class="mixed-note">
          Разные типы — доступны только общие свойства. Нажмите на тип выше,
          чтобы редактировать его свойства.
        </p>
      </div>

      <!-- Общие: размер и поворот -->
      <div class="sidebar-section">
        <h4 class="section-title">Размер</h4>
        <div class="input-grid">
          <div class="input-group">
            <label>Ширина</label>
            <input
              type="number"
              :value="roundOrEmpty(common('width'))"
              :placeholder="MIXED_LABEL"
              @change="setAllNumber('width', $event)"
              :disabled="!hasEditable"
              min="20"
            />
          </div>
          <div class="input-group">
            <label>Высота</label>
            <input
              type="number"
              :value="roundOrEmpty(common('height'))"
              :placeholder="MIXED_LABEL"
              @change="setAllNumber('height', $event)"
              :disabled="!hasEditable"
              min="20"
            />
          </div>
        </div>
        <div class="input-group full">
          <label>Поворот (°)</label>
          <input
            type="number"
            :value="common('rotation') ?? ''"
            :placeholder="MIXED_LABEL"
            @change="setAllNumber('rotation', $event)"
            :disabled="!hasEditable"
            min="0"
            max="360"
          />
        </div>
      </div>

      <!-- Текст и переменные: общие текстовые свойства -->
      <div v-if="isTextLikeSelection" class="sidebar-section">
        <h4 class="section-title">
          Текст
          <span class="section-count">· {{ selectedElements.length }}</span>
        </h4>

        <div class="input-group full">
          <label>Шрифт</label>
          <select
            :value="common('fontFamily') ?? ''"
            @change="setAll('fontFamily', ($event.target as HTMLSelectElement).value)"
            :disabled="!hasEditable"
          >
            <option v-if="common('fontFamily') === null" value="" disabled>
              {{ MIXED_LABEL }}
            </option>
            <option v-for="font in AVAILABLE_FONTS" :key="font" :value="font">
              {{ font }}
            </option>
          </select>
        </div>

        <div class="input-grid">
          <div class="input-group">
            <label>Размер</label>
            <div class="size-stepper">
              <button
                class="style-btn"
                @click="stepAll('fontSize', -1, 8, 200)"
                :disabled="!hasEditable"
                title="Уменьшить у всех на 1 (разница сохраняется)"
              >A−</button>
              <input
                type="number"
                :value="common('fontSize') ?? ''"
                :placeholder="MIXED_LABEL"
                @change="setAllNumber('fontSize', $event)"
                :disabled="!hasEditable"
                min="8"
                max="200"
              />
              <button
                class="style-btn"
                @click="stepAll('fontSize', 1, 8, 200)"
                :disabled="!hasEditable"
                title="Увеличить у всех на 1 (разница сохраняется)"
              >A+</button>
            </div>
          </div>
          <div class="input-group">
            <label>Межстрочный</label>
            <input
              type="number"
              :value="common('lineHeight') ?? ''"
              :placeholder="MIXED_LABEL"
              @change="setAllNumber('lineHeight', $event)"
              :disabled="!hasEditable"
              min="0.5"
              max="3"
              step="0.1"
            />
          </div>
        </div>

        <div class="button-group">
          <button
            class="style-btn"
            :class="{ active: common('fontWeight') === 'bold', mixed: common('fontWeight') === null }"
            @click="toggleAll('fontWeight', 'bold', 'normal')"
            :disabled="!hasEditable"
            title="Жирный"
          >
            <strong>B</strong>
          </button>
          <button
            class="style-btn"
            :class="{ active: common('fontStyle') === 'italic', mixed: common('fontStyle') === null }"
            @click="toggleAll('fontStyle', 'italic', 'normal')"
            :disabled="!hasEditable"
            title="Курсив"
          >
            <em>I</em>
          </button>
          <div class="separator"></div>
          <button
            v-for="opt in TEXT_ALIGN_OPTIONS"
            :key="opt.value"
            class="style-btn"
            :class="{ active: common('textAlign') === opt.value }"
            @click="setAll('textAlign', opt.value)"
            :disabled="!hasEditable"
            :title="opt.title"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line v-for="(l, i) in opt.lines" :key="i" :x1="l[0]" :y1="6 + i * 6" :x2="l[1]" :y2="6 + i * 6" />
            </svg>
          </button>
        </div>

        <!-- Списки — только если выбраны одни тексты -->
        <div v-if="commonType === 'text'" class="list-row">
          <div class="button-group list-buttons">
            <button
              class="style-btn"
              :class="{ active: common('listStyle') === 'bullet' }"
              @click="toggleAll('listStyle', 'bullet', 'none')"
              :disabled="!hasEditable"
              title="Маркированный список"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="9" y1="6" x2="21" y2="6" />
                <line x1="9" y1="12" x2="21" y2="12" />
                <line x1="9" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1.2" fill="currentColor" />
                <circle cx="4" cy="12" r="1.2" fill="currentColor" />
                <circle cx="4" cy="18" r="1.2" fill="currentColor" />
              </svg>
            </button>
            <button
              class="style-btn"
              :class="{ active: common('listStyle') === 'number' }"
              @click="toggleAll('listStyle', 'number', 'none')"
              :disabled="!hasEditable"
              title="Нумерованный список"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="10" y1="12" x2="21" y2="12" />
                <line x1="10" y1="18" x2="21" y2="18" />
                <path d="M4 6h1v4" />
                <path d="M4 10h2" />
                <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
              </svg>
            </button>
          </div>
          <span class="list-hint">Списки для всех выбранных</span>
        </div>

        <div class="input-group full">
          <label>Цвет</label>
          <div class="color-picker">
            <input
              type="color"
              :value="common('color') ?? '#000000'"
              @input="setAll('color', ($event.target as HTMLInputElement).value)"
              :disabled="!hasEditable"
            />
            <input
              type="text"
              :value="common('color') ?? ''"
              :placeholder="MIXED_LABEL"
              @change="setAll('color', ($event.target as HTMLInputElement).value)"
              :disabled="!hasEditable"
              class="color-text"
            />
          </div>
        </div>

        <div class="input-group full">
          <label>Заливка фона</label>
          <div class="color-picker">
            <input
              type="color"
              :value="commonFill ?? '#ffffff'"
              @input="setAll('backgroundColor', ($event.target as HTMLInputElement).value)"
              :disabled="!hasEditable || commonFill === 'transparent'"
            />
            <input
              type="text"
              :value="commonFill === 'transparent' ? '' : commonFill ?? ''"
              :placeholder="commonFill === 'transparent' ? 'нет' : MIXED_LABEL"
              @change="setAll('backgroundColor', ($event.target as HTMLInputElement).value)"
              :disabled="!hasEditable || commonFill === 'transparent'"
              class="color-text"
            />
          </div>
          <div class="checkbox-group mt-1">
            <label>
              <input
                type="checkbox"
                :checked="commonFill === 'transparent'"
                :indeterminate.prop="commonFill === null"
                @change="setAll('backgroundColor', ($event.target as HTMLInputElement).checked ? 'transparent' : '#ffffff')"
                :disabled="!hasEditable"
              />
              Без заливки
            </label>
          </div>
        </div>
      </div>

      <!-- Изображения -->
      <div v-if="commonType === 'image'" class="sidebar-section">
        <h4 class="section-title">
          Изображение
          <span class="section-count">· {{ selectedElements.length }}</span>
        </h4>
        <div class="input-group full">
          <label>Подгонка</label>
          <select
            :value="common('objectFit') ?? ''"
            @change="setAll('objectFit', ($event.target as HTMLSelectElement).value)"
            :disabled="!hasEditable"
          >
            <option v-if="common('objectFit') === null" value="" disabled>{{ MIXED_LABEL }}</option>
            <option value="contain">Вместить</option>
            <option value="cover">Заполнить</option>
            <option value="fill">Растянуть</option>
          </select>
        </div>
        <div class="input-group full">
          <label>Прозрачность</label>
          <input
            type="range"
            :value="common('opacity') ?? 1"
            @change="setAllNumber('opacity', $event)"
            :disabled="!hasEditable"
            min="0"
            max="1"
            step="0.05"
          />
          <span class="range-value">{{
            common('opacity') === null ? MIXED_LABEL : `${Math.round((common('opacity') ?? 1) * 100)}%`
          }}</span>
        </div>
      </div>

      <!-- QR-коды -->
      <div v-if="commonType === 'qr'" class="sidebar-section">
        <h4 class="section-title">
          QR-код
          <span class="section-count">· {{ selectedElements.length }}</span>
        </h4>
        <div class="input-grid">
          <div class="input-group">
            <label>Цвет</label>
            <input
              type="color"
              :value="common('color') ?? '#000000'"
              @input="setAll('color', ($event.target as HTMLInputElement).value)"
              :disabled="!hasEditable"
            />
          </div>
          <div class="input-group">
            <label>Фон</label>
            <input
              type="color"
              :value="common('backgroundColor') ?? '#ffffff'"
              @input="setAll('backgroundColor', ($event.target as HTMLInputElement).value)"
              :disabled="!hasEditable"
            />
          </div>
        </div>
      </div>

      <!-- Фигуры -->
      <div v-if="commonType === 'shape'" class="sidebar-section">
        <h4 class="section-title">
          Фигура
          <span class="section-count">· {{ selectedElements.length }}</span>
        </h4>
        <div class="input-grid">
          <div class="input-group">
            <label>Заливка</label>
            <input
              type="color"
              :value="common('fillColor') && common('fillColor') !== 'transparent' ? common('fillColor') : '#ffffff'"
              @input="setAll('fillColor', ($event.target as HTMLInputElement).value)"
              :disabled="!hasEditable || common('fillColor') === 'transparent'"
            />
          </div>
          <div class="input-group">
            <label>Обводка</label>
            <input
              type="color"
              :value="common('strokeColor') ?? '#000000'"
              @input="setAll('strokeColor', ($event.target as HTMLInputElement).value)"
              :disabled="!hasEditable"
            />
          </div>
        </div>
        <div class="input-group full">
          <label>Толщина обводки</label>
          <input
            type="range"
            :value="common('strokeWidth') ?? 1"
            @change="setAllNumber('strokeWidth', $event)"
            :disabled="!hasEditable"
            min="0"
            max="20"
          />
          <span class="range-value">{{
            common('strokeWidth') === null ? MIXED_LABEL : `${common('strokeWidth')}px`
          }}</span>
        </div>
        <div class="checkbox-group">
          <label>
            <input
              type="checkbox"
              :checked="common('fillColor') === 'transparent'"
              :indeterminate.prop="common('fillColor') === null"
              @change="setAll('fillColor', ($event.target as HTMLInputElement).checked ? 'transparent' : '#ffffff')"
              :disabled="!hasEditable"
            />
            Без заливки
          </label>
        </div>
      </div>

      <!-- Выравнивание группы -->
      <div class="sidebar-section">
        <h4 class="section-title">Выравнивание</h4>

        <div class="align-section">
          <p class="align-label">Относительно холста <span class="align-sub">(всё выделение целиком)</span></p>
          <div class="align-buttons">
            <button
              class="align-btn"
              @click="$emit('align', 'left')"
              title="По левому краю"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="3" y1="3" x2="3" y2="21" />
                <rect x="7" y="6" width="14" height="5" rx="1" />
                <rect x="7" y="13" width="10" height="5" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align', 'center-h')"
              title="По центру горизонтально"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="3" x2="12" y2="21" />
                <rect x="5" y="6" width="14" height="5" rx="1" />
                <rect x="7" y="13" width="10" height="5" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align', 'right')"
              title="По правому краю"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="21" y1="3" x2="21" y2="21" />
                <rect x="3" y="6" width="14" height="5" rx="1" />
                <rect x="7" y="13" width="10" height="5" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align', 'top')"
              title="По верхнему краю"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="3" y1="3" x2="21" y2="3" />
                <rect x="6" y="7" width="5" height="14" rx="1" />
                <rect x="13" y="7" width="5" height="10" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align', 'center-v')"
              title="По центру вертикально"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <rect x="6" y="5" width="5" height="14" rx="1" />
                <rect x="13" y="7" width="5" height="10" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align', 'bottom')"
              title="По нижнему краю"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="3" y1="21" x2="21" y2="21" />
                <rect x="6" y="3" width="5" height="14" rx="1" />
                <rect x="13" y="7" width="5" height="10" rx="1" />
              </svg>
            </button>
          </div>

          <p class="align-label mt-3">Относительно друг друга</p>
          <div class="align-buttons">
            <button
              class="align-btn"
              @click="$emit('align-group', 'left')"
              title="Выровнять левые края"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="5" width="8" height="4" rx="1" />
                <rect x="3" y="11" width="12" height="4" rx="1" />
                <rect x="3" y="17" width="6" height="4" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align-group', 'center-h')"
              title="Выровнять центры"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="8" y="5" width="8" height="4" rx="1" />
                <rect x="6" y="11" width="12" height="4" rx="1" />
                <rect x="9" y="17" width="6" height="4" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align-group', 'right')"
              title="Выровнять правые края"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="13" y="5" width="8" height="4" rx="1" />
                <rect x="9" y="11" width="12" height="4" rx="1" />
                <rect x="15" y="17" width="6" height="4" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align-group', 'top')"
              title="Выровнять верхние края"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="3" width="4" height="8" rx="1" />
                <rect x="11" y="3" width="4" height="12" rx="1" />
                <rect x="17" y="3" width="4" height="6" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align-group', 'center-v')"
              title="Выровнять середины по вертикали"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="8" width="4" height="8" rx="1" />
                <rect x="11" y="6" width="4" height="12" rx="1" />
                <rect x="17" y="9" width="4" height="6" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align-group', 'bottom')"
              title="Выровнять нижние края"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="13" width="4" height="8" rx="1" />
                <rect x="11" y="9" width="4" height="12" rx="1" />
                <rect x="17" y="15" width="4" height="6" rx="1" />
              </svg>
            </button>
          </div>
          <p class="align-hint">
            Заблокированные элементы служат опорой — остальные выравниваются по ним
          </p>

          <p class="align-label mt-3" v-if="selectedElements.length >= 3">
            Распределение
          </p>
          <div class="align-buttons" v-if="selectedElements.length >= 3">
            <button
              class="align-btn"
              @click="$emit('distribute', 'horizontal')"
              title="Распределить по горизонтали"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="2" y="8" width="4" height="8" rx="1" />
                <rect x="10" y="8" width="4" height="8" rx="1" />
                <rect x="18" y="8" width="4" height="8" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('distribute', 'vertical')"
              title="Распределить по вертикали"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="8" y="2" width="8" height="4" rx="1" />
                <rect x="8" y="10" width="8" height="4" rx="1" />
                <rect x="8" y="18" width="8" height="4" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Действия для группы -->
      <div class="sidebar-section actions-section">
        <h4 class="section-title">Действия</h4>
        <div class="action-buttons">
          <button class="action-button" @click="$emit('duplicate-multiple')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path
                d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
              />
            </svg>
            Дублировать все
          </button>
          <button class="action-button" @click="$emit('bring-to-front')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect width="8" height="8" x="8" y="8" rx="1" />
              <path d="M4 16V6a2 2 0 0 1 2-2h10" />
              <path d="M14 22h4a2 2 0 0 0 2-2v-4" />
            </svg>
            На передний план
          </button>
          <button class="action-button" @click="$emit('send-to-back')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect width="8" height="8" x="8" y="8" rx="1" />
              <path d="M4 8V6a2 2 0 0 1 2-2h2" />
              <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
            </svg>
            На задний план
          </button>
        </div>
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
            <svg
              v-if="selectedElement.locked"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
          </button>
          <button
            class="action-btn delete"
            @click="$emit('delete')"
            title="Удалить"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Позиция и размер -->
      <div class="sidebar-section">
        <h4 class="section-title">Позиция и размер</h4>

        <div class="input-grid compact">
          <div class="input-group">
            <label>X</label>
            <input
              type="number"
              :value="Math.round(selectedElement.x)"
              @input="updateNumericProp('x', $event)"
              :disabled="selectedElement.locked"
            />
          </div>
          <div class="input-group">
            <label>Y</label>
            <input
              type="number"
              :value="Math.round(selectedElement.y)"
              @input="updateNumericProp('y', $event)"
              :disabled="selectedElement.locked"
            />
          </div>
          <div class="input-group">
            <label>Ш</label>
            <input
              type="number"
              :value="Math.round(selectedElement.width)"
              @input="updateNumericProp('width', $event)"
              :disabled="selectedElement.locked"
              min="20"
            />
          </div>
          <div class="input-group">
            <label>В</label>
            <input
              type="number"
              :value="Math.round(selectedElement.height)"
              @input="updateNumericProp('height', $event)"
              :disabled="selectedElement.locked"
              min="20"
            />
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
          />
          <span class="range-value">{{ selectedElement.rotation }}°</span>
        </div>
      </div>

      <!-- Выравнивание -->
      <div class="sidebar-section">
        <h4 class="section-title">Выравнивание</h4>

        <div class="align-section">
          <p class="align-label">Относительно холста</p>
          <div class="align-buttons">
            <button
              class="align-btn"
              @click="$emit('align', 'left')"
              :disabled="selectedElement.locked"
              title="По левому краю"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="3" y1="3" x2="3" y2="21" />
                <rect x="7" y="6" width="14" height="5" rx="1" />
                <rect x="7" y="13" width="10" height="5" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align', 'center-h')"
              :disabled="selectedElement.locked"
              title="По центру горизонтально"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="3" x2="12" y2="21" />
                <rect x="5" y="6" width="14" height="5" rx="1" />
                <rect x="7" y="13" width="10" height="5" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align', 'right')"
              :disabled="selectedElement.locked"
              title="По правому краю"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="21" y1="3" x2="21" y2="21" />
                <rect x="3" y="6" width="14" height="5" rx="1" />
                <rect x="7" y="13" width="10" height="5" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align', 'top')"
              :disabled="selectedElement.locked"
              title="По верхнему краю"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="3" y1="3" x2="21" y2="3" />
                <rect x="6" y="7" width="5" height="14" rx="1" />
                <rect x="13" y="7" width="5" height="10" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align', 'center-v')"
              :disabled="selectedElement.locked"
              title="По центру вертикально"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <rect x="6" y="5" width="5" height="14" rx="1" />
                <rect x="13" y="7" width="5" height="10" rx="1" />
              </svg>
            </button>
            <button
              class="align-btn"
              @click="$emit('align', 'bottom')"
              :disabled="selectedElement.locked"
              title="По нижнему краю"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="3" y1="21" x2="21" y2="21" />
                <rect x="6" y="3" width="5" height="14" rx="1" />
                <rect x="13" y="7" width="5" height="10" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Настройки текста (для text и variable) -->
      <template
        v-if="
          selectedElement.type === 'text' || selectedElement.type === 'variable'
        "
      >
        <div class="sidebar-section">
          <h4 class="section-title">Текст</h4>

          <!-- Содержимое (только для text) -->
          <div v-if="selectedElement.type === 'text'" class="input-group full">
            <label>Содержимое</label>
            <textarea
              :value="(selectedElement as TextElement).content"
              @input="updateTextProp('content', $event)"
              :disabled="selectedElement.locked"
              rows="4"
              placeholder="Enter — новая строка"
            ></textarea>
          </div>

          <!-- Список (только для text): каждая строка — пункт -->
          <div v-if="selectedElement.type === 'text'" class="list-row">
            <div class="button-group list-buttons">
              <button
                class="style-btn"
                :class="{ active: getTextProp('listStyle') === 'bullet' }"
                @click="toggleListStyle('bullet')"
                :disabled="selectedElement.locked"
                title="Маркированный список"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="9" y1="6" x2="21" y2="6" />
                  <line x1="9" y1="12" x2="21" y2="12" />
                  <line x1="9" y1="18" x2="21" y2="18" />
                  <circle cx="4" cy="6" r="1.2" fill="currentColor" />
                  <circle cx="4" cy="12" r="1.2" fill="currentColor" />
                  <circle cx="4" cy="18" r="1.2" fill="currentColor" />
                </svg>
              </button>
              <button
                class="style-btn"
                :class="{ active: getTextProp('listStyle') === 'number' }"
                @click="toggleListStyle('number')"
                :disabled="selectedElement.locked"
                title="Нумерованный список"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="10" y1="6" x2="21" y2="6" />
                  <line x1="10" y1="12" x2="21" y2="12" />
                  <line x1="10" y1="18" x2="21" y2="18" />
                  <path d="M4 6h1v4" />
                  <path d="M4 10h2" />
                  <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
                </svg>
              </button>
            </div>
            <span class="list-hint">Каждая строка — отдельный пункт</span>
          </div>

          <!-- Переменная (только для variable) -->
          <div
            v-if="selectedElement.type === 'variable'"
            class="input-group full"
          >
            <label>Переменная</label>
            <select
              :value="(selectedElement as VariableElement).variableKey"
              @change="updateVariableKey($event)"
              :disabled="selectedElement.locked"
            >
              <optgroup
                v-for="group in variableGroups"
                :key="group.name"
                :label="group.name"
              >
                <option
                  v-for="v in group.variables"
                  :key="v.key"
                  :value="v.key"
                >
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
              />
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
              />
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="15" y1="12" x2="3" y2="12" />
                <line x1="17" y1="18" x2="3" y2="18" />
              </svg>
            </button>
            <button
              class="style-btn"
              :class="{ active: getTextProp('textAlign') === 'center' }"
              @click="setTextAlign('center')"
              :disabled="selectedElement.locked"
              title="По центру"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="17" y1="12" x2="7" y2="12" />
                <line x1="19" y1="18" x2="5" y2="18" />
              </svg>
            </button>
            <button
              class="style-btn"
              :class="{ active: getTextProp('textAlign') === 'right' }"
              @click="setTextAlign('right')"
              :disabled="selectedElement.locked"
              title="По правому краю"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="12" x2="9" y2="12" />
                <line x1="21" y1="18" x2="7" y2="18" />
              </svg>
            </button>
            <button
              class="style-btn"
              :class="{ active: getTextProp('textAlign') === 'justify' }"
              @click="setTextAlign('justify')"
              :disabled="selectedElement.locked"
              title="По ширине"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="12" x2="3" y2="12" />
                <line x1="21" y1="18" x2="3" y2="18" />
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
              />
              <input
                type="text"
                :value="getTextProp('color')"
                @input="updateTextProp('color', $event)"
                :disabled="selectedElement.locked"
                class="color-text"
              />
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
              />
              <input
                type="text"
                :value="getBackgroundColor()"
                @input="updateBackgroundColor($event)"
                :disabled="selectedElement.locked || isTransparentBackground()"
                class="color-text"
              />
            </div>
            <div class="checkbox-group mt-1">
              <label>
                <input
                  type="checkbox"
                  :checked="isTransparentBackground()"
                  @change="toggleTransparentBackground"
                  :disabled="selectedElement.locked"
                />
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
              @change="
                updateProp(
                  'objectFit',
                  ($event.target as HTMLSelectElement).value,
                )
              "
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
            />
            <span class="range-value"
              >{{
                Math.round((selectedElement as ImageElement).opacity * 100)
              }}%</span
            >
          </div>

          <button
            class="change-image-btn"
            @click="handleChangeImage"
            :disabled="selectedElement.locked"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Заменить изображение
          </button>
          <input
            ref="imageInputRef"
            type="file"
            accept="image/*"
            class="hidden-input"
            @change="onImageSelected"
          />
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
              @change="
                updateProp(
                  'dataSource',
                  ($event.target as HTMLSelectElement).value,
                )
              "
              :disabled="selectedElement.locked"
            >
              <option value="certificate_url">URL сертификата</option>
              <option value="certificate_number">Номер сертификата</option>
              <option value="custom">Кастомный текст</option>
              <option value="custom_url">Кастомный URL</option>
            </select>
          </div>

          <div
            v-if="
              ['custom', 'custom_url'].includes(
                (selectedElement as QRElement).dataSource,
              )
            "
            class="input-group full"
          >
            <label>{{
              (selectedElement as QRElement).dataSource === "custom_url"
                ? "Базовый URL"
                : "Данные"
            }}</label>
            <input
              type="text"
              :value="(selectedElement as QRElement).customData"
              @input="
                updateProp(
                  'customData',
                  ($event.target as HTMLInputElement).value,
                )
              "
              :disabled="selectedElement.locked"
              :placeholder="
                (selectedElement as QRElement).dataSource === 'custom_url'
                  ? 'https://example.com'
                  : 'Введите данные для QR'
              "
            />
            <p
              v-if="(selectedElement as QRElement).dataSource === 'custom_url'"
              class="help-text mt-1 text-xs text-gray-500"
            >
              Пример: https://domain.com/verify/{{ "{NUMBER}" }}
            </p>
          </div>

          <div class="input-grid">
            <div class="input-group">
              <label>Цвет</label>
              <input
                type="color"
                :value="(selectedElement as QRElement).color"
                @input="
                  updateProp('color', ($event.target as HTMLInputElement).value)
                "
                :disabled="selectedElement.locked"
              />
            </div>
            <div class="input-group">
              <label>Фон</label>
              <input
                type="color"
                :value="(selectedElement as QRElement).backgroundColor"
                @input="
                  updateProp(
                    'backgroundColor',
                    ($event.target as HTMLInputElement).value,
                  )
                "
                :disabled="selectedElement.locked"
              />
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
              @change="
                updateProp(
                  'shapeType',
                  ($event.target as HTMLSelectElement).value,
                )
              "
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
                :value="
                  (selectedElement as ShapeElement).fillColor === 'transparent'
                    ? '#ffffff'
                    : (selectedElement as ShapeElement).fillColor
                "
                @input="
                  updateProp(
                    'fillColor',
                    ($event.target as HTMLInputElement).value,
                  )
                "
                :disabled="selectedElement.locked"
              />
            </div>
            <div class="input-group">
              <label>Обводка</label>
              <input
                type="color"
                :value="(selectedElement as ShapeElement).strokeColor"
                @input="
                  updateProp(
                    'strokeColor',
                    ($event.target as HTMLInputElement).value,
                  )
                "
                :disabled="selectedElement.locked"
              />
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
            />
            <span class="range-value"
              >{{ (selectedElement as ShapeElement).strokeWidth }}px</span
            >
          </div>

          <div class="checkbox-group">
            <label>
              <input
                type="checkbox"
                :checked="
                  (selectedElement as ShapeElement).fillColor === 'transparent'
                "
                @change="toggleTransparentFill"
                :disabled="selectedElement.locked"
              />
              Без заливки
            </label>
          </div>
        </div>
      </template>

      <!-- Действия -->
      <div class="sidebar-section actions-section">
        <h4 class="section-title">Действия</h4>

        <div class="action-buttons">
          <button
            class="action-button"
            @click="$emit('duplicate')"
            :disabled="selectedElement.locked"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path
                d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
              />
            </svg>
            Дублировать
          </button>
          <button
            class="action-button"
            @click="$emit('select-same-type', selectedElement.type)"
            :title="`Выделить все элементы типа «${getElementTypeLabel(selectedElement.type)}» на странице, чтобы изменить их вместе`"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Выделить все «{{ getElementTypeLabel(selectedElement.type) }}»
          </button>
          <!-- Элемент выбран Alt+кликом внутри группы -->
          <button
            v-if="selectedElement.groupId"
            class="action-button"
            @click="$emit('ungroup')"
            title="Разгруппировать группу этого элемента (Ctrl+Shift+G)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="8" height="8" rx="1" />
              <rect x="13" y="13" width="8" height="8" rx="1" />
            </svg>
            Разгруппировать
          </button>
          <button class="action-button" @click="$emit('bring-to-front')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect width="8" height="8" x="8" y="8" rx="1" />
              <path d="M4 16V6a2 2 0 0 1 2-2h10" />
              <path d="M14 22h4a2 2 0 0 0 2-2v-4" />
            </svg>
            На передний план
          </button>
          <button class="action-button" @click="$emit('send-to-back')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect width="8" height="8" x="8" y="8" rx="1" />
              <path d="M4 10v10a2 2 0 0 0 2 2h10" />
              <path d="M10 4H6a2 2 0 0 0-2 2v4" />
            </svg>
            На задний план
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  AVAILABLE_VARIABLES,
  AVAILABLE_FONTS,
} from "~/composables/useCertificateEditor";
import { useAuthFetch } from "~/composables/useAuthFetch";
import { useNotification } from "~/composables/useNotification";
import type {
  TemplateElement,
  TextElement,
  VariableElement,
  ImageElement,
  QRElement,
  ShapeElement,
  VariableSource,
} from "~/types/certificate";

const props = defineProps<{
  selectedElement: TemplateElement | null;
  selectedElements: TemplateElement[];
  templateId: string;
  groupState?: { canGroup: boolean; canUngroup: boolean; isOneWholeGroup: boolean };
}>();

const emit = defineEmits<{
  (e: "update", id: string, updates: Partial<TemplateElement>): void;
  (e: "delete"): void;
  (e: "delete-multiple"): void;
  (e: "duplicate"): void;
  (e: "duplicate-multiple"): void;
  (e: "bring-to-front"): void;
  (e: "send-to-back"): void;
  (e: "toggle-lock"): void;
  (
    e: "align",
    direction: "left" | "center-h" | "right" | "top" | "center-v" | "bottom",
  ): void;
  (
    e: "align-group",
    direction: "left" | "center-h" | "right" | "top" | "center-v" | "bottom",
  ): void;
  (e: "distribute", direction: "horizontal" | "vertical"): void;
  /** Набор изменений для нескольких элементов — один шаг Undo */
  (
    e: "update-many",
    changes: { id: string; updates: Partial<TemplateElement> }[],
  ): void;
  (e: "select-ids", ids: string[]): void;
  (e: "select-same-type", type: TemplateElement["type"]): void;
  (e: "group"): void;
  (e: "ungroup"): void;
}>();

// ── Мультивыделение: общие свойства ───────────────────────────
const MIXED_LABEL = "разные";

const TEXT_ALIGN_OPTIONS = [
  { value: "left", title: "По левому краю", lines: [[21, 3], [15, 3], [17, 3]] },
  { value: "center", title: "По центру", lines: [[21, 3], [17, 7], [19, 5]] },
  { value: "right", title: "По правому краю", lines: [[21, 3], [21, 9], [21, 7]] },
  { value: "justify", title: "По ширине", lines: [[21, 3], [21, 3], [21, 3]] },
] as const;

/** Незаблокированные элементы — только их меняем */
const editableElements = computed(() =>
  props.selectedElements.filter((el) => !el.locked),
);
const hasEditable = computed(() => editableElements.value.length > 0);
const lockedCount = computed(
  () => props.selectedElements.length - editableElements.value.length,
);
const allLocked = computed(
  () =>
    props.selectedElements.length > 0 &&
    props.selectedElements.every((el) => el.locked),
);

/** Выделение по типам в порядке первого появления */
const typeGroups = computed(() => {
  const groups = new Map<TemplateElement["type"], string[]>();
  for (const el of props.selectedElements) {
    if (!groups.has(el.type)) groups.set(el.type, []);
    groups.get(el.type)!.push(el.id);
  }
  return Array.from(groups, ([type, ids]) => ({ type, ids }));
});

const commonType = computed(() =>
  typeGroups.value.length === 1 ? typeGroups.value[0]!.type : null,
);

/** Только тексты и переменные — у них одинаковые текстовые свойства */
const isTextLikeSelection = computed(
  () =>
    props.selectedElements.length > 0 &&
    props.selectedElements.every(
      (el) => el.type === "text" || el.type === "variable",
    ),
);

/**
 * Общее значение свойства у выбранных элементов, либо null, если разное.
 * Пустое значение listStyle считается "none".
 */
function common(prop: string): any {
  const els = props.selectedElements;
  if (els.length === 0) return null;
  const norm = (el: TemplateElement) => {
    const v = (el as any)[prop];
    if (prop === "listStyle") return v || "none";
    return v;
  };
  const first = norm(els[0]!);
  return els.every((el) => norm(el) === first) ? first : null;
}

/** Заливка текста: отсутствие значения = transparent */
const commonFill = computed(() => {
  const els = props.selectedElements;
  if (els.length === 0) return null;
  const norm = (el: TemplateElement) => {
    const bg = (el as any).backgroundColor;
    return !bg || bg === "transparent" ? "transparent" : bg;
  };
  const first = norm(els[0]!);
  return els.every((el) => norm(el) === first) ? first : null;
});

function roundOrEmpty(v: any) {
  return typeof v === "number" ? Math.round(v) : "";
}

function emitMany(build: (el: TemplateElement) => Partial<TemplateElement> | null) {
  const changes = editableElements.value
    .map((el) => ({ id: el.id, updates: build(el) }))
    .filter(
      (c): c is { id: string; updates: Partial<TemplateElement> } =>
        !!c.updates && Object.keys(c.updates).length > 0,
    );
  if (changes.length) emit("update-many", changes);
}

/** Одно значение для всех незаблокированных элементов */
function setAll(prop: string, value: any) {
  if (value === "" || value === undefined || value === null) return;
  emitMany((el) =>
    (el as any)[prop] === value ? null : ({ [prop]: value } as any),
  );
}

function setAllNumber(prop: string, event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  if (raw === "") return; // поле «разные» оставили пустым — ничего не меняем
  const value = parseFloat(raw);
  if (!isNaN(value)) setAll(prop, value);
}

/** Относительный шаг: у каждого своё значение ± delta, разница сохраняется */
function stepAll(prop: string, delta: number, min: number, max: number) {
  emitMany((el) => {
    const cur = Number((el as any)[prop]);
    if (isNaN(cur)) return null;
    const next = Math.min(max, Math.max(min, cur + delta));
    return next === cur ? null : ({ [prop]: next } as any);
  });
}

/** Переключатель: если у всех включено — выключить, иначе включить всем */
function toggleAll(prop: string, onValue: string, offValue: string) {
  const next = common(prop) === onValue ? offValue : onValue;
  emitMany((el) =>
    ((prop === "listStyle" ? (el as any)[prop] || "none" : (el as any)[prop]) === next
      ? null
      : ({ [prop]: next } as any)),
  );
}

function selectOnlyType(type: TemplateElement["type"]) {
  const group = typeGroups.value.find((g) => g.type === type);
  if (group && typeGroups.value.length > 1) emit("select-ids", group.ids);
}

/** Блокировка: если все заблокированы — разблокировать, иначе заблокировать все */
function toggleLockAll() {
  const lock = !allLocked.value;
  const changes = props.selectedElements
    .filter((el) => !!el.locked !== lock)
    .map((el) => ({ id: el.id, updates: { locked: lock } as Partial<TemplateElement> }));
  if (changes.length) emit("update-many", changes);
}

const { authFetch } = useAuthFetch();
const { error: showError } = useNotification();

const imageInputRef = ref<HTMLInputElement | null>(null);
const isUploadingImage = ref(false);

// Группы переменных
const variableGroups = computed(() => [
  {
    name: "Студент",
    variables: AVAILABLE_VARIABLES.filter((v) => v.key.startsWith("student.")),
  },
  {
    name: "Курс",
    variables: AVAILABLE_VARIABLES.filter((v) => v.key.startsWith("course.")),
  },
  {
    name: "Группа",
    variables: AVAILABLE_VARIABLES.filter((v) => v.key.startsWith("group.")),
  },
  {
    name: "Сертификат",
    variables: AVAILABLE_VARIABLES.filter((v) =>
      v.key.startsWith("certificate."),
    ),
  },
]);

function getElementTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: "Текст",
    variable: "Переменная",
    image: "Изображение",
    qr: "QR-код",
    shape: "Фигура",
  };
  return labels[type] || type;
}

function getTextProp(prop: string): any {
  if (!props.selectedElement) return "";
  return (props.selectedElement as any)[prop];
}

function updateProp(prop: string, value: any) {
  if (!props.selectedElement) return;
  emit("update", props.selectedElement.id, { [prop]: value });
}

function updateNumericProp(prop: string, event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value);
  if (!isNaN(value)) {
    updateProp(prop, value);
  }
}

function updateTextProp(prop: string, event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  // Для fontSize и lineHeight конвертируем в число
  if (prop === "fontSize" || prop === "lineHeight") {
    updateProp(prop, parseFloat(target.value));
  } else {
    updateProp(prop, target.value);
  }
}

function updateVariableKey(event: Event) {
  const value = (event.target as HTMLSelectElement).value as VariableSource;
  const variable = AVAILABLE_VARIABLES.find((v) => v.key === value);
  emit("update", props.selectedElement!.id, {
    variableKey: value,
    placeholder: variable?.placeholder || "[Переменная]",
  });
}

function toggleFontWeight() {
  const current = getTextProp("fontWeight");
  updateProp("fontWeight", current === "bold" ? "normal" : "bold");
}

function toggleFontStyle() {
  const current = getTextProp("fontStyle");
  updateProp("fontStyle", current === "italic" ? "normal" : "italic");
}

function setTextAlign(align: "left" | "center" | "right" | "justify") {
  updateProp("textAlign", align);
}

// Повторный клик по активному типу списка выключает список
function toggleListStyle(style: "bullet" | "number") {
  updateProp("listStyle", getTextProp("listStyle") === style ? "none" : style);
}

// Функции для работы с заливкой фона текста
function getBackgroundColor(): string {
  if (!props.selectedElement) return "#ffffff";
  const bg = (props.selectedElement as any).backgroundColor;
  // Если transparent или undefined, показываем белый в пикере
  return !bg || bg === "transparent" ? "#ffffff" : bg;
}

function isTransparentBackground(): boolean {
  if (!props.selectedElement) return true;
  const bg = (props.selectedElement as any).backgroundColor;
  return !bg || bg === "transparent";
}

function updateBackgroundColor(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  updateProp("backgroundColor", value);
}

function toggleTransparentBackground() {
  const current = (props.selectedElement as any).backgroundColor;
  updateProp(
    "backgroundColor",
    !current || current === "transparent" ? "#ffffff" : "transparent",
  );
}

function toggleTransparentFill() {
  const current = (props.selectedElement as ShapeElement).fillColor;
  updateProp(
    "fillColor",
    current === "transparent" ? "#ffffff" : "transparent",
  );
}

function handleChangeImage() {
  imageInputRef.value?.click();
}

async function onImageSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  isUploadingImage.value = true;

  try {
    // Загружаем файл через API
    const formData = new FormData();
    formData.append("image", file);

    const response = await authFetch<{
      success: boolean;
      url: string;
      message: string;
    }>(`/api/certificates/templates/${props.templateId}/upload-image`, {
      method: "POST",
      body: formData,
    });

    if (response.success) {
      updateProp("src", response.url);
    } else {
      throw new Error(response.message || "Ошибка загрузки изображения");
    }
  } catch (error: any) {
    console.error("Error uploading image:", error);
    showError(error.message || "Ошибка загрузки изображения");
  } finally {
    isUploadingImage.value = false;
    input.value = "";
  }
}
</script>

<style scoped>
.editor-sidebar {
  width: 320px;
  flex-shrink: 0;
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
  background: #dbeafe;
  color: #1e40af;
}

.element-type-badge.variable {
  background: #ede9fe;
  color: #5b21b6;
}

.element-type-badge.image {
  background: #d1fae5;
  color: #065f46;
}

.element-type-badge.qr {
  background: #fee2e2;
  color: #991b1b;
}

.element-type-badge.shape {
  background: #fef3c7;
  color: #92400e;
}

.element-type-badge.multi {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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
  background: #fee2e2;
  color: #dc2626;
}

:root.dark .action-btn:hover {
  background: var(--color-gray-700);
  color: var(--color-gray-300);
}

:root.dark .action-btn.delete:hover {
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
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

.input-grid.compact {
  gap: 0.375rem;
}

.input-grid.compact .input-group label {
  font-size: 0.6875rem;
}

.input-grid.compact .input-group input[type="number"] {
  padding: 0.375rem 0.25rem;
  font-size: 0.8125rem;
  text-align: center;
  max-width: 100%;
  width: 100%;
}

/* Скрываем стрелки у number-инпутов в компактном режиме */
.input-grid.compact
  .input-group
  input[type="number"]::-webkit-inner-spin-button,
.input-grid.compact
  .input-group
  input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-grid.compact .input-group input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
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
  border-color: #3b82f6;
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

.list-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.list-row .list-buttons {
  margin-bottom: 0;
}

.list-hint {
  font-size: 0.6875rem;
  color: var(--color-gray-500);
  line-height: 1.2;
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
  background: #3b82f6;
  border-color: #3b82f6;
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

/* Выравнивание */
.align-section {
  margin-bottom: 0.75rem;
}

.align-sub {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 400;
  color: var(--color-gray-400);
}

.align-hint {
  margin: 0.375rem 0 0;
  font-size: 0.6875rem;
  color: var(--color-gray-500);
  line-height: 1.3;
}

/* ── Группы ──────────────────────────────────────────────── */
.group-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-status {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6d28d9;
}

.group-dot {
  width: 8px;
  height: 8px;
  border: 1.5px dashed #8b5cf6;
  border-radius: 2px;
}

.group-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.375rem;
}

.group-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-gray-700);
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s;
}

.group-btn:hover:not(:disabled) {
  border-color: #8b5cf6;
  color: #6d28d9;
  background: #f5f3ff;
}

.group-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.group-btn kbd {
  font-family: inherit;
  font-size: 0.625rem;
  color: var(--color-gray-400);
}

:root.dark .group-btn {
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
  color: var(--color-gray-200);
}

/* ── Мультивыделение ─────────────────────────────────────── */
.type-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.type-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.type-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-gray-700);
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s;
}

.type-chip:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #2563eb;
  background: #eff6ff;
}

.type-chip:disabled,
.type-chip.only {
  cursor: default;
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.chip-count {
  min-width: 1.25rem;
  padding: 0 0.3rem;
  font-size: 0.6875rem;
  line-height: 1.1rem;
  text-align: center;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.15);
  color: #1d4ed8;
}

:root.dark .type-chip {
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
  color: var(--color-gray-200);
}

.select-same-btn {
  align-self: flex-start;
  padding: 0;
  font-size: 0.75rem;
  color: #2563eb;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.select-same-btn:hover {
  text-decoration: underline;
}

.mixed-note {
  margin: 0;
  font-size: 0.6875rem;
  line-height: 1.35;
  color: var(--color-gray-500);
}

.section-count {
  font-weight: 400;
  color: var(--color-gray-400);
  text-transform: none;
}

.size-stepper {
  display: flex;
  align-items: stretch;
  gap: 0.25rem;
}

.size-stepper input {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.size-stepper .style-btn {
  width: 30px;
  height: auto;
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 600;
}

/* Значение различается у выбранных элементов */
.style-btn.mixed {
  background-image: linear-gradient(
    135deg,
    transparent 45%,
    var(--color-gray-300) 45%,
    var(--color-gray-300) 55%,
    transparent 55%
  );
}

input::placeholder {
  font-style: italic;
}

.align-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-gray-600);
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

:root.dark .align-label {
  color: var(--color-gray-400);
}

.align-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.375rem;
}

.align-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  color: var(--color-gray-600);
  cursor: pointer;
  transition: all 0.15s;
}

.align-btn:hover:not(:disabled) {
  background: var(--color-gray-100);
  border-color: var(--color-gray-300);
  color: var(--color-gray-700);
}

.align-btn:active:not(:disabled) {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  transform: scale(0.95);
}

.align-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:root.dark .align-btn {
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
  color: var(--color-gray-400);
}

:root.dark .align-btn:hover:not(:disabled) {
  background: var(--color-gray-600);
  color: var(--color-gray-300);
}

/* Утилитарные классы */
.mt-1 {
  margin-top: 0.25rem;
}

.mt-3 {
  margin-top: 0.75rem;
}
</style>
