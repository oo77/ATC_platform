<template>
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <UiPageHeader
      title="Роли и права"
      description="Создавайте роли, отмечайте разрешённые действия и назначайте роли пользователям"
    >
      <template #actions>
        <UiButton v-if="canManage" variant="primary" :start-icon="Plus" @click="openCreate()">Создать роль</UiButton>
      </template>
    </UiPageHeader>

    <UiAlert
      v-if="!canManage"
      variant="info"
      title="Только просмотр"
      message="Чтобы создавать и изменять роли, нужно право «Создание и настройка ролей»."
    />

    <div v-if="loading" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 6" :key="i" class="h-36 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
    </div>

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="role in roles"
        :key="role.id"
        class="flex flex-col rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="truncate text-base font-semibold text-gray-900 dark:text-white">{{ role.name }}</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ profileLabel(role.baseProfile) }} · {{ role.code }}
            </p>
          </div>
          <UiBadge v-if="role.isSystem" color="warning" size="sm">Системная</UiBadge>
        </div>

        <p v-if="role.description" class="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{{ role.description }}</p>

        <div class="mt-4 flex flex-wrap gap-2 text-xs">
          <span class="rounded-md bg-gray-100 px-2 py-1 text-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
            Прав: <b>{{ role.isSystem ? "все" : role.permissions.length }}</b>
          </span>
          <span class="rounded-md bg-gray-100 px-2 py-1 text-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
            Пользователей: <b>{{ role.userCount ?? 0 }}</b>
          </span>
          <span
            v-if="dangerousCount(role)"
            class="rounded-md bg-red-50 px-2 py-1 text-red-700 dark:bg-red-500/10 dark:text-red-400"
          >
            Опасных: <b>{{ dangerousCount(role) }}</b>
          </span>
        </div>

        <div class="mt-auto flex flex-wrap gap-2 pt-4">
          <UiButton size="sm" variant="outline" :start-icon="role.isSystem || !canManage ? Eye : Pencil" @click="openEdit(role)">
            {{ role.isSystem || !canManage ? "Открыть" : "Настроить" }}
          </UiButton>
          <UiButton v-if="canManage" size="sm" variant="ghost" :start-icon="Copy" @click="openCreate(role)">На основе</UiButton>
          <UiButton
            v-if="canManage && !role.isSystem && !isBuiltin(role)"
            size="sm"
            variant="ghost"
            :start-icon="Trash2"
            :disabled="(role.userCount ?? 0) > 0"
            :title="(role.userCount ?? 0) > 0 ? 'Роль назначена пользователям — сначала переназначьте их' : 'Удалить роль'"
            @click="deleteTarget = role"
          >
            Удалить
          </UiButton>
        </div>
      </article>
    </div>

    <!-- Редактор роли -->
    <UiModal :is-open="editorOpen" :title="editorTitle" size="xl" @close="editorOpen = false">
      <div class="space-y-5">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label class="block md:col-span-1">
            <span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Название</span>
            <input
              v-model="form.name"
              :disabled="readOnly"
              type="text"
              maxlength="100"
              placeholder="Например, Методист"
              class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </label>
          <label class="block md:col-span-1">
            <span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Кабинет</span>
            <select
              v-model="form.baseProfile"
              :disabled="readOnly"
              class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option v-for="p in profileOptions" :key="p" :value="p">{{ profileLabel(p) }}</option>
            </select>
            <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">{{ BASE_PROFILE_LABELS[form.baseProfile]?.hint }}</span>
          </label>
          <label class="block md:col-span-1">
            <span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</span>
            <input
              v-model="form.description"
              :disabled="readOnly"
              type="text"
              maxlength="1000"
              placeholder="Для чего эта роль"
              class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </label>
        </div>

        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="text-sm text-gray-600 dark:text-gray-300">
            Отмечено прав: <b>{{ form.permissions.size }}</b> из {{ totalPermissions }}
            <span v-if="selectedDangerous" class="ml-2 text-red-600 dark:text-red-400">· опасных: {{ selectedDangerous }}</span>
          </div>
          <input
            v-model="search"
            type="search"
            placeholder="Поиск по правам…"
            class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary focus:outline-none md:w-72 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <p v-if="!readOnly" class="text-xs text-gray-500 dark:text-gray-400">
          Зависимые права отмечаются автоматически (например, «Изменение групп» включает «Все группы»).
          Права, которых нет у вас, выдать нельзя — они недоступны.
        </p>

        <div class="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          <section
            v-for="mod in visibleModules"
            :key="mod.id"
            class="rounded-xl border border-gray-200 dark:border-gray-800"
          >
            <header class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ mod.title }}
                <span class="ml-1 text-xs font-normal text-gray-500">{{ moduleSelected(mod) }}/{{ mod.permissions.length }}</span>
              </h3>
              <div v-if="!readOnly" class="flex gap-2 text-xs">
                <button type="button" class="text-primary hover:underline" @click="setModule(mod, true)">Все</button>
                <button type="button" class="text-gray-500 hover:underline" @click="setModule(mod, false)">Снять</button>
              </div>
            </header>
            <ul class="divide-y divide-gray-100 dark:divide-gray-800">
              <li v-for="perm in mod.permissions" :key="perm.key" class="flex items-start gap-3 px-4 py-2.5">
                <input
                  :id="`perm-${perm.key}`"
                  type="checkbox"
                  class="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30 disabled:opacity-40"
                  :checked="form.permissions.has(perm.key)"
                  :disabled="readOnly || !canGrant(perm.key)"
                  @change="toggle(perm.key, ($event.target as HTMLInputElement).checked)"
                />
                <label :for="`perm-${perm.key}`" class="min-w-0 flex-1 cursor-pointer">
                  <span class="text-sm" :class="perm.dangerous ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'">
                    {{ perm.label }}
                  </span>
                  <span v-if="perm.dangerous" class="ml-1.5 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-600 dark:bg-red-500/10 dark:text-red-400">опасное</span>
                  <span v-if="!readOnly && !canGrant(perm.key)" class="ml-1.5 text-[11px] text-gray-400">нет у вас</span>
                  <span v-if="perm.hint" class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{{ perm.hint }}</span>
                  <span v-if="perm.requires?.length" class="mt-0.5 block text-[11px] text-gray-400">
                    Требует: {{ perm.requires.map((r) => PERMISSION_META[r]?.label || r).join(", ") }}
                  </span>
                </label>
                <code class="hidden shrink-0 text-[11px] text-gray-400 lg:block">{{ perm.key }}</code>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between gap-3">
          <span v-if="editingRole?.isSystem" class="text-sm text-gray-500">Системная роль всегда имеет все права</span>
          <span v-else-if="editingRole && editingRole.id === currentRoleId" class="text-sm text-amber-600">Это ваша роль — изменять её нельзя</span>
          <span v-else />
          <div class="flex gap-2">
            <UiButton variant="outline" @click="editorOpen = false">{{ readOnly ? "Закрыть" : "Отмена" }}</UiButton>
            <UiButton v-if="!readOnly" variant="primary" :disabled="saving || form.name.trim().length < 2" @click="save">
              {{ saving ? "Сохранение…" : editingRole ? "Сохранить" : "Создать" }}
            </UiButton>
          </div>
        </div>
      </template>
    </UiModal>

    <UiConfirmModal
      :is-open="!!deleteTarget"
      title="Удалить роль"
      :message="`Роль «${deleteTarget?.name}» будет удалена. Действие попадёт в журнал аудита.`"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Copy, Eye, Pencil, Plus, Trash2 } from "lucide-vue-next";
import { Permission } from "~/types/permissions";
import {
  BASE_PROFILE_LABELS,
  PERMISSION_META,
  PERMISSION_MODULES,
  dependents,
  withDependencies,
  type PermissionModule,
} from "~/types/permissionCatalog";

definePageMeta({ layout: "default", title: "Роли и права" });

interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  baseProfile: string;
  isSystem: boolean;
  permissions: string[];
  userCount?: number;
}

const BUILTIN = new Set(["role_admin", "role_manager", "role_teacher", "role_student"]);
const profileOptions = ["MANAGER", "TEACHER", "STUDENT"];

const { authFetch } = useAuthFetch();
const notify = useNotification();
const { hasPermission, permissions: myPermissions } = usePermissions();
const { user } = useAuth();

const canManage = computed(() => hasPermission(Permission.ROLES_MANAGE));
const currentRoleId = computed(() => (user.value as any)?.roleId as string | undefined);
const mySet = computed(() => new Set<string>(myPermissions.value as string[]));

const roles = ref<RoleItem[]>([]);
const loading = ref(true);
const editorOpen = ref(false);
const editingRole = ref<RoleItem | null>(null);
const saving = ref(false);
const search = ref("");
const deleteTarget = ref<RoleItem | null>(null);
const deleting = ref(false);

const form = reactive({
  name: "",
  description: "",
  baseProfile: "MANAGER",
  permissions: new Set<string>(),
});

const totalPermissions = PERMISSION_MODULES.reduce((n, m) => n + m.permissions.length, 0);
const readOnly = computed(
  () => !canManage.value || !!editingRole.value?.isSystem || editingRole.value?.id === currentRoleId.value,
);
const editorTitle = computed(() =>
  editingRole.value ? `Роль «${editingRole.value.name}»` : "Новая роль",
);

const visibleModules = computed<PermissionModule[]>(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return PERMISSION_MODULES;
  return PERMISSION_MODULES.map((m) => ({
    ...m,
    permissions: m.permissions.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.key.includes(q) ||
        (p.hint || "").toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q),
    ),
  })).filter((m) => m.permissions.length);
});

const selectedDangerous = computed(
  () => [...form.permissions].filter((k) => PERMISSION_META[k]?.dangerous).length,
);

function profileLabel(p: string) {
  return BASE_PROFILE_LABELS[p]?.label || p;
}
function isBuiltin(role: RoleItem) {
  return BUILTIN.has(role.id);
}
function dangerousCount(role: RoleItem) {
  if (role.isSystem) return 0;
  return role.permissions.filter((k) => PERMISSION_META[k]?.dangerous).length;
}
function canGrant(key: string) {
  // Убрать можно любое право; добавить — только имеющееся у вас
  return form.permissions.has(key) || mySet.value.has(key);
}
function moduleSelected(mod: PermissionModule) {
  return mod.permissions.filter((p) => form.permissions.has(p.key)).length;
}

function toggle(key: string, checked: boolean) {
  const next = new Set(form.permissions);
  if (checked) {
    for (const k of withDependencies([key])) if (mySet.value.has(k) || next.has(k)) next.add(k);
  } else {
    // Снимаем вместе с правами, которые без него не работают
    const stack = [key];
    while (stack.length) {
      const k = stack.pop()!;
      if (!next.delete(k)) continue;
      stack.push(...dependents(k));
    }
  }
  form.permissions = next;
}

function setModule(mod: PermissionModule, on: boolean) {
  for (const p of mod.permissions) {
    if (on && !canGrant(p.key)) continue;
    toggle(p.key, on);
  }
}

function openCreate(base?: RoleItem) {
  editingRole.value = null;
  form.name = base ? `${base.name} (копия)` : "";
  form.description = base?.description || "";
  form.baseProfile = base && base.baseProfile !== "ADMIN" ? base.baseProfile : "MANAGER";
  const source = base?.isSystem ? Object.keys(PERMISSION_META) : base?.permissions || [];
  // В копию попадают только права, которые вы можете выдать
  form.permissions = new Set(source.filter((k) => mySet.value.has(k)));
  search.value = "";
  editorOpen.value = true;
}

function openEdit(role: RoleItem) {
  editingRole.value = role;
  form.name = role.name;
  form.description = role.description || "";
  form.baseProfile = role.baseProfile;
  form.permissions = new Set(role.isSystem ? Object.keys(PERMISSION_META) : role.permissions);
  search.value = "";
  editorOpen.value = true;
}

async function load() {
  loading.value = true;
  try {
    const res: any = await authFetch("/api/roles");
    roles.value = res.roles || [];
  } catch (e: any) {
    notify.error(e?.data?.message || "Не удалось загрузить роли");
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      baseProfile: form.baseProfile,
      permissions: [...form.permissions],
    };
    if (editingRole.value) {
      await authFetch(`/api/roles/${editingRole.value.id}`, { method: "PUT", body });
      notify.success("Роль сохранена. Изменения применятся к пользователям в течение 15 секунд");
    } else {
      await authFetch("/api/roles", { method: "POST", body });
      notify.success("Роль создана");
    }
    editorOpen.value = false;
    await load();
  } catch (e: any) {
    notify.error(e?.data?.message || "Не удалось сохранить роль");
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    await authFetch(`/api/roles/${deleteTarget.value.id}`, { method: "DELETE" });
    notify.success("Роль удалена");
    deleteTarget.value = null;
    await load();
  } catch (e: any) {
    notify.error(e?.data?.message || "Не удалось удалить роль");
  } finally {
    deleting.value = false;
  }
}

onMounted(load);
</script>
