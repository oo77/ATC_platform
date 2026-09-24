<template>
  <div class="space-y-2">
    <div
      v-for="s in visible"
      :key="s.id"
      class="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-900 overflow-hidden shadow-xs"
    >
      <div class="p-3 flex items-start gap-3">
        <!-- Photo / initials -->
        <div class="relative shrink-0">
          <img
            v-if="isMounted && s.photoUrl && !brokenPhotos[s.id]"
            :src="s.photoUrl"
            :alt="s.fullName"
            loading="lazy"
            class="rounded-xl object-cover bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700"
            :class="compact ? 'w-11 h-14' : 'w-14 h-[72px]'"
            @error="brokenPhotos[s.id] = true"
          />
          <div
            v-else
            class="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center"
            :class="compact ? 'w-11 h-14 text-sm' : 'w-14 h-[72px] text-base'"
          >
            {{ initials(s.fullName) }}
          </div>
          <span
            v-if="hasActiveGroup(s)"
            class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900"
            title="Сейчас обучается"
          />
        </div>

        <!-- Info -->
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <h4 class="text-[13px] font-bold text-gray-900 dark:text-white leading-snug">
              {{ s.fullName }}
            </h4>
            <span
              v-if="s.confidence < 100"
              class="px-1.5 py-px text-[9px] font-semibold rounded-full shrink-0"
              :class="s.confidence >= 90
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'"
              title="Степень совпадения с запросом"
            >
              {{ s.confidence }}%
            </span>
          </div>

          <div class="mt-1 space-y-0.5 text-[11px] text-gray-600 dark:text-gray-400">
            <p v-if="s.organization" class="flex items-center gap-1.5 truncate">
              <Building2 class="w-3 h-3 shrink-0 text-gray-400" />
              <span class="truncate">{{ s.organization }}</span>
            </p>
            <p v-if="s.position" class="flex items-center gap-1.5 truncate">
              <Briefcase class="w-3 h-3 shrink-0 text-gray-400" />
              <span class="truncate" :title="s.position">{{ s.position }}</span>
            </p>
            <p v-if="s.pinfl" class="flex items-center gap-1.5 font-mono text-[10.5px]">
              <Fingerprint class="w-3 h-3 shrink-0 text-gray-400" />
              {{ s.pinfl }}
            </p>
          </div>

          <div class="mt-2 flex items-center gap-1.5 flex-wrap">
            <span class="px-2 py-0.5 rounded-lg text-[10.5px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 flex items-center gap-1">
              <Users class="w-3 h-3" /> {{ s.groupsCount }} {{ plural(s.groupsCount, 'группа', 'группы', 'групп') }}
            </span>
            <span class="px-2 py-0.5 rounded-lg text-[10.5px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 flex items-center gap-1">
              <Award class="w-3 h-3" /> {{ s.certificatesCount }} {{ plural(s.certificatesCount, 'сертификат', 'сертификата', 'сертификатов') }}
            </span>
            <NuxtLink
              :to="`/students/${s.id}`"
              class="ml-auto px-2 py-0.5 rounded-lg text-[10.5px] font-semibold text-gray-600 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 transition-colors"
            >
              Профиль <ExternalLink class="w-3 h-3" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Details: groups + certificates -->
      <template v-if="s.groups.length || s.certificates.length">
        <button
          class="w-full px-3 py-1.5 border-t border-gray-100 dark:border-gray-800 text-[10.5px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60 flex items-center justify-center gap-1 transition-colors"
          @click="open[s.id] = !open[s.id]"
        >
          {{ open[s.id] ? 'Скрыть обучение' : 'История обучения' }}
          <ChevronDown class="w-3 h-3 transition-transform" :class="open[s.id] ? 'rotate-180' : ''" />
        </button>
        <div v-if="open[s.id]" class="px-3 pb-3 space-y-2.5 bg-gray-50/60 dark:bg-gray-800/30">
          <div v-if="s.groups.length" class="pt-2 space-y-1">
            <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Группы</div>
            <div
              v-for="g in s.groups"
              :key="g.id"
              class="flex items-center gap-2 text-[11px] p-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
            >
              <span class="font-mono font-semibold text-gray-800 dark:text-gray-200 shrink-0">{{ g.code }}</span>
              <span class="text-gray-500 dark:text-gray-400 truncate flex-1" :title="g.courseName">{{ g.courseName }}</span>
              <span
                class="px-1.5 py-px rounded-full text-[9px] font-semibold shrink-0"
                :class="g.isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'"
              >
                {{ g.isActive ? 'идёт' : fmtDate(g.endDate) }}
              </span>
            </div>
          </div>
          <AiCertificateList v-if="s.certificates.length" :certificates="s.certificates" compact />
        </div>
      </template>
    </div>

    <button
      v-if="students.length > limit"
      class="w-full py-1.5 rounded-xl text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Свернуть' : `Показать всех (${students.length})` }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Building2, Briefcase, Fingerprint, Users, Award, ExternalLink, ChevronDown } from 'lucide-vue-next';
import AiCertificateList from './AiCertificateList.vue';
import type { AiStudentCard } from '~/types/aiChat';

const props = withDefaults(defineProps<{ students: AiStudentCard[]; compact?: boolean }>(), { compact: false });

const expanded = ref(false);
const open = reactive<Record<string, boolean>>({});
const brokenPhotos = reactive<Record<string, boolean>>({});
// Фото грузим только на клиенте: при SSR событие error приходит до гидрации и теряется
const isMounted = ref(false);
onMounted(() => (isMounted.value = true));
const limit = computed(() => (props.compact ? 2 : 4));
const visible = computed(() => (expanded.value ? props.students : props.students.slice(0, limit.value)));

// Единственный найденный слушатель — сразу раскрываем историю обучения
if (props.students.length === 1 && props.students[0]) open[props.students[0].id] = !props.compact;

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase();
}

function hasActiveGroup(s: AiStudentCard) {
  return s.groups.some((g) => g.isActive);
}

function fmtDate(d?: string) {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString('ru-RU');
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
</script>
