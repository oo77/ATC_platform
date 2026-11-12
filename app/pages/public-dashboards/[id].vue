<template>
  <div class="mx-auto max-w-screen-2xl">
    <UiPageHeader
      :title="form.title || 'Новый дашборд'"
      :breadcrumbs="[{ label: 'Публичные дашборды', to: '/public-dashboards' }, { label: isNew ? 'Создание' : 'Настройка' }]"
    >
      <template #badge>
        <span v-if="dirty" class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
          Не сохранено
        </span>
        <span v-else-if="!isNew && !form.isActive" class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          Ссылка отключена
        </span>
      </template>
      <template #actions>
        <a
          v-if="!isNew && publicUrl"
          :href="publicUrl"
          target="_blank"
          rel="noopener"
          class="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        >
          <ExternalLink class="h-4 w-4" /> Открыть ссылку
        </a>
        <UiButton variant="primary" :start-icon="Save" :loading="saving" :disabled="!dirty && !isNew" @click="save">
          {{ isNew ? "Создать" : "Сохранить" }}
        </UiButton>
      </template>
    </UiPageHeader>

    <div v-if="loadingDashboard" class="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div class="h-[600px] animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
      <div class="h-[600px] animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
    </div>

    <div v-else class="grid items-start gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
      <!-- ═════════════ Левая панель ═════════════ -->
      <aside class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] lg:sticky lg:top-20">
        <div class="flex border-b border-gray-200 px-2 dark:border-gray-800" role="tablist">
          <button
            v-for="t in tabs"
            :key="t.key"
            role="tab"
            :aria-selected="tab === t.key"
            class="relative flex flex-1 items-center justify-center gap-1.5 px-2 py-3 text-sm font-medium transition-colors"
            :class="tab === t.key ? 'text-brand-500' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'"
            @click="tab = t.key"
          >
            <component :is="t.icon" class="h-4 w-4" />
            {{ t.label }}
            <span v-if="t.key === 'widgets'" class="rounded-full bg-gray-100 px-1.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">{{ form.widgets.length }}</span>
            <span v-if="tab === t.key" class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500" />
          </button>
        </div>

        <div ref="panelScroll" class="custom-scrollbar max-h-[calc(100vh-230px)] overflow-y-auto p-4">
          <!-- ─────────── Виджеты ─────────── -->
          <div v-if="tab === 'widgets'" class="space-y-3">
            <UiButton variant="soft" block :start-icon="Plus" @click="catalogOpen = true">Добавить виджет</UiButton>

            <p v-if="!form.widgets.length" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Добавьте виджеты из каталога
            </p>

            <ul class="space-y-2">
              <li
                v-for="(w, index) in form.widgets"
                :key="w.id"
                :data-wid="w.id"
                class="rounded-lg border transition-colors"
                :class="[
                  selectedId === w.id ? 'border-brand-500 bg-brand-25 dark:bg-brand-500/[0.06]' : 'border-gray-200 dark:border-gray-800',
                  dragOverIndex === index && dragIndex !== index ? 'ring-2 ring-brand-300' : '',
                ]"
                @dragover.prevent="dragOverIndex = index"
                @drop.prevent="onDrop(index)"
              >
                <div class="flex items-center gap-2 px-2 py-2">
                  <span
                    class="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
                    draggable="true"
                    title="Перетащите, чтобы изменить порядок"
                    @dragstart="onDragStart(index, $event)"
                    @dragend="dragIndex = dragOverIndex = null"
                  >
                    <GripVertical class="h-4 w-4" />
                  </span>
                  <button class="flex min-w-0 flex-1 items-center gap-2 text-left" @click="toggleSelect(w.id)">
                    <component :is="widgetIcon(defOf(w)?.icon)" class="h-4 w-4 shrink-0 text-brand-500" />
                    <span class="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{{ w.title || defOf(w)?.title }}</span>
                  </button>
                  <span class="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] tabular-nums text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    {{ Math.min(w.w, form.settings.columns) }}×{{ w.h }}
                  </span>
                  <button class="shrink-0 rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" :aria-label="'Настроить'" @click="toggleSelect(w.id)">
                    <ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': selectedId === w.id }" />
                  </button>
                </div>

                <!-- Настройки виджета -->
                <div v-if="selectedId === w.id" class="space-y-3 border-t border-gray-200 px-3 pb-3 pt-3 dark:border-gray-800">
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ defOf(w)?.description }}</p>

                  <label class="block">
                    <span class="pd-label">Заголовок</span>
                    <input v-model="w.title" type="text" maxlength="120" class="pd-input" :placeholder="defOf(w)?.title" />
                  </label>

                  <div class="grid grid-cols-2 gap-3">
                    <label class="block">
                      <span class="pd-label">Ширина</span>
                      <select v-model.number="w.w" class="pd-input">
                        <option v-for="n in form.settings.columns" :key="n" :value="n">{{ n }} {{ plural(n, "колонка", "колонки", "колонок") }}</option>
                      </select>
                    </label>
                    <label class="block">
                      <span class="pd-label">Высота</span>
                      <select v-model.number="w.h" class="pd-input">
                        <option v-for="n in MAX_ROWS_PER_WIDGET" :key="n" :value="n">{{ n }} {{ plural(n, "ряд", "ряда", "рядов") }}</option>
                      </select>
                    </label>
                  </div>

                  <template v-for="opt in defOf(w)?.options || []" :key="opt.key">
                    <label v-if="opt.type === 'select'" class="block">
                      <span class="pd-label">{{ opt.label }}</span>
                      <select v-model="w.options[opt.key]" class="pd-input">
                        <option v-for="c in opt.choices" :key="String(c.value)" :value="c.value">{{ c.label }}</option>
                      </select>
                    </label>
                    <label v-else-if="opt.type === 'number'" class="block">
                      <span class="pd-label">{{ opt.label }}</span>
                      <input v-model.number="w.options[opt.key]" type="number" :min="opt.min" :max="opt.max" class="pd-input" />
                    </label>
                    <label v-else-if="opt.type === 'textarea'" class="block">
                      <span class="pd-label">{{ opt.label }}</span>
                      <textarea v-model="w.options[opt.key]" rows="4" maxlength="2000" class="pd-input resize-y" />
                    </label>
                    <div v-else-if="opt.type === 'multiselect'" class="block">
                      <span class="pd-label">{{ opt.label }}</span>
                      <div class="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                        <p v-if="!choicesFor(opt.source).length" class="text-xs text-gray-500">Список пуст</p>
                        <label v-for="c in choicesFor(opt.source)" :key="c.id" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input v-model="w.options[opt.key]" type="checkbox" :value="c.id" class="rounded border-gray-300" />
                          {{ c.name }}
                        </label>
                      </div>
                    </div>
                    <label v-else-if="opt.type === 'boolean'" class="flex items-center justify-between gap-3">
                      <span class="text-sm text-gray-700 dark:text-gray-300">{{ opt.label }}</span>
                      <UiSwitch v-model="w.options[opt.key]" />
                    </label>
                    <label v-else class="block">
                      <span class="pd-label">{{ opt.label }}</span>
                      <input v-model="w.options[opt.key]" type="text" class="pd-input" />
                    </label>
                  </template>

                  <div class="flex items-center gap-1 pt-1">
                    <button class="pd-mini-btn" title="Выше" :disabled="index === 0" @click="move(index, -1)"><ArrowUp class="h-4 w-4" /></button>
                    <button class="pd-mini-btn" title="Ниже" :disabled="index === form.widgets.length - 1" @click="move(index, 1)"><ArrowDown class="h-4 w-4" /></button>
                    <button class="pd-mini-btn" title="Дублировать" @click="duplicate(index)"><CopyPlus class="h-4 w-4" /></button>
                    <button class="pd-mini-btn ml-auto text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" title="Удалить виджет" @click="removeWidget(index)">
                      <Trash2 class="h-4 w-4" /> <span class="text-xs">Удалить</span>
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- ─────────── Оформление ─────────── -->
          <div v-else-if="tab === 'design'" class="space-y-5">
            <div>
              <span class="pd-label">Тема</span>
              <div class="pd-segment">
                <button v-for="t in themes" :key="t.value" :class="{ active: form.settings.theme === t.value }" @click="form.settings.theme = t.value">
                  <component :is="t.icon" class="h-4 w-4" /> {{ t.label }}
                </button>
              </div>
            </div>

            <div>
              <span class="pd-label">Колонок в сетке</span>
              <div class="pd-segment">
                <button v-for="n in [2, 3, 4, 5, 6]" :key="n" :class="{ active: form.settings.columns === n }" @click="setColumns(n)">{{ n }}</button>
              </div>
            </div>

            <div>
              <span class="pd-label">Акцентный цвет</span>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-for="c in ACCENT_COLORS"
                  :key="c"
                  class="h-8 w-8 rounded-full ring-offset-2 transition dark:ring-offset-gray-900"
                  :class="form.settings.accentColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-gray-900 dark:ring-white' : ''"
                  :style="{ background: c }"
                  :aria-label="`Цвет ${c}`"
                  @click="form.settings.accentColor = c"
                />
                <label class="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-dashed border-gray-300 dark:border-gray-600" title="Свой цвет">
                  <input v-model="form.settings.accentColor" type="color" class="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                  <Palette class="m-auto mt-1.5 h-4 w-4 text-gray-400" />
                </label>
              </div>
            </div>

            <label class="block">
              <span class="pd-label">Автообновление данных</span>
              <select v-model.number="form.settings.refreshInterval" class="pd-input">
                <option v-for="c in REFRESH_CHOICES" :key="c.value" :value="c.value">каждые {{ c.label }}</option>
              </select>
            </label>

            <div class="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <label v-for="t in toggles" :key="t.key" class="flex items-start justify-between gap-3">
                <span>
                  <span class="block text-sm font-medium text-gray-800 dark:text-gray-200">{{ t.label }}</span>
                  <span class="block text-xs text-gray-500 dark:text-gray-400">{{ t.hint }}</span>
                </span>
                <UiSwitch v-model="(form.settings as any)[t.key]" />
              </label>
            </div>
          </div>

          <!-- ─────────── Ссылка ─────────── -->
          <div v-else class="space-y-5">
            <label class="block">
              <span class="pd-label">Название</span>
              <input v-model="form.title" type="text" maxlength="200" class="pd-input" placeholder="Например: Экран в холле" />
            </label>
            <label class="block">
              <span class="pd-label">Подзаголовок</span>
              <input v-model="form.description" type="text" maxlength="1000" class="pd-input" placeholder="Показывается под названием" />
            </label>

            <label class="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              <span>
                <span class="block text-sm font-medium text-gray-800 dark:text-gray-200">Ссылка активна</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">Выключите, чтобы временно закрыть доступ без удаления</span>
              </span>
              <UiSwitch v-model="form.isActive" />
            </label>

            <!-- Публичная ссылка -->
            <div v-if="isNew" class="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-white/[0.04] dark:text-gray-400">
              Публичная ссылка появится после создания дашборда.
            </div>
            <div v-else class="space-y-3">
              <div>
                <span class="pd-label">Публичная ссылка</span>
                <div class="flex gap-2">
                  <input :value="publicUrl" readonly class="pd-input font-mono text-xs" @focus="($event.target as HTMLInputElement).select()" />
                  <button class="pd-icon-btn" title="Скопировать" aria-label="Скопировать ссылку" @click="copy(publicUrl, 'Ссылка скопирована')">
                    <Copy class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <span class="pd-label">Ссылка для ТВ / киоска</span>
                <div class="flex gap-2">
                  <input :value="kioskUrl" readonly class="pd-input font-mono text-xs" @focus="($event.target as HTMLInputElement).select()" />
                  <button class="pd-icon-btn" title="Скопировать" aria-label="Скопировать ссылку для киоска" @click="copy(kioskUrl, 'Ссылка для киоска скопирована')">
                    <Copy class="h-4 w-4" />
                  </button>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Без кнопок управления. На странице: F — весь экран, R — обновить.</p>
              </div>

              <div class="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR-код ссылки" class="h-24 w-24 rounded bg-white p-1" />
                <div class="space-y-2">
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200">QR-код</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Наведите камеру телефона, чтобы открыть дашборд</p>
                  <a v-if="qrDataUrl" :href="qrDataUrl" :download="`dashboard-qr.png`" class="inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline">
                    <Download class="h-3.5 w-3.5" /> Скачать PNG
                  </a>
                </div>
              </div>

              <UiButton variant="outline" size="sm" :start-icon="RefreshCw" @click="regenOpen = true">Выпустить новую ссылку</UiButton>
            </div>

            <!-- Пароль -->
            <div class="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">Пароль</span>
                <span v-if="hasPassword && !removePassword" class="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <Lock class="h-3.5 w-3.5" /> Установлен
                </span>
                <span v-else class="text-xs text-gray-500 dark:text-gray-400">Не задан — открыт всем, у кого есть ссылка</span>
              </div>
              <input
                v-model="newPassword"
                type="password"
                autocomplete="new-password"
                class="pd-input"
                :placeholder="hasPassword && !removePassword ? 'Новый пароль (оставьте пустым — без изменений)' : 'Задать пароль (минимум 4 символа)'"
                @input="removePassword = false"
              />
              <button
                v-if="hasPassword && !removePassword"
                class="text-xs font-medium text-red-500 hover:underline"
                @click="removePassword = true; newPassword = ''"
              >
                Убрать пароль
              </button>
              <p v-if="removePassword" class="text-xs text-amber-600 dark:text-amber-400">Пароль будет снят после сохранения.</p>
            </div>

            <!-- Срок действия -->
            <div class="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <span class="pd-label">Срок действия ссылки</span>
              <div class="flex gap-2">
                <input v-model="expiresLocal" type="datetime-local" class="pd-input" />
                <button v-if="expiresLocal" class="pd-icon-btn" title="Бессрочно" aria-label="Сделать бессрочной" @click="expiresLocal = ''">
                  <X class="h-4 w-4" />
                </button>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ expiresLocal ? "После этой даты ссылка перестанет открываться" : "Бессрочно" }}</p>
            </div>

            <!-- Статистика -->
            <dl v-if="!isNew && meta" class="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 text-sm dark:border-gray-800">
              <dt class="text-gray-500 dark:text-gray-400">Просмотров</dt>
              <dd class="text-right font-medium text-gray-900 dark:text-white">{{ meta.viewCount.toLocaleString("ru-RU") }}</dd>
              <dt class="text-gray-500 dark:text-gray-400">Последний просмотр</dt>
              <dd class="text-right font-medium text-gray-900 dark:text-white">{{ meta.lastViewedAt ? formatDateTime(meta.lastViewedAt) : "—" }}</dd>
              <dt class="text-gray-500 dark:text-gray-400">Создал</dt>
              <dd class="truncate text-right font-medium text-gray-900 dark:text-white">{{ meta.createdByName || "—" }}</dd>
            </dl>
          </div>
        </div>
      </aside>

      <!-- ═════════════ Предпросмотр ═════════════ -->
      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
          <div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Eye class="h-4 w-4" /> Предпросмотр
            <span v-if="previewLoading" class="text-xs font-normal text-gray-400">обновление…</span>
          </div>
          <div class="flex items-center gap-1">
            <button class="pd-mini-btn" title="Обновить данные" @click="loadPreview"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': previewLoading }" /></button>
            <button class="pd-mini-btn" title="Предпросмотр на весь экран" @click="previewFullscreen">
              <Maximize class="h-4 w-4" /> <span class="hidden text-xs sm:inline">На весь экран</span>
            </button>
          </div>
        </div>
        <div ref="previewBox" class="preview-box custom-scrollbar overflow-auto" :class="form.settings.fitToScreen ? 'h-[calc(100vh-230px)] min-h-[520px]' : 'max-h-[calc(100vh-230px)] min-h-[520px]'">
          <DashboardView
            :title="form.title"
            :description="form.description"
            :widgets="form.widgets"
            :settings="form.settings"
            :data="previewData"
            :generated-at="previewAt"
            :loading="previewLoading"
            :fill="form.settings.fitToScreen"
            selectable
            :selected-id="selectedId"
            @select="selectFromPreview"
          >
            <template #empty>
              <button class="rounded-lg border border-dashed px-4 py-3 text-sm" style="border-color: var(--pd-border)" @click="catalogOpen = true">
                + Добавить первый виджет
              </button>
            </template>
          </DashboardView>
        </div>
      </section>
    </div>

    <!-- Каталог виджетов -->
    <UiModal :is-open="catalogOpen" title="Каталог виджетов" size="xl" close-on-backdrop @close="catalogOpen = false">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input v-model="catalogSearch" type="search" class="pd-input" style="padding-left: 2.25rem" placeholder="Поиск виджета" />
        </div>
        <div class="pd-segment shrink-0">
          <button :class="{ active: catalogCategory === 'all' }" @click="catalogCategory = 'all'">Все</button>
          <button v-for="(label, key) in WIDGET_CATEGORY_LABELS" :key="key" :class="{ active: catalogCategory === key }" @click="catalogCategory = key">
            {{ label }}
          </button>
        </div>
      </div>
      <div v-for="group in catalogGroups" :key="group.key" class="mb-5 last:mb-0">
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ group.label }} · {{ group.items.length }}</h3>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="def in group.items"
            :key="def.type"
            class="group flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-left transition hover:border-brand-500 hover:bg-brand-25 dark:border-gray-800 dark:hover:bg-brand-500/[0.06]"
            @click="addWidget(def.type)"
          >
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15">
              <component :is="widgetIcon(def.icon)" class="h-4.5 w-4.5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2">
                <span class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ def.title }}</span>
                <span v-if="usedCount(def.type)" class="shrink-0 rounded bg-gray-100 px-1 text-[11px] text-gray-500 dark:bg-gray-800">×{{ usedCount(def.type) }}</span>
              </span>
              <span class="mt-0.5 line-clamp-2 block text-xs text-gray-500 dark:text-gray-400">{{ def.description }}</span>
            </span>
            <Plus class="mt-1 h-4 w-4 shrink-0 text-gray-300 group-hover:text-brand-500" />
          </button>
        </div>
      </div>
      <p v-if="!catalogGroups.length" class="py-8 text-center text-sm text-gray-500">Ничего не найдено</p>
    </UiModal>

    <UiConfirmModal
      :is-open="regenOpen"
      title="Выпустить новую ссылку?"
      message="Старая ссылка сразу перестанет работать — экраны, где она открыта, нужно будет перенастроить."
      confirm-text="Выпустить"
      variant="warning"
      :loading="regenLoading"
      @confirm="regenerate"
      @cancel="regenOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import {
  ArrowDown, ArrowUp, ChevronDown, Copy, CopyPlus, Download, ExternalLink, Eye, GripVertical, LayoutGrid,
  Link2, Lock, Maximize, Monitor, Moon, Paintbrush, Palette, Plus, RefreshCw, Save, Search, Sun, Trash2, X,
} from "lucide-vue-next";
import QRCode from "qrcode";
import DashboardView from "~/components/public-dashboard/DashboardView.vue";
import { widgetIcon } from "~/components/public-dashboard/widgetIcons";
import {
  ACCENT_COLORS,
  DEFAULT_DASHBOARD_SETTINGS,
  DEFAULT_WIDGET_SET,
  MAX_ROWS_PER_WIDGET,
  MAX_WIDGETS,
  REFRESH_CHOICES,
  WIDGET_CATALOG,
  WIDGET_CATEGORY_LABELS,
  createWidget,
  getWidgetDef,
  type DashboardSettings,
  type DashboardTheme,
  type DashboardWidget,
  type WidgetCategory,
  type WidgetData,
} from "../../../shared/utils/publicDashboard";

definePageMeta({ layout: "default", title: "Публичный дашборд" });

const route = useRoute();
const router = useRouter();
const { authFetch } = useAuthFetch();
const notify = useNotification();

const isNew = computed(() => route.params.id === "new");

// ─────────────────────── Состояние формы ───────────────────────
const newId = () => `w_${Math.random().toString(36).slice(2, 10)}`;

const form = reactive<{
  title: string;
  description: string;
  isActive: boolean;
  widgets: DashboardWidget[];
  settings: DashboardSettings;
}>({
  title: "Дашборд учебного центра",
  description: "",
  isActive: true,
  widgets: [],
  settings: { ...DEFAULT_DASHBOARD_SETTINGS },
});

useHead({ title: () => (isNew.value ? "Новый дашборд" : form.title || "Публичный дашборд") });

const meta = ref<{ token: string; viewCount: number; lastViewedAt: string | null; createdByName: string | null } | null>(null);
const hasPassword = ref(false);
const newPassword = ref("");
const removePassword = ref(false);
const expiresLocal = ref("");

const loadingDashboard = ref(!isNew.value);
const saving = ref(false);
const savedSnapshot = ref("");

const snapshot = () =>
  JSON.stringify({ ...form, expiresLocal: expiresLocal.value, newPassword: newPassword.value, removePassword: removePassword.value });
const dirty = computed(() => savedSnapshot.value !== "" && snapshot() !== savedSnapshot.value);

const tabs = [
  { key: "widgets", label: "Виджеты", icon: LayoutGrid },
  { key: "design", label: "Вид", icon: Paintbrush },
  { key: "link", label: "Ссылка", icon: Link2 },
] as const;
const tab = ref<(typeof tabs)[number]["key"]>("widgets");
const panelScroll = ref<HTMLElement | null>(null);
watch(tab, () => panelScroll.value?.scrollTo({ top: 0 }));

const themes: { value: DashboardTheme; label: string; icon: any }[] = [
  { value: "dark", label: "Тёмная", icon: Moon },
  { value: "light", label: "Светлая", icon: Sun },
  { value: "auto", label: "Авто", icon: Monitor },
];

const toggles: { key: keyof DashboardSettings; label: string; hint: string }[] = [
  { key: "showHeader", label: "Шапка с названием", hint: "Название, подзаголовок и кнопки" },
  { key: "showClock", label: "Часы в шапке", hint: "Текущее время и дата" },
  { key: "showLastUpdated", label: "Время обновления", hint: "Когда данные обновились последний раз" },
  { key: "fitToScreen", label: "Растянуть на экран", hint: "Виджеты заполняют всю высоту экрана — для ТВ" },
  { key: "allowFullscreen", label: "Кнопка «На весь экран»", hint: "Показывать кнопку полноэкранного режима" },
  { key: "maskNames", label: "Скрывать ФИО", hint: "Показывать «Иванов И. И.» вместо полного имени" },
];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function applyServer(d: any) {
  form.title = d.title;
  form.description = d.description || "";
  form.isActive = d.isActive;
  form.widgets = d.widgets;
  form.settings = { ...DEFAULT_DASHBOARD_SETTINGS, ...d.settings };
  hasPassword.value = d.hasPassword;
  expiresLocal.value = toLocalInput(d.expiresAt);
  meta.value = { token: d.token, viewCount: d.viewCount, lastViewedAt: d.lastViewedAt, createdByName: d.createdByName };
  newPassword.value = "";
  removePassword.value = false;
}

async function loadDashboard() {
  if (isNew.value) {
    form.widgets = DEFAULT_WIDGET_SET.map((s) => {
      const w = createWidget(s.type, newId())!;
      if (s.w) w.w = s.w;
      if (s.h) w.h = s.h;
      return w;
    });
    savedSnapshot.value = snapshot();
    return;
  }
  try {
    const res = await authFetch<{ data: any }>(`/api/public-dashboards/${route.params.id}`);
    applyServer(res.data);
    savedSnapshot.value = snapshot();
  } catch (e: any) {
    notify.error(e?.data?.message || "Дашборд не найден");
    router.replace("/public-dashboards");
  } finally {
    loadingDashboard.value = false;
  }
}

async function save() {
  if (!form.title.trim()) {
    tab.value = "link";
    notify.error("Укажите название дашборда");
    return;
  }
  if (newPassword.value && newPassword.value.length < 4) {
    tab.value = "link";
    notify.error("Пароль должен содержать минимум 4 символа");
    return;
  }
  saving.value = true;
  try {
    const body = {
      title: form.title,
      description: form.description,
      isActive: form.isActive,
      widgets: form.widgets,
      settings: form.settings,
      expiresAt: expiresLocal.value ? new Date(expiresLocal.value).toISOString() : null,
      password: newPassword.value || undefined,
      removePassword: removePassword.value || undefined,
    };
    const res = await authFetch<{ data: any }>(isNew.value ? "/api/public-dashboards" : `/api/public-dashboards/${route.params.id}`, {
      method: isNew.value ? "POST" : "PUT",
      body,
    });
    applyServer(res.data);
    savedSnapshot.value = snapshot();
    notify.success(isNew.value ? "Дашборд создан — ссылка готова" : "Изменения сохранены");
    if (isNew.value) {
      await router.replace(`/public-dashboards/${res.data.id}`);
      tab.value = "link";
    }
  } catch (e: any) {
    notify.error(e?.data?.message || "Не удалось сохранить");
  } finally {
    saving.value = false;
  }
}

// ─────────────────────── Работа с виджетами ───────────────────────
const selectedId = ref<string | null>(null);
const defOf = (w: DashboardWidget) => getWidgetDef(w.type);

function toggleSelect(id: string) {
  selectedId.value = selectedId.value === id ? null : id;
}

function selectFromPreview(id: string) {
  tab.value = "widgets";
  selectedId.value = id;
  // Прокручиваем только панель (scrollIntoView сдвинул бы и overflow-hidden контейнер layout)
  nextTick(() => {
    const panel = panelScroll.value;
    const item = panel?.querySelector<HTMLElement>(`[data-wid="${id}"]`);
    if (!panel || !item) return;
    const top = item.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop - 8;
    panel.scrollTo({ top, behavior: "smooth" });
  });
}

function addWidget(type: string) {
  if (form.widgets.length >= MAX_WIDGETS) {
    notify.warning(`Не более ${MAX_WIDGETS} виджетов на одном дашборде`);
    return;
  }
  const w = createWidget(type, newId());
  if (!w) return;
  w.w = Math.min(w.w, form.settings.columns);
  form.widgets.push(w);
  selectedId.value = w.id;
  catalogOpen.value = false;
  tab.value = "widgets";
}

function removeWidget(index: number) {
  const [w] = form.widgets.splice(index, 1);
  if (w && selectedId.value === w.id) selectedId.value = null;
}

function duplicate(index: number) {
  const src = form.widgets[index];
  if (!src || form.widgets.length >= MAX_WIDGETS) return;
  const copy: DashboardWidget = JSON.parse(JSON.stringify(src));
  copy.id = newId();
  form.widgets.splice(index + 1, 0, copy);
  selectedId.value = copy.id;
}

function move(index: number, dir: -1 | 1) {
  const to = index + dir;
  if (to < 0 || to >= form.widgets.length) return;
  const [w] = form.widgets.splice(index, 1);
  form.widgets.splice(to, 0, w!);
}

function setColumns(n: number) {
  form.settings.columns = n;
  for (const w of form.widgets) if (w.w > n) w.w = n;
}

// Перетаскивание в списке
const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);
function onDragStart(index: number, e: DragEvent) {
  dragIndex.value = index;
  e.dataTransfer?.setData("text/plain", String(index));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
}
function onDrop(index: number) {
  const from = dragIndex.value;
  dragIndex.value = dragOverIndex.value = null;
  if (from == null || from === index) return;
  const [w] = form.widgets.splice(from, 1);
  form.widgets.splice(index, 0, w!);
}

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};

// ─────────────────────── Каталог ───────────────────────
const catalogOpen = ref(false);
const catalogSearch = ref("");
const catalogCategory = ref<WidgetCategory | "all">("all");

const catalogGroups = computed(() => {
  const q = catalogSearch.value.trim().toLowerCase();
  return (Object.keys(WIDGET_CATEGORY_LABELS) as WidgetCategory[])
    .filter((c) => catalogCategory.value === "all" || catalogCategory.value === c)
    .map((c) => ({
      key: c,
      label: WIDGET_CATEGORY_LABELS[c],
      items: WIDGET_CATALOG.filter(
        (d) => d.category === c && (!q || d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)),
      ),
    }))
    .filter((g) => g.items.length);
});

const usedCount = (type: string) => form.widgets.filter((w) => w.type === type).length;

// ─────────────────────── Предпросмотр ───────────────────────
const previewData = ref<Record<string, WidgetData>>({});
const previewAt = ref<string | null>(null);
const previewLoading = ref(false);
const previewBox = ref<HTMLElement | null>(null);
let previewTimer: ReturnType<typeof setTimeout> | undefined;
let previewSeq = 0;

async function loadPreview() {
  if (!form.widgets.length) return;
  const seq = ++previewSeq;
  previewLoading.value = true;
  try {
    const res = await authFetch<{ data: Record<string, WidgetData>; generatedAt: string }>("/api/public-dashboards/preview", {
      method: "POST",
      body: { widgets: form.widgets, settings: form.settings },
    });
    if (seq !== previewSeq) return;
    previewData.value = res.data;
    previewAt.value = res.generatedAt;
  } catch (e: any) {
    if (seq === previewSeq) notify.error(e?.data?.message || "Не удалось загрузить данные предпросмотра");
  } finally {
    if (seq === previewSeq) previewLoading.value = false;
  }
}

// Данные зависят только от типа, опций и маскировки ФИО — не от заголовков и размеров
const dataKey = computed(() =>
  JSON.stringify([form.settings.maskNames, form.settings.columns, form.widgets.map((w) => [w.id, w.type, w.options])]),
);
watch(dataKey, () => {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(loadPreview, 500);
});

async function previewFullscreen() {
  try {
    await previewBox.value?.requestFullscreen();
  } catch {
    notify.error("Браузер не поддерживает полноэкранный режим");
  }
}

// ─────────────────────── Ссылка ───────────────────────
const origin = ref("");
const publicUrl = computed(() => (meta.value ? `${origin.value}/d/${meta.value.token}` : ""));
const kioskUrl = computed(() => (publicUrl.value ? `${publicUrl.value}?kiosk=1` : ""));
const qrDataUrl = ref("");

watch(
  publicUrl,
  async (url) => {
    if (!url) return (qrDataUrl.value = "");
    try {
      qrDataUrl.value = await QRCode.toDataURL(url, { margin: 1, width: 320 });
    } catch {
      qrDataUrl.value = "";
    }
  },
  { immediate: true },
);

async function copy(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    notify.success(message);
  } catch {
    notify.error("Не удалось скопировать");
  }
}

const regenOpen = ref(false);
const regenLoading = ref(false);
async function regenerate() {
  regenLoading.value = true;
  try {
    const res = await authFetch<{ data: { token: string } }>(`/api/public-dashboards/${route.params.id}/regenerate-token`, { method: "POST" });
    if (meta.value) meta.value.token = res.data.token;
    notify.success("Новая ссылка выпущена, старая отключена");
    regenOpen.value = false;
  } catch (e: any) {
    notify.error(e?.data?.message || "Не удалось выпустить ссылку");
  } finally {
    regenLoading.value = false;
  }
}

const formatDateTime = (v: string) =>
  new Date(v).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ─────────────────────── Несохранённые изменения ───────────────────────
function beforeUnload(e: BeforeUnloadEvent) {
  if (dirty.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}

onBeforeRouteLeave((to) => {
  if (!dirty.value || saving.value) return true;
  // Переход new → /:id после создания — не спрашиваем
  if (to.path.startsWith("/public-dashboards/") && isNew.value) return true;
  return window.confirm("Есть несохранённые изменения. Уйти без сохранения?");
});

// Ctrl/Cmd+S — сохранить
function onKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "ы")) {
    e.preventDefault();
    if (dirty.value || isNew.value) save();
  }
}

// Варианты для опций типа multiselect (сейчас — список аудиторий)
const classroomChoices = ref<{ id: string; name: string }[]>([]);
const loadClassroomChoices = async () => {
  try {
    const res = await authFetch<{ classrooms: { id: string; name: string }[] }>("/api/classrooms");
    classroomChoices.value = res.classrooms ?? [];
  } catch (e) {
    console.error("Не удалось загрузить список аудиторий для редактора:", e);
  }
};
const choicesFor = (source?: string) => (source === "classrooms" ? classroomChoices.value : []);

onMounted(async () => {
  origin.value = window.location.origin;
  window.addEventListener("beforeunload", beforeUnload);
  window.addEventListener("keydown", onKey);
  void loadClassroomChoices();
  // Предпросмотр загрузится через watch(dataKey), когда появятся виджеты
  await loadDashboard();
});

onBeforeUnmount(() => {
  clearTimeout(previewTimer);
  window.removeEventListener("beforeunload", beforeUnload);
  window.removeEventListener("keydown", onKey);
});
</script>

<style scoped>
.pd-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(107 114 128);
}
:global(.dark) .pd-label {
  color: rgb(156 163 175);
}
.pd-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(209 213 219);
  background: transparent;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: rgb(31 41 55);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pd-input:focus {
  border-color: var(--color-brand-500, #465fff);
  box-shadow: 0 0 0 3px rgb(70 95 255 / 0.12);
}
:global(.dark) .pd-input {
  border-color: rgb(55 65 81);
  color: rgb(229 231 235);
  background: rgb(17 24 39);
}
.pd-segment {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  border-radius: 0.5rem;
  background: rgb(243 244 246);
  padding: 3px;
}
:global(.dark) .pd-segment {
  background: rgb(31 41 55);
}
.pd-segment > button {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  border-radius: 0.375rem;
  padding: 6px 10px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(107 114 128);
}
.pd-segment > button.active {
  background: white;
  color: rgb(17 24 39);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
}
:global(.dark) .pd-segment > button.active {
  background: rgb(55 65 81);
  color: white;
}
.pd-mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 0.375rem;
  padding: 6px;
  color: rgb(107 114 128);
}
.pd-mini-btn:hover:not(:disabled) {
  background: rgb(243 244 246);
  color: rgb(17 24 39);
}
:global(.dark) .pd-mini-btn:hover:not(:disabled) {
  background: rgb(31 41 55);
  color: white;
}
.pd-mini-btn:disabled {
  opacity: 0.35;
}
.pd-icon-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 38px;
  border-radius: 0.5rem;
  border: 1px solid rgb(209 213 219);
  color: rgb(107 114 128);
}
.pd-icon-btn:hover {
  color: var(--color-brand-500, #465fff);
}
:global(.dark) .pd-icon-btn {
  border-color: rgb(55 65 81);
  color: rgb(156 163 175);
}
.preview-box:fullscreen {
  height: 100vh !important;
  max-height: none !important;
}
</style>
