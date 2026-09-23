<template>
  <div class="rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/10 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-amber-200/60 dark:border-amber-900/40">
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
          <Award class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <div class="text-xs font-bold text-amber-950 dark:text-amber-100 leading-tight">
            {{ certificates.length }} {{ plural(certificates.length, 'сертификат', 'сертификата', 'сертификатов') }}
          </div>
          <div class="text-[10px] text-amber-700/80 dark:text-amber-300/70 leading-tight">
            действующих: {{ activeCount }}<span v-if="expiredCount"> · истёк срок: {{ expiredCount }}</span><span v-if="revokedCount"> · отозвано: {{ revokedCount }}</span>
          </div>
        </div>
      </div>
      <button
        v-if="certificates.length > 1"
        :disabled="zipLoading"
        class="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-amber-600/20 shrink-0"
        @click="downloadZip"
      >
        <Loader2 v-if="zipLoading" class="w-3.5 h-3.5 animate-spin" />
        <Archive v-else class="w-3.5 h-3.5" />
        <span>ZIP ({{ certificates.length }})</span>
      </button>
    </div>

    <!-- Cards -->
    <div class="p-2 grid gap-1.5" :class="compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'">
      <div
        v-for="cert in visible"
        :key="cert.id"
        class="group p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-amber-100 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-800 flex items-start gap-2.5 transition-colors"
      >
        <div
          class="w-1 self-stretch rounded-full shrink-0"
          :class="statusOf(cert).bar"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-mono text-[11px] font-bold text-gray-900 dark:text-white">№ {{ cert.certificateNumber }}</span>
            <span class="px-1.5 py-px text-[9px] font-semibold rounded-full" :class="statusOf(cert).badge">
              {{ statusOf(cert).label }}
            </span>
          </div>
          <p class="text-[12px] font-semibold text-gray-800 dark:text-gray-100 truncate mt-0.5" :title="cert.studentName">
            {{ cert.studentName }}
          </p>
          <p class="text-[10.5px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug" :title="cert.courseName">
            {{ cert.courseName }}
          </p>
          <div class="flex items-center gap-2.5 mt-1 text-[10px] text-gray-400">
            <span v-if="cert.issueDate" class="flex items-center gap-1"><CalendarCheck class="w-3 h-3" />{{ fmtDate(cert.issueDate) }}</span>
            <span v-if="cert.expiryDate" class="flex items-center gap-1"><CalendarClock class="w-3 h-3" />до {{ fmtDate(cert.expiryDate) }}</span>
          </div>
        </div>
        <button
          class="p-2 rounded-lg bg-gray-50 hover:bg-amber-100 dark:bg-gray-800 dark:hover:bg-amber-950/60 text-gray-500 hover:text-amber-700 dark:text-gray-300 dark:hover:text-amber-300 transition-colors shrink-0"
          title="Скачать PDF"
          @click="downloadPdf(cert)"
        >
          <Download class="w-4 h-4" />
        </button>
      </div>
    </div>

    <button
      v-if="certificates.length > limit"
      class="w-full py-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 border-t border-amber-200/60 dark:border-amber-900/40 transition-colors"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Свернуть' : `Показать все (${certificates.length})` }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Award, Archive, Download, Loader2, CalendarCheck, CalendarClock } from 'lucide-vue-next';
import type { AiCertificateItem } from '~/types/aiChat';

const props = withDefaults(defineProps<{ certificates: AiCertificateItem[]; compact?: boolean }>(), { compact: false });

const { authFetch } = useAuthFetch();
const notification = useNotification();

const expanded = ref(false);
const zipLoading = ref(false);
const limit = computed(() => (props.compact ? 3 : 6));
const visible = computed(() => (expanded.value ? props.certificates : props.certificates.slice(0, limit.value)));

const today = new Date().toISOString().slice(0, 10);
function statusOf(c: AiCertificateItem) {
  if (c.status === 'revoked') {
    return { label: 'Отозван', badge: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300', bar: 'bg-red-400' };
  }
  if (c.expiryDate && c.expiryDate < today) {
    return { label: 'Истёк', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300', bar: 'bg-gray-300 dark:bg-gray-600' };
  }
  return { label: 'Действует', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300', bar: 'bg-emerald-400' };
}
const revokedCount = computed(() => props.certificates.filter((c) => c.status === 'revoked').length);
const expiredCount = computed(() => props.certificates.filter((c) => c.status !== 'revoked' && c.expiryDate && c.expiryDate < today).length);
const activeCount = computed(() => props.certificates.length - revokedCount.value - expiredCount.value);

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

function fmtDate(d: string) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString('ru-RU');
}

function downloadPdf(cert: AiCertificateItem) {
  const a = document.createElement('a');
  a.href = `/api/certificates/download/${cert.id}?format=pdf`;
  a.download = `${cert.certificateNumber || 'certificate'}.pdf`;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function downloadZip() {
  zipLoading.value = true;
  try {
    const blob: Blob = await authFetch('/api/certificates/archive', {
      method: 'POST',
      body: { certificateIds: props.certificates.map((c) => c.id) },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificates_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    notification.success('Архив сертификатов скачан');
  } catch (err: any) {
    notification.error(err?.data?.message || err.message || 'Ошибка скачивания архива');
  } finally {
    zipLoading.value = false;
  }
}
</script>
