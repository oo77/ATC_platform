<template>
  <UiModal :is-open="isOpen" title="Доступ к книге" size="lg" @close="$emit('close')">
    <div v-if="book" class="space-y-6">
      <!-- Книга -->
      <div class="flex items-center gap-4 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
        <LibraryBookCover :url="book.cover_url" :title="book.title" :width="80" compact class="w-11 shrink-0" />
        <div class="min-w-0 flex-1">
          <h3 class="truncate font-semibold text-gray-900 dark:text-white">{{ book.title }}</h3>
          <p class="truncate text-sm text-gray-500 dark:text-gray-400">{{ book.author || "Автор не указан" }}</p>
        </div>
        <div v-if="accesses.length" class="hidden text-right text-xs text-gray-500 sm:block">
          <p><span class="font-semibold text-gray-900 tabular-nums dark:text-white">{{ activeCount }}</span> активных</p>
          <p v-if="expiredCount">{{ expiredCount }} истекло</p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <!-- Выдача -->
        <div>
          <h4 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Выдать доступ</h4>
          <LibraryAccessGrantForm ref="formRef" :submitting="granting" @submit="grant" />
        </div>

        <!-- Текущие доступы -->
        <div class="min-w-0">
          <div class="mb-3 flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Кому открыто</h4>
            <span v-if="coveredPeople" class="text-xs text-gray-500">≈ {{ coveredPeople }} чел.</span>
          </div>

          <div v-if="loading" class="space-y-2">
            <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.04]" />
          </div>

          <div v-else-if="!accesses.length" class="rounded-lg border border-dashed border-warning-300 bg-warning-50/50 px-4 py-6 text-center dark:border-warning-500/30 dark:bg-warning-500/5">
            <ShieldAlert class="mx-auto h-6 w-6 text-warning-500" />
            <p class="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200">Книгу пока никто не видит</p>
            <p class="mt-0.5 text-xs text-gray-500">Выдайте доступ группе, курсу или роли</p>
          </div>

          <ul v-else class="max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
            <li
              v-for="a in accesses"
              :key="a.id"
              class="group flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
              :class="{ 'opacity-60': a.isExpired }"
            >
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" :class="typeStyle[a.type].bg">
                <component :is="typeStyle[a.type].icon" class="h-4 w-4" :class="typeStyle[a.type].fg" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ a.name }}</p>
                <p class="truncate text-xs text-gray-500">
                  {{ typeStyle[a.type].label }}<template v-if="a.type !== 'user' && a.members"> · {{ a.members }} чел.</template>
                  <template v-if="a.subtitle"> · {{ a.subtitle }}</template>
                </p>
                <p v-if="a.readingStats && a.readingStats.progress" class="mt-0.5 text-[11px] text-brand-500">
                  Прочитано {{ a.readingStats.progress }}%
                </p>
              </div>
              <div class="shrink-0 text-right">
                <UiBadge v-if="a.isExpired" size="sm" color="error">Истёк</UiBadge>
                <UiBadge v-else-if="a.expiresSoon" size="sm" color="warning">до {{ formatDate(a.expiresAt!) }}</UiBadge>
                <span v-else-if="a.expiresAt" class="text-xs text-gray-500">до {{ formatDate(a.expiresAt) }}</span>
                <span v-else class="text-xs text-gray-400">бессрочно</span>
                <p class="mt-0.5 text-[10px] text-gray-400" :title="a.grantedBy ? `Выдал: ${a.grantedBy}` : ''">{{ formatDate(a.grantedAt) }}</p>
              </div>
              <button
                type="button"
                class="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
                :aria-label="`Отозвать доступ: ${a.name}`"
                title="Отозвать"
                @click="toRevoke = a"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <UiConfirmModal
      :is-open="!!toRevoke"
      title="Отозвать доступ?"
      :message="toRevoke ? `«${toRevoke.name}» потеряет доступ к книге. Если книга сейчас открыта, она закроется в течение 30 секунд.` : ''"
      confirm-text="Отозвать"
      @confirm="revoke"
      @cancel="toRevoke = null"
    />
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { User, Users, GraduationCap, Shield, ShieldAlert, Trash2 } from "lucide-vue-next";
import { useToast } from "~/composables/useToast";

interface Book { id: string; title: string; author: string | null; cover_url: string | null }
interface Access {
  id: string;
  type: "user" | "group" | "course" | "role";
  name: string;
  subtitle: string | null;
  members: number;
  grantedBy: string | null;
  grantedAt: string;
  expiresAt: string | null;
  isExpired: boolean;
  expiresSoon: boolean;
  readingStats: { progress: number } | null;
}

const props = defineProps<{ isOpen: boolean; book: Book | null }>();
const emit = defineEmits<{ close: []; changed: [] }>();
const toast = useToast();

const typeStyle = {
  user: { icon: User, label: "Пользователь", bg: "bg-brand-50 dark:bg-brand-500/15", fg: "text-brand-500" },
  group: { icon: Users, label: "Группа", bg: "bg-success-50 dark:bg-success-500/15", fg: "text-success-600" },
  course: { icon: GraduationCap, label: "Курс", bg: "bg-blue-light-50 dark:bg-blue-light-500/15", fg: "text-blue-light-500" },
  role: { icon: Shield, label: "Роль", bg: "bg-warning-50 dark:bg-warning-500/15", fg: "text-warning-600" },
} as const;

const loading = ref(false);
const granting = ref(false);
const accesses = ref<Access[]>([]);
const toRevoke = ref<Access | null>(null);
const formRef = ref<{ reset: () => void } | null>(null);

const activeCount = computed(() => accesses.value.filter((a) => !a.isExpired).length);
const expiredCount = computed(() => accesses.value.length - activeCount.value);
const coveredPeople = computed(() =>
  accesses.value.filter((a) => !a.isExpired).reduce((sum, a) => sum + (a.members || 0), 0),
);

const load = async () => {
  if (!props.book) return;
  loading.value = true;
  try {
    const res = await $fetch<{ data: { accessList: Access[] } }>(`/api/library/admin/books/${props.book.id}/access`);
    accesses.value = res.data.accessList;
  } catch (e: any) {
    toast.error(e?.data?.message || "Не удалось загрузить доступы");
  } finally {
    loading.value = false;
  }
};

const grant = async (payload: { type: string; targetId: string; expiresAt: string | null }) => {
  if (!props.book) return;
  granting.value = true;
  try {
    const res: any = await $fetch(`/api/library/admin/books/${props.book.id}/access`, { method: "POST", body: payload });
    toast.success(res.message || "Доступ выдан");
    formRef.value?.reset();
    await load();
    emit("changed");
  } catch (e: any) {
    toast.error(e?.data?.message || "Не удалось выдать доступ");
  } finally {
    granting.value = false;
  }
};

const revoke = async () => {
  const a = toRevoke.value;
  toRevoke.value = null;
  if (!a || !props.book) return;
  try {
    await $fetch(`/api/library/admin/books/${props.book.id}/access`, { method: "DELETE", body: { accessId: a.id } });
    toast.success("Доступ отозван");
    await load();
    emit("changed");
  } catch (e: any) {
    toast.error(e?.data?.message || "Не удалось отозвать доступ");
  }
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });

watch(
  () => [props.isOpen, props.book?.id],
  ([open]) => {
    if (open && props.book) load();
    else accesses.value = [];
  },
  { immediate: true },
);
</script>
