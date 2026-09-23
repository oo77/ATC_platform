<template>
  <div class="space-y-3">
    <!-- Шаги агента -->
    <div
      v-if="showSteps && message.steps?.length"
      class="rounded-xl border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 overflow-hidden text-xs"
    >
      <button
        class="w-full px-3 py-1.5 flex items-center justify-between text-blue-700 dark:text-blue-400 font-medium hover:bg-blue-100/40 dark:hover:bg-blue-900/40 transition-colors"
        @click="stepsOpen = !stepsOpen"
      >
        <div class="flex items-center gap-2 min-w-0">
          <Database class="w-3.5 h-3.5 shrink-0" />
          <span class="truncate">{{ stepsTitle }}</span>
        </div>
        <ChevronDown class="w-3.5 h-3.5 transition-transform duration-200 shrink-0" :class="stepsOpen ? 'rotate-180' : ''" />
      </button>
      <div v-show="stepsOpen" class="p-3 border-t border-blue-200/60 dark:border-blue-900/50 space-y-2.5 bg-white/50 dark:bg-gray-900/50">
        <div v-for="step in message.steps" :key="step.step" class="space-y-1.5">
          <div class="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
            <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">{{ step.step }}</span>
            <span>{{ actionLabel(step.action) }}</span>
            <span v-if="step.output?.error" class="text-red-500 font-normal truncate">— ошибка, исправлено</span>
            <span v-else-if="step.output?.rowCount !== undefined" class="text-gray-400 font-normal">— {{ step.output.rowCount }} строк</span>
            <span v-else-if="step.output?.found !== undefined" class="text-gray-400 font-normal">— найдено {{ step.output.found }}</span>
            <span v-if="step.ms !== undefined" class="text-gray-400 font-normal ml-auto">{{ step.ms }} мс</span>
          </div>
          <p v-if="step.thought" class="text-gray-600 dark:text-gray-400 text-[11px] italic pl-6">{{ step.thought }}</p>
          <div v-if="step.input?.sql" class="pl-6">
            <div class="flex items-center justify-between bg-gray-900 text-gray-300 px-3 py-1 rounded-t-lg text-[10px] font-mono">
              <span>SQL</span>
              <button class="hover:text-blue-400 flex items-center gap-1" @click="copy(step.input.sql)">
                <Copy class="w-3 h-3" /><span>Копировать</span>
              </button>
            </div>
            <pre class="bg-gray-950 text-emerald-400 p-2.5 rounded-b-lg text-[10.5px] font-mono overflow-x-auto whitespace-pre-wrap break-all"><code>{{ step.input.sql }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Текст (markdown) -->
    <AiMarkdown :content="message.content" :compact="compact" class="text-gray-800 dark:text-gray-200" />

    <!-- Карточки слушателей -->
    <AiStudentCards v-if="students.length" :students="students" :compact="compact" />

    <!-- Сертификаты -->
    <AiCertificateList v-else-if="certificates.length" :certificates="certificates" :compact="compact" />

    <!-- Артефакт (таблица/график) -->
    <div
      v-if="artifact && !students.length && !(certificates.length && (compact || certificates.length <= 3))"
      class="p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/70 dark:border-blue-800/70 flex items-center justify-between gap-2"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
          <BarChart3 v-if="artifact.chartSuggestion" class="w-4 h-4" />
          <TableIcon v-else class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <h4 class="text-xs font-bold text-gray-900 dark:text-white truncate">{{ artifact.title || 'Сводная аналитика' }}</h4>
          <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {{ rowsLabel }}<span v-if="artifact.chartSuggestion"> · таблица и график</span>
          </p>
        </div>
      </div>
      <button
        class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5 shrink-0"
        @click="$emit('open-artifact', artifact)"
      >
        <span>{{ compact ? 'Открыть' : 'Открыть Canvas' }}</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </button>
    </div>

    <div class="flex items-center justify-end gap-2 text-[10px] text-gray-400">
      <span
        v-if="message.meta"
        class="flex items-center gap-1"
        :title="message.meta.fastPath ? 'Ответ получен напрямую из БД без обращения к LLM' : `Вызовов модели: ${message.meta.llmCalls}`"
      >
        <Zap class="w-3 h-3" :class="message.meta.fastPath ? 'text-emerald-500' : 'text-amber-500'" />
        {{ formatDuration(message.meta.durationMs) }}{{ message.meta.fastPath ? ' · мгновенно' : '' }}
      </span>
      <span>{{ formatTime(message.createdAt) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Database, ChevronDown, Copy, ArrowRight, BarChart3, Table as TableIcon, Zap } from 'lucide-vue-next';
import AiMarkdown from './AiMarkdown.vue';
import AiStudentCards from './AiStudentCards.vue';
import AiCertificateList from './AiCertificateList.vue';
import type { AiChatMessage, AiReportArtifact } from '~/types/aiChat';

const props = withDefaults(defineProps<{ message: AiChatMessage; compact?: boolean; showSteps?: boolean }>(), {
  compact: false,
  showSteps: true,
});
defineEmits<{ (e: 'open-artifact', artifact: AiReportArtifact): void }>();

const notification = useNotification();
const stepsOpen = ref(false);

const artifact = computed(() => (props.message.artifact?.rows?.length ? props.message.artifact : null));
const students = computed(() => props.message.students || props.message.artifact?.students || []);
const certificates = computed(() => props.message.certificates || props.message.artifact?.certificates || []);

const ACTIONS: Record<string, string> = {
  report: 'Отчёт по SQL-запросу',
  execute_sql: 'SQL-запрос к базе',
  query: 'SQL-запрос к базе',
  find_students: 'Поиск слушателей',
  find_certificates: 'Поиск сертификатов',
  search_files: 'Поиск файлов',
  read_file: 'Чтение файла',
  read_file_content: 'Чтение файла',
  resolve_students_by_names: 'Поиск слушателей',
};
const actionLabel = (a: string) => ACTIONS[a] || a;

const rowsLabel = computed(() => {
  const n = artifact.value?.rows?.length || 0;
  const m10 = n % 10;
  const m100 = n % 100;
  const word = m10 === 1 && m100 !== 11 ? 'запись' : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? 'записи' : 'записей';
  return `${n} ${word}`;
});

const stepsTitle = computed(() => {
  const n = props.message.steps?.length || 0;
  const word = n === 1 ? 'шаг' : n >= 2 && n <= 4 ? 'шага' : 'шагов';
  return `Работа с БД (${n} ${word})`;
});

function formatDuration(ms: number) {
  return ms < 1000 ? `${ms} мс` : `${(ms / 1000).toFixed(1)} с`;
}
function formatTime(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    notification.success('SQL скопирован');
  } catch {
    notification.error('Не удалось скопировать');
  }
}
</script>
