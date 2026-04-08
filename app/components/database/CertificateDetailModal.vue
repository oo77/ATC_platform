<template>
  <UiModal
    :is-open="isOpen"
    @close="$emit('close')"
    title="Просмотр сертификата"
    size="lg"
  >
    <div v-if="certificate" class="space-y-5">

      <!-- Hero: Номер + статус -->
      <div
        class="relative overflow-hidden rounded-2xl p-5"
        :class="certificate.status === 'issued'
          ? 'bg-success/5 border border-success/20'
          : 'bg-danger/5 border border-danger/20'"
      >
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-4">
            <div
              class="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
              :class="certificate.status === 'issued' ? 'bg-success/15' : 'bg-danger/15'"
            >
              <CheckCircle v-if="certificate.status === 'issued'" class="h-6 w-6 text-success" />
              <XCircle v-else class="h-6 w-6 text-danger" />
            </div>
            <div>
              <p
                class="text-lg font-black"
                :class="certificate.status === 'issued' ? 'text-success' : 'text-danger'"
              >
                {{ certificate.status === 'issued' ? 'Сертификат действителен' : 'Сертификат отозван' }}
              </p>
              <p class="text-sm font-medium text-slate-500 mt-0.5">
                Выдан: {{ formatDate(certificate.issueDate) }}
              </p>
            </div>
          </div>

          <div class="text-right">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">№ сертификата</p>
            <span class="font-mono text-xl font-black text-primary">
              {{ certificate.certificateNumber }}
            </span>
          </div>
        </div>

        <!-- Source badge -->
        <div class="mt-3 flex items-center gap-2 flex-wrap">
          <span
            v-if="certificate.sourceType === 'import' && certificate.importSource === 'ai'"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20"
          >
            <Zap class="w-3 h-3" />
            AI Импорт
            <span v-if="certificate.aiConfidence">· {{ Math.round(certificate.aiConfidence * 100) }}%</span>
          </span>
          <span
            v-else-if="certificate.sourceType === 'import'"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-success/5 text-success border border-success/20"
          >
            <FileSpreadsheet class="w-3 h-3" />
            Импортирован из Excel
          </span>
          <span
            v-else-if="certificate.sourceType === 'manual'"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20"
          >
            <PenLine class="w-3 h-3" />
            Добавлен вручную
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-primary/5 text-primary border border-primary/15"
          >
            <ClipboardList class="w-3 h-3" />
            Из журнала группы
          </span>

          <span
            v-if="certificate.hasWarnings"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-warning/5 text-warning border border-warning/20"
          >
            <AlertTriangle class="w-3 h-3" />
            Выдан с предупреждениями
          </span>
        </div>
      </div>

      <!-- Причина отзыва -->
      <div
        v-if="certificate.status === 'revoked' && certificate.revokeReason"
        class="p-4 bg-danger/5 border border-danger/20 rounded-xl"
      >
        <p class="font-bold text-danger flex items-center gap-2 mb-2">
          <AlertTriangle class="w-4 h-4" />
          Причина отзыва
        </p>
        <p class="text-sm text-slate-700 dark:text-slate-300 font-medium">{{ certificate.revokeReason }}</p>
        <p class="text-xs text-slate-400 mt-2 font-medium">
          Дата отзыва: {{ formatDate(certificate.revokedAt) }}
        </p>
      </div>

      <!-- Cards Grid: Слушатель + Курс -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Слушатель -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <div class="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <User class="w-4 h-4" />
            </div>
            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Слушатель</h4>
          </div>
          <div class="p-5 space-y-3">
            <InfoRow label="ФИО" :value="certificate.student.fullName" bold />
            <InfoRow v-if="certificate.student.pinfl" label="ПИНФЛ" :value="certificate.student.pinfl" mono />
            <InfoRow v-if="certificate.student.organization" label="Организация" :value="certificate.student.organization" />
            <InfoRow v-if="certificate.student.position" label="Должность" :value="certificate.student.position" />
          </div>
        </div>

        <!-- Курс -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <div class="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen class="w-4 h-4" />
            </div>
            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Учебный курс</h4>
          </div>
          <div class="p-5 space-y-3">
            <InfoRow label="Название" :value="certificate.course?.name || 'Не указан'" bold />
            <InfoRow v-if="certificate.course?.code" label="Код курса" :value="certificate.course.code" mono />
            <InfoRow v-if="certificate.course?.hours" label="Часов" :value="`${certificate.course.hours} ч.`" />
            <InfoRow
              label="Группа"
              :value="certificate.group?.code || (certificate.sourceType !== 'group_journal' ? 'Без группы' : '')"
              :mono="!!certificate.group?.code"
              :muted="!certificate.group?.code"
            />
            <InfoRow v-if="certificate.expiryDate" label="Действителен до" :value="formatDate(certificate.expiryDate)" />
          </div>
        </div>
      </div>

      <!-- Информация о выдаче -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
        <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <div class="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <FileCheck class="w-4 h-4" />
          </div>
          <h4 class="font-bold text-slate-900 dark:text-white text-sm">Сведения о выдаче</h4>
        </div>
        <div class="p-5 grid grid-cols-2 gap-4">
          <InfoRow
            label="Шаблон"
            :value="certificate.template?.name || 'Без шаблона'"
            :muted="!certificate.template"
          />
          <InfoRow v-if="certificate.issuedBy" label="Выдал" :value="certificate.issuedBy.name" />
          <InfoRow v-if="certificate.issuedAt" label="Дата и время выдачи" :value="formatDateTime(certificate.issuedAt)" />
          <InfoRow label="Создано в системе" :value="formatDateTime(certificate.createdAt)" />
          <div v-if="certificate.notes" class="col-span-2">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Примечания</p>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ certificate.notes }}</p>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <UiButton variant="outline" @click="$emit('close')">
          Закрыть
        </UiButton>
        <a
          v-if="certificate.id"
          :href="`/api/certificates/download/${certificate.id}`"
          target="_blank"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm text-white font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
        >
          <Download class="h-4 w-4" />
          Скачать PDF
        </a>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import {
  CheckCircle, XCircle, AlertTriangle, User, BookOpen, FileCheck,
  Download, Zap, FileSpreadsheet, PenLine, ClipboardList,
} from 'lucide-vue-next';

// Inline row component for clean repetition
const InfoRow = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, default: '—' },
    bold: { type: Boolean, default: false },
    mono: { type: Boolean, default: false },
    muted: { type: Boolean, default: false },
  },
  setup(props) {
    return () => h('div', {}, [
      h('p', { class: 'text-xs font-bold text-slate-400 uppercase tracking-widest mb-1' }, props.label),
      h('p', {
        class: [
          'text-sm',
          props.bold ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300',
          props.mono ? 'font-mono' : '',
          props.muted ? 'text-slate-400 italic' : '',
        ].filter(Boolean).join(' '),
      }, props.value || '—'),
    ]);
  },
});

interface Props {
  certificate: any;
  isOpen: boolean;
}

defineProps<Props>();
defineEmits<{ close: [] }>();

function formatDate(date: string | Date): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(date: string | Date): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
</script>
