<template>
  <div class="h-full w-full flex flex-col overflow-hidden bg-white dark:bg-gray-950">
    <!-- Subheader Bar (Under Global Navbar) -->
    <div
      class="h-13 px-4 border-b border-gray-200/80 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md flex items-center justify-between shrink-0 z-10"
    >
      <!-- Left: Sidebar toggle + Session Title -->
      <div class="flex items-center gap-2.5 min-w-0">
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          :title="isSidebarOpen ? 'Скрыть историю' : 'Показать историю'"
        >
          <PanelLeft :size="17" />
        </button>

        <div class="flex items-center gap-2 min-w-0">
          <h1 class="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
            {{ currentSessionTitle }}
          </h1>
          <span class="hidden md:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200/50 dark:border-blue-800/50 shrink-0">
            ReAct Data Agent
          </span>
        </div>
      </div>

      <!-- Right: Model Selector + Effort Selector + Canvas + New Chat -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Model Selector Dropdown (Configured AI Providers & Models) -->
        <div class="relative" ref="modelDropdownRef">
          <button
            @click="isModelMenuOpen = !isModelMenuOpen"
            class="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700 flex items-center gap-1.5 transition-colors shadow-xs"
            title="Выбрать настроенную модель ИИ"
          >
            <Cpu :size="13" class="text-blue-600 dark:text-blue-400" />
            <span class="max-w-[120px] sm:max-w-none truncate flex items-center gap-1">
              <span>{{ selectedModelLabel }}</span>
              <span
                v-if="currentSelectedProvider"
                class="hidden md:inline text-[10px] text-gray-400 font-normal"
              >
                ({{ currentSelectedProvider.providerName }})
              </span>
            </span>
            <ChevronDown :size="12" class="text-gray-400" />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="isModelMenuOpen"
            class="absolute right-0 mt-1.5 w-72 sm:w-80 max-h-[480px] flex flex-col rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
          >
            <!-- Header -->
            <div class="px-3 pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <div class="text-[11px] font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Cpu :size="13" class="text-blue-600" />
                  <span>Настроенные модели ИИ</span>
                </div>
                <div class="text-[10px] text-gray-400">
                  Активные подключения провайдеров
                </div>
              </div>
              <NuxtLink
                to="/settings"
                class="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline flex items-center gap-0.5"
                title="Перейти к подключению провайдеров"
              >
                <span>Настройки</span>
                <ArrowRight :size="10" />
              </NuxtLink>
            </div>

            <!-- Search input -->
            <div class="p-2 border-b border-gray-100 dark:border-gray-800">
              <div class="relative">
                <Search :size="12" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="modelSearchQuery"
                  type="text"
                  placeholder="Быстрый поиск модели..."
                  class="w-full pl-7 pr-2.5 py-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            <!-- Providers & Models List -->
            <div class="overflow-y-auto custom-scrollbar flex-1 p-1 space-y-2">
              <div
                v-if="loadingModels"
                class="py-6 text-center text-xs text-gray-400 flex flex-col items-center gap-2"
              >
                <Loader2 :size="16" class="animate-spin text-blue-600" />
                <span>Загрузка подключений...</span>
              </div>

              <div
                v-else-if="filteredProviderGroups.length === 0"
                class="py-6 text-center text-xs text-gray-400 px-3"
              >
                Модели не найдены
              </div>

              <div
                v-for="group in filteredProviderGroups"
                :key="group.settingId"
                class="space-y-1"
              >
                <!-- Group Header -->
                <div class="px-2.5 pt-1.5 pb-0.5 flex items-center justify-between">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span
                      class="px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wide border"
                      :class="getProviderBadgeColor(group.provider)"
                    >
                      {{ group.providerName }}
                    </span>
                    <span class="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {{ group.name }}
                    </span>
                  </div>
                  <span
                    v-if="group.isDefault"
                    class="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0"
                  >
                    По умолчанию
                  </span>
                </div>

                <!-- Model Buttons in Group -->
                <div class="space-y-0.5">
                  <button
                    v-for="m in group.models"
                    :key="m.id"
                    @click="selectConfiguredModel(group.settingId, m.id)"
                    class="w-full px-2.5 py-1.5 text-left rounded-xl text-xs flex items-center justify-between hover:bg-blue-50/70 dark:hover:bg-blue-900/20 transition-colors"
                    :class="selectedSettingId === group.settingId && selectedModel === m.id
                      ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/60 dark:bg-blue-900/25'
                      : 'text-gray-700 dark:text-gray-300'"
                  >
                    <div class="flex items-center gap-2 min-w-0 pr-2">
                      <span class="text-sm shrink-0">{{ m.icon }}</span>
                      <div class="flex flex-col min-w-0">
                        <span class="truncate font-medium">{{ m.name }}</span>
                        <div class="flex items-center gap-1.5 mt-0.5">
                          <span
                            class="text-[9px] px-1 py-0.2 rounded font-medium"
                            :class="m.isConfigured
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'"
                          >
                            {{ m.tag }}
                          </span>
                          <span class="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                            {{ m.id }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      v-if="selectedSettingId === group.settingId && selectedModel === m.id"
                      class="text-blue-600 dark:text-blue-400 font-bold shrink-0 text-xs"
                    >
                      ✓
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Footer banner if fallback -->
            <div
              v-if="!hasConfiguredProviders"
              class="mt-1 pt-1.5 px-3 border-t border-gray-100 dark:border-gray-800 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1"
            >
              <span>⚠️ Используются системные fallback-настройки</span>
            </div>
          </div>
        </div>

        <!-- Effort Selector Dropdown -->
        <div class="relative" ref="effortDropdownRef">
          <button
            @click="isEffortMenuOpen = !isEffortMenuOpen"
            class="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700 flex items-center gap-1.5 transition-colors shadow-xs"
            title="Уровень глубины рассуждений"
          >
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="{
                'bg-emerald-500': selectedEffort === 'low',
                'bg-amber-500': selectedEffort === 'medium',
                'bg-purple-500': selectedEffort === 'high',
              }"
            ></span>
            <span class="hidden sm:inline">Effort:</span>
            <span class="capitalize">{{ selectedEffort }}</span>
            <ChevronDown :size="12" class="text-gray-400" />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="isEffortMenuOpen"
            class="absolute right-0 mt-1.5 w-60 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
          >
            <div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
              Глубина рассуждений (Effort)
            </div>
            <button
              v-for="eff in effortOptions"
              :key="eff.id"
              @click="selectEffort(eff.id)"
              class="w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-blue-50/70 dark:hover:bg-blue-900/20 transition-colors"
              :class="selectedEffort === eff.id ? 'text-blue-600 font-semibold bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-700 dark:text-gray-300'"
            >
              <div class="flex flex-col min-w-0 pr-2">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full" :class="eff.color"></span>
                  <span class="font-medium">{{ eff.name }}</span>
                </div>
                <span class="text-[10px] text-gray-400 mt-0.5">{{ eff.desc }}</span>
              </div>
              <span v-if="selectedEffort === eff.id" class="text-blue-600 shrink-0">✓</span>
            </button>
          </div>
        </div>

        <!-- Canvas Toggle -->
        <button
          v-if="currentArtifact"
          @click="isCanvasOpen = !isCanvasOpen"
          class="px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
          :class="isCanvasOpen
            ? 'bg-blue-600 text-white shadow-blue-500/25'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60'"
        >
          <TableIcon :size="13" />
          <span class="hidden sm:inline">{{ isCanvasOpen ? 'Скрыть Canvas' : 'Canvas' }}</span>
          <span
            v-if="currentArtifact?.rows?.length"
            class="px-1.5 py-0.2 text-[9px] rounded-full bg-blue-500/20 text-blue-100"
          >
            {{ currentArtifact.rows.length }}
          </span>
        </button>

        <!-- New Chat Button -->
        <button
          @click="startNewSession"
          class="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs shadow-blue-500/20 shrink-0"
        >
          <Plus :size="14" />
          <span class="hidden sm:inline">Новый</span>
        </button>
      </div>
    </div>

    <!-- Main Workspace Layout (Sidebar + Chat Feed + Canvas) -->
    <div class="flex-1 flex min-h-0 relative overflow-hidden">
      <!-- Left Sidebar: Session History -->
      <aside
        v-show="isSidebarOpen"
        class="w-72 border-r border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md flex flex-col shrink-0 transition-all z-20"
      >
        <div class="p-3 border-b border-gray-100 dark:border-gray-800">
          <div class="relative">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="sessionSearch"
              type="text"
              placeholder="Поиск диалогов..."
              class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <div
            v-if="sessionsLoading"
            class="py-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2"
          >
            <Loader2 :size="18" class="animate-spin text-blue-600" />
            <span>Загрузка истории...</span>
          </div>

          <div
            v-else-if="filteredSessions.length === 0"
            class="py-8 text-center text-xs text-gray-400 px-3"
          >
            <MessageSquare :size="24" class="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <span>Диалогов не найдено</span>
          </div>

          <div
            v-for="s in filteredSessions"
            :key="s.id"
            @click="selectSession(s.id)"
            class="group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all"
            :class="currentSessionId === s.id
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium shadow-xs'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/60'"
          >
            <div class="flex items-center gap-2 min-w-0 flex-1 pr-2">
              <MessageSquare :size="14" class="shrink-0 text-gray-400 group-hover:text-blue-500" />
              <div class="min-w-0 flex-1">
                <p class="truncate leading-snug">{{ s.title }}</p>
                <span class="text-[10px] text-gray-400">{{ formatDate(s.updatedAt) }}</span>
              </div>
            </div>

            <!-- Actions (Rename / Delete) -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click.stop="openRenameModal(s)"
                class="p-1 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200/50 dark:hover:bg-gray-700"
                title="Переименовать"
              >
                <Edit3 :size="12" />
              </button>
              <button
                @click.stop="confirmDeleteSession(s.id)"
                class="p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200/50 dark:hover:bg-gray-700"
                title="Удалить"
              >
                <Trash2 :size="12" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Center Panel: Chat Feed -->
      <main
        class="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 transition-all overflow-hidden"
        :class="isCanvasFullscreen ? 'hidden' : ''"
      >
        <!-- Messages Stream -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar"
        >
          <!-- Welcome Screen (if empty) -->
          <div
            v-if="messages.length === 0"
            class="max-w-2xl mx-auto py-8 px-4 flex flex-col items-center text-center"
          >
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4 animate-bounce-subtle">
              <Sparkles :size="32" />
            </div>

            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Аналитический AI-Ассистент ATC
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-lg leading-relaxed">
              Задавайте вопросы на естественном языке. Ассистент выполнит безопасные SQL-запросы к базе данных, найдет слушателей, проверит выданные сертификаты и построит отчет.
            </p>

            <!-- Quick Action Chips -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg text-left">
              <button
                v-for="chip in quickChips"
                :key="chip.text"
                @click="sendQuickPrompt(chip.text)"
                class="p-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-blue-50/70 dark:hover:bg-blue-900/20 border border-gray-200/80 dark:border-gray-700/70 hover:border-blue-300 dark:hover:border-blue-700 rounded-2xl text-xs text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 transition-all flex items-start gap-2.5 shadow-xs"
              >
                <component :is="chip.icon" :size="16" class="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span class="leading-tight">{{ chip.text }}</span>
              </button>
            </div>
          </div>

          <!-- Message List -->
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="max-w-3xl mx-auto flex flex-col gap-2"
          >
            <!-- User Message -->
            <div
              v-if="msg.role === 'user'"
              class="flex justify-end gap-3 items-start group"
            >
              <button
                @click="rollbackMessage(msg)"
                class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs flex items-center gap-1 mt-1"
                title="Откатить текст в поле ввода"
              >
                <RotateCcw :size="13" />
                <span class="text-[10px]">Откатить</span>
              </button>

              <div class="max-w-[85%] bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-sm">
                <p class="text-sm whitespace-pre-wrap leading-relaxed">{{ msg.content }}</p>
                <span class="block text-right text-[10px] text-blue-200/80 mt-1.5">
                  {{ formatTime(msg.createdAt) }}
                </span>
              </div>
            </div>

            <!-- Assistant Message -->
            <div
              v-else
              class="flex items-start gap-3 w-full"
            >
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                <Bot :size="16" />
              </div>

              <div class="flex-1 min-w-0 bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl rounded-tl-sm p-4 text-sm text-gray-900 dark:text-gray-100 shadow-xs space-y-3">
                <!-- ReAct Reasoning Accordion -->
                <div
                  v-if="msg.steps && msg.steps.length"
                  class="rounded-xl border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 overflow-hidden text-xs"
                >
                  <button
                    @click="msg.isStepsOpen = !msg.isStepsOpen"
                    class="w-full px-3 py-2 flex items-center justify-between text-blue-700 dark:text-blue-400 font-medium hover:bg-blue-100/40 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <div class="flex items-center gap-2">
                      <Database :size="13" />
                      <span>Поиск в БД и файлах ({{ msg.steps.length }} {{ getStepWord(msg.steps.length) }})</span>
                    </div>
                    <ChevronDown
                      :size="14"
                      class="transition-transform duration-200"
                      :class="msg.isStepsOpen ? 'rotate-180' : ''"
                    />
                  </button>

                  <div
                    v-show="msg.isStepsOpen"
                    class="p-3 border-t border-blue-200/60 dark:border-blue-900/50 space-y-2.5 bg-white/50 dark:bg-gray-900/50"
                  >
                    <div
                      v-for="step in msg.steps"
                      :key="step.step"
                      class="space-y-1.5"
                    >
                      <div class="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                        <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">
                          {{ step.step }}
                        </span>
                        <span>Действие: {{ step.action }}</span>
                      </div>
                      <p v-if="step.thought" class="text-gray-600 dark:text-gray-400 text-xs italic pl-6">
                        "{{ step.thought }}"
                      </p>

                      <!-- SQL Display -->
                      <div v-if="step.input?.sql" class="pl-6">
                        <div class="flex items-center justify-between bg-gray-900 text-gray-200 px-3 py-1.5 rounded-t-lg text-[10px] font-mono">
                          <span>MySQL SELECT</span>
                          <button
                            @click="copyToClipboard(step.input.sql)"
                            class="hover:text-blue-400 flex items-center gap-1"
                          >
                            <Copy :size="11" />
                            <span>Копировать</span>
                          </button>
                        </div>
                        <pre class="bg-gray-950 text-emerald-400 p-2.5 rounded-b-lg text-[11px] font-mono overflow-x-auto custom-scrollbar"><code>{{ step.input.sql }}</code></pre>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Text Content -->
                <div class="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {{ msg.content }}
                </div>

                <!-- Certificates Widget (if present in message) -->
                <div
                  v-if="msg.certificates && msg.certificates.length"
                  class="mt-3 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-3"
                >
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <div class="flex items-center gap-2">
                      <Award class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span class="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Найдено сертификатов: {{ msg.certificates.length }} шт.
                      </span>
                    </div>

                    <!-- Batch ZIP Download Button -->
                    <button
                      v-if="msg.certificates.length > 1"
                      @click="downloadCertificatesZip(msg.certificates.map(c => c.id))"
                      class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-amber-600/20"
                    >
                      <Archive class="w-3.5 h-3.5" />
                      <span>Скачать архив (.ZIP)</span>
                    </button>
                  </div>

                  <!-- Cards Grid -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div
                      v-for="cert in msg.certificates"
                      :key="cert.id"
                      class="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between gap-2 text-xs shadow-xs"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5">
                          <span class="font-bold text-gray-900 dark:text-white truncate">№ {{ cert.certificateNumber }}</span>
                          <span class="px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 rounded-full">Выдан</span>
                        </div>
                        <p class="text-[11px] text-gray-700 dark:text-gray-300 truncate mt-0.5">{{ cert.studentName }}</p>
                        <p class="text-[10px] text-gray-400 truncate">{{ cert.courseName }}</p>
                      </div>

                      <button
                        @click="downloadCertificatePdf(cert.id, cert.certificateNumber)"
                        class="p-2 rounded-lg bg-gray-100 hover:bg-amber-100 dark:bg-gray-800 dark:hover:bg-amber-950/60 text-gray-600 hover:text-amber-700 dark:text-gray-300 dark:hover:text-amber-300 transition-colors shrink-0"
                        title="Скачать PDF"
                      >
                        <Download class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Artifact Button (Canvas trigger) -->
                <div
                  v-if="msg.artifact"
                  class="mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/70 dark:border-blue-800/70 flex items-center justify-between"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <TableIcon :size="16" />
                    </div>
                    <div class="min-w-0">
                      <h4 class="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {{ msg.artifact.title || 'Сводная аналитика' }}
                      </h4>
                      <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {{ msg.artifact.rows?.length || 0 }} записей в таблице
                      </p>
                    </div>
                  </div>

                  <button
                    @click="openArtifactInCanvas(msg.artifact)"
                    class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5"
                  >
                    <span>Открыть Canvas</span>
                    <ArrowRight :size="13" />
                  </button>
                </div>

                <span class="block text-right text-[10px] text-gray-400">
                  {{ formatTime(msg.createdAt) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div
            v-if="isGenerating"
            class="max-w-3xl mx-auto flex items-start gap-3"
          >
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <Bot :size="16" />
            </div>
            <div class="p-4 rounded-2xl rounded-tl-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
              <Loader2 :size="16" class="animate-spin text-blue-600" />
              <span>ИИ анализирует вопрос, проверяет базу данных и файлы...</span>
            </div>
          </div>
        </div>

        <!-- Input Box Area -->
        <div class="p-3 border-t border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div class="max-w-3xl mx-auto space-y-2">
            <!-- Attached File Chip (if any) -->
            <div
              v-if="attachedFile"
              class="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200/60 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300"
            >
              <FileText :size="13" />
              <span class="truncate max-w-xs">{{ attachedFile.filename }}</span>
              <button
                @click="attachedFile = null"
                class="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
              >
                <X :size="12" />
              </button>
            </div>

            <div class="flex items-end gap-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500 transition-all">
              <!-- Attach File Button -->
              <button
                @click="showAttachFileModal = true"
                class="p-2 rounded-xl text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                title="Прикрепить файл для анализа"
              >
                <Paperclip :size="18" />
              </button>

              <!-- Textarea with autogrow -->
              <textarea
                ref="promptInput"
                v-model="inputPrompt"
                @keydown.enter.exact.prevent="handleSubmit"
                rows="1"
                placeholder="Задайте вопрос или попросите найти сертификаты/слушателей... (Enter для отправки)"
                class="flex-1 bg-transparent border-0 resize-none text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 max-h-36 py-2 custom-scrollbar"
                :disabled="isGenerating"
              ></textarea>

              <!-- Send Button -->
              <button
                @click="handleSubmit"
                :disabled="!inputPrompt.trim() || isGenerating"
                class="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all shrink-0 shadow-sm shadow-blue-500/25"
                title="Отправить запрос"
              >
                <Send :size="16" />
              </button>
            </div>
            <p class="text-[10px] text-gray-400 text-center">
              Shift + Enter для переноса строки • Доступ к БД только для чтения • Защита персональных данных
            </p>
          </div>
        </div>
      </main>

      <!-- Right Panel: Interactive Canvas (Table / Chart / KPI) -->
      <section
        v-if="isCanvasOpen && currentArtifact"
        class="border-l border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col z-10 transition-all duration-300"
        :class="isCanvasFullscreen ? 'flex-1 w-full' : 'w-[520px] xl:w-[640px] shrink-0'"
      >
        <!-- Canvas Header -->
        <div class="h-13 px-4 border-b border-gray-200/80 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-gray-950/50">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <TableIcon :size="16" />
            </div>
            <div class="min-w-0">
              <h3 class="text-xs font-bold text-gray-900 dark:text-white truncate">
                {{ currentArtifact.title || 'Интерактивный холст' }}
              </h3>
              <p class="text-[10px] text-gray-400 truncate">
                {{ currentArtifact.description || 'Табличный и графический анализ' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Tabs: Table / Chart -->
            <div class="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl text-xs">
              <button
                @click="canvasTab = 'table'"
                class="px-2.5 py-1 rounded-lg font-medium transition-all"
                :class="canvasTab === 'table' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
              >
                Таблица
              </button>
              <button
                @click="canvasTab = 'chart'"
                class="px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1"
                :class="canvasTab === 'chart' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
              >
                <BarChart3 :size="12" />
                <span>График</span>
              </button>
            </div>

            <!-- Batch Certificates ZIP Download (if available in artifact) -->
            <button
              v-if="currentArtifact.certificates && currentArtifact.certificates.length > 0"
              @click="downloadCertificatesZip(currentArtifact.certificates.map(c => c.id))"
              class="p-1.5 text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Скачать все сертификаты в ZIP"
            >
              <Archive :size="16" />
            </button>

            <!-- Export to Excel -->
            <button
              @click="exportArtifactToExcel"
              class="p-1.5 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Экспорт в Excel (.xlsx)"
            >
              <FileSpreadsheet :size="16" />
            </button>

            <!-- Fullscreen toggle -->
            <button
              @click="isCanvasFullscreen = !isCanvasFullscreen"
              class="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              :title="isCanvasFullscreen ? 'Свернуть' : 'На весь экран'"
            >
              <Maximize2 v-if="!isCanvasFullscreen" :size="15" />
              <Minimize2 v-else :size="15" />
            </button>

            <!-- Close Canvas -->
            <button
              @click="isCanvasOpen = false"
              class="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Закрыть холст"
            >
              <X :size="16" />
            </button>
          </div>
        </div>

        <!-- Canvas Content Area -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <!-- KPI Summary Cards -->
          <div
            v-if="currentArtifact.summaryMetrics?.length"
            class="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            <div
              v-for="(metric, idx) in currentArtifact.summaryMetrics"
              :key="idx"
              class="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 shadow-xs"
            >
              <span class="text-[11px] font-medium text-gray-500 dark:text-gray-400 block truncate">
                {{ metric.label }}
              </span>
              <span class="text-lg font-black text-gray-900 dark:text-white mt-1 block">
                {{ metric.value }}
              </span>
            </div>
          </div>

          <!-- Tab 1: Table View -->
          <div v-show="canvasTab === 'table'" class="space-y-3">
            <!-- Table Search and Stats -->
            <div class="flex items-center justify-between gap-3">
              <div class="relative flex-1 max-w-xs">
                <Search :size="13" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="tableFilter"
                  type="text"
                  placeholder="Фильтр по строкам..."
                  class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>

              <span class="text-xs text-gray-400">
                Показано: {{ pagedRows.length }} из {{ filteredRows.length }}
              </span>
            </div>

            <!-- Table Container -->
            <div class="rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-xs">
              <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th
                        v-for="col in currentArtifact.columns"
                        :key="col.key"
                        @click="sortBy(col.key)"
                        class="p-3 cursor-pointer select-none hover:bg-gray-100/70 dark:hover:bg-gray-700/60 transition-colors whitespace-nowrap"
                      >
                        <div class="flex items-center gap-1.5">
                          <span>{{ col.label }}</span>
                          <ArrowUpDown :size="11" class="text-gray-400" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-800/80 bg-white dark:bg-gray-900">
                    <tr
                      v-for="(row, rIdx) in pagedRows"
                      :key="rIdx"
                      class="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <td
                        v-for="col in currentArtifact.columns"
                        :key="col.key"
                        class="p-3 text-gray-800 dark:text-gray-200 whitespace-nowrap"
                      >
                        {{ formatCellValue(row[col.key], col.type) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Table Pagination -->
            <div
              v-if="filteredRows.length > tablePageSize"
              class="flex items-center justify-between text-xs text-gray-500 pt-2"
            >
              <span>Страница {{ tableCurrentPage }} из {{ totalTablePages }}</span>
              <div class="flex items-center gap-1">
                <button
                  @click="tableCurrentPage = Math.max(1, tableCurrentPage - 1)"
                  :disabled="tableCurrentPage === 1"
                  class="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
                >
                  Назад
                </button>
                <button
                  @click="tableCurrentPage = Math.min(totalTablePages, tableCurrentPage + 1)"
                  :disabled="tableCurrentPage === totalTablePages"
                  class="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
                >
                  Вперед
                </button>
              </div>
            </div>
          </div>

          <!-- Tab 2: Chart View -->
          <div v-show="canvasTab === 'chart'" class="space-y-4">
            <div class="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80">
              <h4 class="text-xs font-bold text-gray-900 dark:text-white mb-3">
                {{ currentArtifact.chartSuggestion?.title || 'Графическое распределение' }}
              </h4>

              <div v-if="chartCategories.length && chartSeriesData.length">
                <DynamicBarChart
                  chart-id="ai-canvas-bar-chart"
                  :categories="chartCategories"
                  :series="[{ name: 'Значение', data: chartSeriesData }]"
                  :height="320"
                />
              </div>
              <div v-else class="py-12 text-center text-xs text-gray-400">
                Недостаточно числовых данных для построения графика
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Attach File Modal -->
    <Modal
      :is-open="showAttachFileModal"
      @close="showAttachFileModal = false"
      title="Выбор файла для передачи ИИ"
      size="md"
    >
      <div class="space-y-4">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Выберите файл из хранилища ATC Platform (приказы, списки слушателей в Excel, учебные программы), чтобы передать его содержимое в контекст запроса ИИ:
        </p>

        <div class="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar">
          <div
            v-if="filesLoading"
            class="py-6 text-center text-xs text-gray-400 flex flex-col items-center gap-2"
          >
            <Loader2 :size="18" class="animate-spin text-blue-600" />
            <span>Загрузка файлов...</span>
          </div>

          <div
            v-else-if="systemFiles.length === 0"
            class="py-6 text-center text-xs text-gray-400"
          >
            Файлы не найдены
          </div>

          <div
            v-for="file in systemFiles"
            :key="file.uuid"
            @click="selectAttachmentFile(file)"
            class="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer flex items-center justify-between text-xs transition-colors"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <FileText :size="15" class="text-blue-600 shrink-0" />
              <div class="min-w-0">
                <p class="font-medium text-gray-900 dark:text-white truncate">{{ file.filename }}</p>
                <span class="text-[10px] text-gray-400">{{ file.category }} • {{ formatFileSize(file.sizeBytes) }}</span>
              </div>
            </div>
            <button class="text-blue-600 font-semibold text-xs shrink-0">Выбрать</button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Rename Session Modal -->
    <Modal
      :is-open="showRenameModal"
      @close="showRenameModal = false"
      title="Переименовать диалог"
      size="sm"
    >
      <div class="space-y-4">
        <input
          v-model="newSessionTitle"
          type="text"
          placeholder="Новое название диалога"
          class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keydown.enter="handleRenameSession"
        />
        <div class="flex justify-end gap-2">
          <Button variant="outline" size="sm" @click="showRenameModal = false">Отмена</Button>
          <Button variant="primary" size="sm" @click="handleRenameSession">Сохранить</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  Table as TableIcon,
  Copy,
  Search,
  ArrowUpDown,
  FileSpreadsheet,
  BarChart3,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  PanelLeft,
  MessageSquare,
  ArrowRight,
  Database,
  ChevronDown,
  Paperclip,
  FileText,
  X,
  Maximize2,
  Minimize2,
  Users,
  GraduationCap,
  Building2,
  Award,
  Download,
  Archive,
  Cpu,
} from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import DynamicBarChart from '~/components/charts/DynamicBarChart.vue';
import Modal from '~/components/ui/Modal.vue';
import Button from '~/components/ui/Button.vue';

definePageMeta({
  layout: 'report-builder' as any,
});

const { authFetch } = useAuthFetch();
const notification = useNotification();

// --- Интерфейсы моделей и провайдеров ---
interface ConfiguredModelItem {
  id: string;
  name: string;
  icon: string;
  tag: string;
  isConfigured: boolean;
}

interface ConfiguredProviderGroup {
  settingId: string;
  provider: string;
  providerName: string;
  name: string;
  isDefault: boolean;
  models: ConfiguredModelItem[];
}

// --- Выбор модели из реально настроенных подключений ---
const configuredProviders = ref<ConfiguredProviderGroup[]>([]);
const loadingModels = ref(false);
const hasConfiguredProviders = ref(true);
const selectedSettingId = ref<string>('');
const selectedModel = ref<string>('gpt-4o-mini');
const modelSearchQuery = ref('');
const isModelMenuOpen = ref(false);
const modelDropdownRef = ref<HTMLElement | null>(null);

const currentSelectedProvider = computed(() => {
  return configuredProviders.value.find((g) => g.settingId === selectedSettingId.value) || null;
});

const currentSelectedModelMeta = computed(() => {
  if (currentSelectedProvider.value) {
    return currentSelectedProvider.value.models.find((m) => m.id === selectedModel.value) || null;
  }
  for (const group of configuredProviders.value) {
    const found = group.models.find((m) => m.id === selectedModel.value);
    if (found) return found;
  }
  return null;
});

const selectedModelLabel = computed(() => {
  if (currentSelectedModelMeta.value) {
    return `${currentSelectedModelMeta.value.icon} ${currentSelectedModelMeta.value.name}`;
  }
  return selectedModel.value || 'Модель ИИ';
});

const filteredProviderGroups = computed(() => {
  const query = modelSearchQuery.value.trim().toLowerCase();
  if (!query) return configuredProviders.value;

  return configuredProviders.value
    .map((group) => {
      const matchesGroup =
        group.name.toLowerCase().includes(query) ||
        group.providerName.toLowerCase().includes(query) ||
        group.provider.toLowerCase().includes(query);

      const filteredModels = group.models.filter(
        (m) =>
          matchesGroup ||
          m.name.toLowerCase().includes(query) ||
          m.id.toLowerCase().includes(query) ||
          m.tag.toLowerCase().includes(query)
      );

      return {
        ...group,
        models: filteredModels,
      };
    })
    .filter((group) => group.models.length > 0);
});

function getProviderBadgeColor(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'deepseek':
      return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
    case 'anthropic':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'gemini':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    case 'groq':
      return 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    case 'openrouter':
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    case 'mistral':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    default:
      return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
}

async function loadAvailableModels() {
  loadingModels.value = true;
  try {
    const res: any = await authFetch('/api/ai/chat/models');
    if (res?.success && res.data) {
      configuredProviders.value = res.data.providers || [];
      hasConfiguredProviders.value = res.data.hasConfiguredProviders ?? true;

      // Восстанавливаем сохраненный выбор пользователя
      const savedSetting = import.meta.client ? localStorage.getItem('atc_ai_selected_setting') : null;
      const savedModel = import.meta.client ? localStorage.getItem('atc_ai_selected_model') : null;

      let matched = false;
      if (savedSetting && savedModel) {
        const foundGroup = configuredProviders.value.find((g) => g.settingId === savedSetting);
        if (foundGroup) {
          const foundModel = foundGroup.models.find((m) => m.id === savedModel);
          if (foundModel) {
            selectedSettingId.value = savedSetting;
            selectedModel.value = savedModel;
            matched = true;
          }
        }
      }

      if (!matched && configuredProviders.value.length > 0) {
        selectedSettingId.value = res.data.defaultSettingId || configuredProviders.value[0].settingId;
        selectedModel.value = res.data.defaultModel || configuredProviders.value[0].models[0]?.id || 'gpt-4o-mini';
      }
    }
  } catch (err: any) {
    console.error('Ошибка загрузки настроенных моделей AI:', err);
  } finally {
    loadingModels.value = false;
  }
}

function selectConfiguredModel(settingId: string, modelId: string) {
  selectedSettingId.value = settingId;
  selectedModel.value = modelId;
  isModelMenuOpen.value = false;
  if (import.meta.client) {
    localStorage.setItem('atc_ai_selected_setting', settingId);
    localStorage.setItem('atc_ai_selected_model', modelId);
  }
}

// --- Выбор Effort (Reasoning Effort) ---
const effortOptions = [
  { id: 'low', name: 'Low (Быстрый)', desc: '1-2 шага, мгновенный ответ', color: 'bg-emerald-500' },
  { id: 'medium', name: 'Medium (Баланс)', desc: 'До 4 шагов, поиск в БД', color: 'bg-amber-500' },
  { id: 'high', name: 'High (Глубокий)', desc: 'До 8 шагов, детальная проверка', color: 'bg-purple-500' },
];

const selectedEffort = ref<'low' | 'medium' | 'high'>('medium');
const isEffortMenuOpen = ref(false);
const effortDropdownRef = ref<HTMLElement | null>(null);

function selectEffort(eff: string) {
  selectedEffort.value = eff as 'low' | 'medium' | 'high';
  isEffortMenuOpen.value = false;
  if (import.meta.client) {
    localStorage.setItem('atc_ai_selected_effort', eff);
  }
}

// Закрытие дропдаунов по клику вне
function handleWindowClick(e: MouseEvent) {
  const target = e.target as Node;
  if (modelDropdownRef.value && !modelDropdownRef.value.contains(target)) {
    isModelMenuOpen.value = false;
  }
  if (effortDropdownRef.value && !effortDropdownRef.value.contains(target)) {
    isEffortMenuOpen.value = false;
  }
}

// --- Состояние сессий ---
const sessions = ref<Array<{ id: string; title: string; createdAt: string; updatedAt: string }>>([]);
const sessionsLoading = ref(false);
const currentSessionId = ref<string | null>(null);
const currentSessionTitle = ref('Новый диалог');
const sessionSearch = ref('');
const isSidebarOpen = ref(true);

// --- Состояние сообщений ---
interface AgentStep {
  step: number;
  thought: string;
  action: string;
  input?: any;
  output?: any;
}

interface CertificateItem {
  id: string;
  certificateNumber: string;
  studentName: string;
  courseName: string;
  issueDate?: string;
  status?: string;
}

interface ReportArtifact {
  title: string;
  description?: string;
  columns: Array<{ key: string; label: string; type?: 'text' | 'number' | 'date' }>;
  rows: Record<string, any>[];
  summaryMetrics?: Array<{ label: string; value: string | number; change?: string }>;
  certificates?: CertificateItem[];
  chartSuggestion?: {
    type?: 'bar' | 'doughnut' | 'line';
    xKey?: string;
    yKey?: string;
    title?: string;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: AgentStep[];
  isStepsOpen?: boolean;
  artifact?: ReportArtifact;
  certificates?: CertificateItem[];
  sqlExecuted?: string;
  createdAt: string;
}

const messages = ref<ChatMessage[]>([]);
const inputPrompt = ref('');
const isGenerating = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const promptInput = ref<HTMLTextAreaElement | null>(null);

// --- Состояние Canvas ---
const isCanvasOpen = ref(false);
const isCanvasFullscreen = ref(false);
const canvasTab = ref<'table' | 'chart'>('table');
const currentArtifact = ref<ReportArtifact | null>(null);
const tableFilter = ref('');
const tableSortKey = ref('');
const tableSortAsc = ref(true);
const tableCurrentPage = ref(1);
const tablePageSize = ref(15);

// --- Прикрепление файлов ---
const showAttachFileModal = ref(false);
const systemFiles = ref<any[]>([]);
const filesLoading = ref(false);
const attachedFile = ref<{ uuid: string; filename: string } | null>(null);

// --- Модалка переименования ---
const showRenameModal = ref(false);
const renamingSessionId = ref<string | null>(null);
const newSessionTitle = ref('');

// --- Быстрые сценарии ---
const quickChips = [
  { text: 'Сколько групп сейчас в процессе обучения?', icon: Users },
  { text: 'Выгрузи все сертификаты по курсу Авиационная безопасность', icon: Award },
  { text: 'Покажи статистику слушателей по организациям', icon: Building2 },
  { text: 'Какие приказы и файлы загружены в систему?', icon: FileText },
];

// --- Вычисляемые свойства ---
const filteredSessions = computed(() => {
  if (!sessionSearch.value.trim()) return sessions.value;
  const q = sessionSearch.value.toLowerCase();
  return sessions.value.filter((s) => s.title.toLowerCase().includes(q));
});

const filteredRows = computed(() => {
  if (!currentArtifact.value?.rows) return [];
  let rows = [...currentArtifact.value.rows];

  if (tableFilter.value.trim()) {
    const q = tableFilter.value.toLowerCase();
    rows = rows.filter((r) =>
      Object.values(r).some((val) => String(val || '').toLowerCase().includes(q))
    );
  }

  if (tableSortKey.value) {
    const key = tableSortKey.value;
    rows.sort((a, b) => {
      const valA = a[key] ?? '';
      const valB = b[key] ?? '';
      if (typeof valA === 'number' && typeof valB === 'number') {
        return tableSortAsc.value ? valA - valB : valB - valA;
      }
      return tableSortAsc.value
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }

  return rows;
});

const totalTablePages = computed(() =>
  Math.max(1, Math.ceil(filteredRows.value.length / tablePageSize.value))
);

const pagedRows = computed(() => {
  const start = (tableCurrentPage.value - 1) * tablePageSize.value;
  return filteredRows.value.slice(start, start + tablePageSize.value);
});

// Данные для графика
const chartCategories = computed(() => {
  if (!currentArtifact.value?.rows || !currentArtifact.value?.chartSuggestion) return [];
  const xKey = currentArtifact.value.chartSuggestion.xKey || currentArtifact.value.columns[0]?.key;
  if (!xKey) return [];
  return currentArtifact.value.rows.slice(0, 12).map((r) => String(r[xKey] ?? ''));
});

const chartSeriesData = computed(() => {
  if (!currentArtifact.value?.rows || !currentArtifact.value?.chartSuggestion) return [];
  const yKey = currentArtifact.value.chartSuggestion.yKey || currentArtifact.value.columns[1]?.key;
  if (!yKey) return [];
  return currentArtifact.value.rows.slice(0, 12).map((r) => {
    const num = Number(r[yKey]);
    return isNaN(num) ? 0 : num;
  });
});

// --- Методы работы с сессиями ---
async function loadSessions() {
  sessionsLoading.value = true;
  try {
    const res: any = await authFetch('/api/ai/chat/sessions');
    if (res.success) {
      sessions.value = res.data;
      if (!currentSessionId.value && sessions.value.length > 0) {
        const first = sessions.value[0];
        if (first) {
          selectSession(first.id);
        }
      }
    }
  } catch (err: any) {
    notification.error(err.message || 'Не удалось загрузить диалоги');
  } finally {
    sessionsLoading.value = false;
  }
}

async function selectSession(sessionId: string) {
  currentSessionId.value = sessionId;
  const s = sessions.value.find((item) => item.id === sessionId);
  if (s) currentSessionTitle.value = s.title;

  try {
    const res: any = await authFetch(`/api/ai/chat/sessions/${sessionId}`);
    if (res.success) {
      messages.value = res.data.messages.map((m: any) => ({
        ...m,
        isStepsOpen: false,
      }));
      const lastWithArtifact = [...messages.value].reverse().find((m) => m.artifact);
      if (lastWithArtifact?.artifact) {
        currentArtifact.value = lastWithArtifact.artifact;
      }
      scrollToBottom();
    }
  } catch (err: any) {
    notification.error(err.message || 'Ошибка загрузки диалога');
  }
}

function startNewSession() {
  currentSessionId.value = null;
  currentSessionTitle.value = 'Новый диалог';
  messages.value = [];
  currentArtifact.value = null;
  isCanvasOpen.value = false;
  inputPrompt.value = '';
  attachedFile.value = null;
  nextTick(() => {
    promptInput.value?.focus();
  });
}

function openRenameModal(session: { id: string; title: string }) {
  renamingSessionId.value = session.id;
  newSessionTitle.value = session.title;
  showRenameModal.value = true;
}

async function handleRenameSession() {
  if (!renamingSessionId.value || !newSessionTitle.value.trim()) return;
  try {
    await authFetch(`/api/ai/chat/sessions/${renamingSessionId.value}`, {
      method: 'PATCH',
      body: { title: newSessionTitle.value.trim() },
    });
    const s = sessions.value.find((item) => item.id === renamingSessionId.value);
    if (s) s.title = newSessionTitle.value.trim();
    if (currentSessionId.value === renamingSessionId.value) {
      currentSessionTitle.value = newSessionTitle.value.trim();
    }
    notification.success('Диалог переименован');
    showRenameModal.value = false;
  } catch (err: any) {
    notification.error(err.message || 'Ошибка переименования');
  }
}

async function confirmDeleteSession(sessionId: string) {
  if (!confirm('Вы действительно хотите удалить этот диалог?')) return;
  try {
    await authFetch(`/api/ai/chat/sessions/${sessionId}`, { method: 'DELETE' });
    sessions.value = sessions.value.filter((s) => s.id !== sessionId);
    if (currentSessionId.value === sessionId) {
      if (sessions.value.length > 0) {
        const first = sessions.value[0];
        if (first) {
          selectSession(first.id);
        }
      } else {
        startNewSession();
      }
    }
    notification.success('Диалог удален');
  } catch (err: any) {
    notification.error(err.message || 'Ошибка удаления диалога');
  }
}

// --- Отправка запросов ---
function sendQuickPrompt(text: string) {
  inputPrompt.value = text;
  handleSubmit();
}

async function handleSubmit() {
  const text = inputPrompt.value.trim();
  if (!text || isGenerating.value) return;

  const userMsgText = text;
  inputPrompt.value = '';
  isGenerating.value = true;

  const tempUserMsgId = 'temp-' + Date.now();
  messages.value.push({
    id: tempUserMsgId,
    role: 'user',
    content: userMsgText,
    createdAt: new Date().toISOString(),
  });
  scrollToBottom();

  const fileUuid = attachedFile.value?.uuid;
  attachedFile.value = null;

  try {
    const res: any = await authFetch('/api/ai/chat/message', {
      method: 'POST',
      body: {
        sessionId: currentSessionId.value,
        message: userMsgText,
        fileAttachmentUuid: fileUuid,
        settingId: selectedSettingId.value || undefined,
        model: selectedModel.value,
        effort: selectedEffort.value,
      },
    });

    if (res.success) {
      const data = res.data;
      currentSessionId.value = data.sessionId;
      currentSessionTitle.value = data.sessionTitle;

      const idx = messages.value.findIndex((m) => m.id === tempUserMsgId);
      if (idx !== -1) {
        messages.value[idx] = data.userMessage;
      }

      messages.value.push({
        ...data.assistantMessage,
        isStepsOpen: false,
      });

      if (data.assistantMessage?.artifact) {
        currentArtifact.value = data.assistantMessage.artifact;
        isCanvasOpen.value = true;
      }

      loadSessions();
    }
  } catch (err: any) {
    notification.error(err.message || 'Ошибка генерации ответа');
  } finally {
    isGenerating.value = false;
    scrollToBottom();
  }
}

function rollbackMessage(msg: ChatMessage) {
  inputPrompt.value = msg.content;
  nextTick(() => {
    promptInput.value?.focus();
  });
  notification.info('Текст возвращен в поле ввода');
}

function openArtifactInCanvas(art: ReportArtifact) {
  currentArtifact.value = art;
  isCanvasOpen.value = true;
  canvasTab.value = 'table';
}

function sortBy(key: string) {
  if (tableSortKey.value === key) {
    tableSortAsc.value = !tableSortAsc.value;
  } else {
    tableSortKey.value = key;
    tableSortAsc.value = true;
  }
}

function formatCellValue(val: any, type?: string): string {
  if (val === null || val === undefined) return '—';
  if (type === 'number') return Number(val).toLocaleString('ru-RU');
  if (type === 'date') return new Date(val).toLocaleDateString('ru-RU');
  return String(val);
}

function exportArtifactToExcel() {
  if (!currentArtifact.value?.rows?.length) {
    notification.warning('Нет данных для экспорта');
    return;
  }

  try {
    const ws = XLSX.utils.json_to_sheet(currentArtifact.value.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Отчет');
    const filename = `${currentArtifact.value.title || 'ai-report'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    notification.success('Файл Excel успешно скачан');
  } catch (err: any) {
    notification.error('Ошибка экспорта в Excel: ' + err.message);
  }
}

// --- Скачивание сертификатов ---
function downloadCertificatePdf(certId: string, certNumber?: string) {
  const url = `/api/certificates/download/${certId}?format=pdf`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `${certNumber || 'certificate'}.pdf`;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function downloadCertificatesZip(certificateIds: string[]) {
  if (!certificateIds || !certificateIds.length) {
    notification.warning('Список сертификатов пуст');
    return;
  }

  try {
    notification.info('Формирование архива сертификатов...');
    const blob: Blob = await authFetch('/api/certificates/archive', {
      method: 'POST',
      body: { certificateIds },
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificates_archive_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    notification.success('Архив сертификатов успешно скачан!');
  } catch (err: any) {
    notification.error(err.message || 'Ошибка скачивания архива сертификатов');
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    notification.success('SQL-запрос скопирован в буфер обмена');
  } catch {
    notification.error('Не удалось скопировать в буфер');
  }
}

// --- Загрузка списка файлов для прикрепления ---
async function loadSystemFiles() {
  filesLoading.value = true;
  try {
    const res: any = await authFetch('/api/files?limit=25');
    if (res.data) {
      systemFiles.value = res.data;
    }
  } catch (err: any) {
    console.error('Ошибка загрузки файлов:', err);
  } finally {
    filesLoading.value = false;
  }
}

function selectAttachmentFile(file: any) {
  attachedFile.value = {
    uuid: file.uuid,
    filename: file.filename,
  };
  showAttachFileModal.value = false;
  notification.success(`Файл "${file.filename}" прикреплен к запросу`);
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function formatDate(d: string): string {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function formatTime(d: string): string {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getStepWord(count: number): string {
  if (count === 1) return 'шаг';
  if (count >= 2 && count <= 4) return 'шага';
  return 'шагов';
}

onMounted(() => {
  if (import.meta.client) {
    const savedEffort = localStorage.getItem('atc_ai_selected_effort');
    if (savedEffort && ['low', 'medium', 'high'].includes(savedEffort)) {
      selectedEffort.value = savedEffort as 'low' | 'medium' | 'high';
    }
    window.addEventListener('click', handleWindowClick);
  }
  loadAvailableModels();
  loadSessions();
  loadSystemFiles();
});

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('click', handleWindowClick);
  }
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.4);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
@keyframes bounceSubtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.animate-bounce-subtle {
  animation: bounceSubtle 3s ease-in-out infinite;
}
</style>
