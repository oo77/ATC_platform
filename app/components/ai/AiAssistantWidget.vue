<template>
  <ClientOnly>
    <div v-if="isVisible" class="fixed bottom-5 right-5 z-[60] print:hidden">
      <!-- Launcher -->
      <Transition name="ai-pop">
        <button
          v-if="!isOpen"
          class="group relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          title="AI Ассистент"
          @click="openPanel"
        >
          <Sparkles class="w-6 h-6" />
          <span class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-600" />
          <span class="absolute right-full mr-3 px-2.5 py-1 rounded-lg bg-gray-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            AI Ассистент
          </span>
        </button>
      </Transition>

      <!-- Panel -->
      <Transition name="ai-panel">
        <section
          v-if="isOpen"
          class="flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 shadow-2xl shadow-gray-900/15 dark:shadow-black/40 transition-[width,height] duration-300"
          :style="panelStyle"
        >
          <!-- Header -->
          <header class="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles class="w-4.5 h-4.5" />
                <span
                  class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900"
                  :class="dbOnline ? 'bg-emerald-500' : 'bg-red-500'"
                />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <h3 class="text-sm font-bold text-gray-900 dark:text-white">AI Ассистент</h3>
                  <span class="px-1.5 py-px rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">SQL</span>
                </div>
                <p class="text-[11px] font-medium" :class="dbOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'">
                  {{ isGenerating ? statusText : dbOnline ? 'База данных подключена' : 'Нет связи с сервером' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-0.5 text-gray-400">
              <button class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200" title="Новый диалог" @click="resetChat">
                <RotateCcw class="w-4 h-4" />
              </button>
              <button class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200" :title="isExpanded ? 'Уменьшить' : 'Развернуть'" @click="isExpanded = !isExpanded">
                <Minimize2 v-if="isExpanded" class="w-4 h-4" />
                <Maximize2 v-else class="w-4 h-4" />
              </button>
              <button class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200" title="Открыть в полноэкранном чате" @click="openFullChat">
                <ArrowUpRight class="w-4 h-4" />
              </button>
              <button class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200" title="Закрыть" @click="isOpen = false">
                <X class="w-4 h-4" />
              </button>
            </div>
          </header>

          <!-- Body -->
          <div class="relative flex-1 min-h-0">
            <div ref="scrollRef" class="absolute inset-0 overflow-y-auto px-3.5 py-4 space-y-3 ai-scroll">
              <!-- Welcome -->
              <div class="flex">
                <div class="max-w-[88%] px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700/60 text-[13px] text-gray-700 dark:text-gray-200 leading-relaxed">
                  Здравствуйте! Я ИИ-ассистент с прямым доступом к базе данных. Найду слушателя, сертификаты или построю статистику. Чем помочь?
                </div>
              </div>

              <template v-for="msg in messages" :key="msg.id">
                <div v-if="msg.role === 'user'" class="flex justify-end">
                  <div class="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-tr-md bg-gradient-to-br from-indigo-600 to-blue-600 text-white text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm shadow-indigo-500/20">
                    {{ msg.content }}
                  </div>
                </div>
                <div v-else class="flex">
                  <div class="w-full min-w-0 px-3.5 py-3 rounded-2xl rounded-tl-md bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700/60">
                    <AiMessageBody :message="msg" :compact="!isExpanded" :show-steps="isExpanded" @open-artifact="openArtifact" />
                  </div>
                </div>
              </template>

              <!-- Live progress -->
              <div v-if="isGenerating" class="flex">
                <div class="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400 space-y-1.5 min-w-[60%]">
                  <div class="flex items-center gap-2">
                    <Loader2 class="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>{{ statusText }}</span>
                    <span class="ml-auto tabular-nums text-[10px] text-gray-400">{{ elapsed }} с</span>
                  </div>
                  <div v-for="s in liveSteps" :key="s.step" class="flex items-center gap-1.5 text-[11px] pl-5">
                    <Check class="w-3 h-3 text-emerald-500" />
                    <span class="truncate">{{ s.thought || s.action }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Artifact sheet -->
            <Transition name="ai-sheet">
              <div v-if="artifact" class="absolute inset-0 bg-white dark:bg-gray-900 flex flex-col z-10">
                <div class="px-3.5 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 shrink-0">
                  <button class="p-1 rounded-lg text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800" @click="artifact = null">
                    <ArrowLeft class="w-4 h-4" />
                  </button>
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-bold text-gray-900 dark:text-white truncate">{{ artifact.title }}</div>
                    <div class="text-[10px] text-gray-400">{{ artifact.rows.length }} записей</div>
                  </div>
                  <div class="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-[11px]">
                    <button
                      class="px-2 py-0.5 rounded-md font-medium"
                      :class="sheetTab === 'chart' ? 'bg-white dark:bg-gray-700 shadow-xs text-gray-900 dark:text-white' : 'text-gray-500'"
                      @click="sheetTab = 'chart'"
                    >График</button>
                    <button
                      class="px-2 py-0.5 rounded-md font-medium"
                      :class="sheetTab === 'table' ? 'bg-white dark:bg-gray-700 shadow-xs text-gray-900 dark:text-white' : 'text-gray-500'"
                      @click="sheetTab = 'table'"
                    >Таблица</button>
                  </div>
                </div>
                <div class="flex-1 overflow-auto p-3 ai-scroll">
                  <AiChartView v-if="sheetTab === 'chart'" :artifact="artifact" />
                  <div v-else class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-auto">
                    <table class="w-full text-[11px]">
                      <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                          <th v-for="c in artifact.columns" :key="c.key" class="px-2.5 py-2 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ c.label }}</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                        <tr v-for="(row, i) in artifact.rows.slice(0, 200)" :key="i" class="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20">
                          <td v-for="c in artifact.columns" :key="c.key" class="px-2.5 py-1.5 text-gray-800 dark:text-gray-200" :class="c.type === 'number' ? 'text-right tabular-nums' : ''">
                            {{ formatCell(row[c.key], c.type) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Quick chips -->
          <div v-if="!artifact" class="px-3 py-2 border-t border-gray-100 dark:border-gray-800 flex gap-1.5 overflow-x-auto ai-scroll-x shrink-0">
            <button
              v-for="chip in chips"
              :key="chip"
              :disabled="isGenerating"
              class="px-3 py-1.5 rounded-full text-[11.5px] whitespace-nowrap border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300 disabled:opacity-50 transition-colors"
              @click="send(chip)"
            >
              {{ chip }}
            </button>
          </div>

          <!-- Input -->
          <form class="p-3 pt-1.5 shrink-0" @submit.prevent="send()">
            <div class="flex items-end gap-2 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/25 focus-within:border-indigo-400 transition-all">
              <textarea
                ref="inputRef"
                v-model="input"
                rows="1"
                :disabled="isGenerating"
                placeholder="Спросите по базе данных..."
                class="flex-1 bg-transparent border-0 resize-none text-[13px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 py-1.5 max-h-28 ai-scroll"
                @keydown.enter.exact.prevent="send()"
                @input="autoGrow"
              />
              <button
                v-if="isGenerating"
                type="button"
                class="mb-0.5 w-8 h-8 rounded-full bg-gray-900 hover:bg-red-600 dark:bg-gray-100 dark:hover:bg-red-500 text-white dark:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors shrink-0"
                title="Остановить запрос (Esc)"
                @click="stop"
              >
                <Square class="w-3.5 h-3.5 fill-current" />
              </button>
              <button
                v-else
                type="submit"
                :disabled="!input.trim()"
                class="mb-0.5 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <SendHorizontal class="w-4 h-4" />
              </button>
            </div>
          </form>
        </section>
      </Transition>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2,
  ArrowUpRight,
  ArrowLeft,
  X,
  Loader2,
  Check,
  SendHorizontal,
  Square,
} from 'lucide-vue-next';
import AiMessageBody from './AiMessageBody.vue';
import AiChartView from './AiChartView.vue';
import type { AiAgentStep, AiChatMessage, AiReportArtifact } from '~/types/aiChat';

const SESSION_KEY = 'atc_ai_widget_session';

const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const { authFetch } = useAuthFetch();
const { sendAiMessage, isAbortError } = useAiChatStream();
let abortController: AbortController | null = null;

const isVisible = computed(() => !!user.value && user.value.role !== 'STUDENT' && !route.path.startsWith('/chat'));

const isOpen = ref(false);
const isExpanded = ref(false);
const messages = ref<AiChatMessage[]>([]);
const input = ref('');
const isGenerating = ref(false);
const statusText = ref('');
const liveSteps = ref<AiAgentStep[]>([]);
const dbOnline = ref(true);
const sessionId = ref<string | null>(null);
const artifact = ref<AiReportArtifact | null>(null);
const sheetTab = ref<'chart' | 'table'>('chart');
const scrollRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);
const elapsed = ref('0.0');
let timer: ReturnType<typeof setInterval> | null = null;
let historyLoaded = false;

const chips = [
  'Сколько слушателей завершили курс?',
  'Активные группы на этой неделе',
  'Статистика слушателей по организациям',
  'Сертификаты, истекающие в течение 60 дней',
  'Динамика выдачи сертификатов по месяцам',
];

const panelStyle = computed(() =>
  isExpanded.value
    ? { width: 'min(760px, calc(100vw - 2.5rem))', height: 'min(86vh, 900px)' }
    : { width: 'min(400px, calc(100vw - 2.5rem))', height: 'min(620px, calc(100vh - 6rem))' },
);

function readStored(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function openPanel() {
  isOpen.value = true;
  await loadHistory();
  scrollToBottom();
  nextTick(() => inputRef.value?.focus());
}

async function loadHistory() {
  if (historyLoaded) return;
  historyLoaded = true;
  const stored = readStored(SESSION_KEY);
  if (!stored) return;
  try {
    const res: any = await authFetch(`/api/ai/chat/sessions/${stored}`);
    if (res?.success) {
      sessionId.value = stored;
      messages.value = res.data.messages.slice(-20);
    }
  } catch {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }
}

function resetChat() {
  messages.value = [];
  sessionId.value = null;
  artifact.value = null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  nextTick(() => inputRef.value?.focus());
}

function openFullChat() {
  isOpen.value = false;
  router.push(sessionId.value ? `/chat?session=${sessionId.value}` : '/chat');
}

function openArtifact(a: AiReportArtifact) {
  artifact.value = a;
  sheetTab.value = a.chartSuggestion ? 'chart' : 'table';
  if (a.chartSuggestion) isExpanded.value = true;
}

function autoGrow(e: Event) {
  const el = e.target as HTMLTextAreaElement;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 112) + 'px';
}

function scrollToBottom() {
  nextTick(() => {
    if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
  });
}

async function send(text?: string) {
  const message = (text ?? input.value).trim();
  if (!message || isGenerating.value) return;
  input.value = '';
  if (inputRef.value) inputRef.value.style.height = 'auto';
  artifact.value = null;

  const tempId = 'tmp-' + Date.now();
  messages.value.push({ id: tempId, role: 'user', content: message, createdAt: new Date().toISOString() });
  isGenerating.value = true;
  statusText.value = 'Отправляю запрос…';
  liveSteps.value = [];
  const started = Date.now();
  elapsed.value = '0.0';
  timer = setInterval(() => (elapsed.value = ((Date.now() - started) / 1000).toFixed(1)), 100);
  scrollToBottom();
  abortController = new AbortController();

  try {
    const data = await sendAiMessage(
      {
        sessionId: sessionId.value,
        message,
        effort: 'low',
        settingId: readStored('atc_ai_selected_setting') || undefined,
        model: readStored('atc_ai_selected_model') || undefined,
      },
      {
        onStatus: (t) => (statusText.value = t),
        onStep: (s) => {
          liveSteps.value = [...liveSteps.value, s];
          scrollToBottom();
        },
        onSession: (s) => {
          sessionId.value = s.sessionId;
          try {
            localStorage.setItem(SESSION_KEY, s.sessionId);
          } catch {
            /* ignore */
          }
        },
      },
      abortController.signal,
    );
    dbOnline.value = true;
    sessionId.value = data.sessionId;
    try {
      localStorage.setItem(SESSION_KEY, data.sessionId);
    } catch {
      /* ignore */
    }
    const idx = messages.value.findIndex((m) => m.id === tempId);
    if (idx !== -1) messages.value[idx] = data.userMessage;
    messages.value.push(data.assistantMessage);
  } catch (err: any) {
    if (isAbortError(err)) {
      messages.value.push({
        id: 'stopped-' + Date.now(),
        role: 'assistant',
        content: '⏹ *Запрос остановлен.*',
        createdAt: new Date().toISOString(),
      });
      if (!input.value) input.value = message;
      return;
    }
    dbOnline.value = !/fetch|network|сет/i.test(err?.message || '');
    messages.value.push({
      id: 'err-' + Date.now(),
      role: 'assistant',
      content: `⚠️ ${err?.data?.message || err?.message || 'Не удалось получить ответ'}`,
      createdAt: new Date().toISOString(),
    });
  } finally {
    if (timer) clearInterval(timer);
    timer = null;
    abortController = null;
    isGenerating.value = false;
    scrollToBottom();
    nextTick(() => inputRef.value?.focus());
  }
}

function formatCell(v: any, type?: string) {
  if (v === null || v === undefined || v === '') return '—';
  if (type === 'number') return Number(v).toLocaleString('ru-RU');
  if (type === 'date') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('ru-RU');
  }
  return String(v);
}

function stop() {
  abortController?.abort();
}

// Esc: останавливает генерацию, затем закрывает артефакт / панель
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !isOpen.value) return;
  if (isGenerating.value) stop();
  else if (artifact.value) artifact.value = null;
  else isOpen.value = false;
}
watch(isOpen, (open) => {
  if (open) window.addEventListener('keydown', onKey);
  else window.removeEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  if (timer) clearInterval(timer);
  abortController?.abort();
});
</script>

<style scoped>
.ai-scroll::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.ai-scroll::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 9999px;
}
.ai-scroll-x {
  scrollbar-width: none;
}
.ai-scroll-x::-webkit-scrollbar {
  display: none;
}
.ai-pop-enter-active,
.ai-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.ai-pop-enter-from,
.ai-pop-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
.ai-panel-enter-active,
.ai-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: bottom right;
}
.ai-panel-enter-from,
.ai-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
.ai-sheet-enter-active,
.ai-sheet-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.ai-sheet-enter-from,
.ai-sheet-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
