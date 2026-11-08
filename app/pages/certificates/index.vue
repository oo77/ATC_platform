<template>
  <!-- Внешний враппер без двойного отступа: отступы уже задаёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок; ссылка на шаблоны — вторичное действие (outline), главное действие «Добавить» находится в панели -->
    <UiPageHeader
      title="База сертификатов"
      description="Централизованный реестр выданных сертификатов, генерация документов и поиск"
    >
      <template #actions>
        <UiButton to="/certificates/templates" variant="outline" size="md" :start-icon="LayoutTemplate">
          Шаблоны сертификатов
        </UiButton>
      </template>
    </UiPageHeader>

    <UiTabs v-model="activeTab" :tabs="tabs" />

    <!-- Панель управления сертификатами: KPI, фильтры, таблица (v-show — состояние фильтров не теряется) -->
    <DatabaseCertificateManagementPanel v-show="activeTab === 'registry'" />
    <DatabaseCertificateAnalytics v-if="visited.analytics" v-show="activeTab === 'analytics'" />
  </div>
</template>

<script setup lang="ts">
// Award больше не нужен (иконка в заголовке убрана), остаётся только LayoutTemplate для кнопки
import { LayoutTemplate, ListChecks, BarChart3 } from 'lucide-vue-next';

const activeTab = ref('registry');
const visited = reactive({ analytics: false });
const tabs = [
  { id: 'registry', label: 'Реестр', icon: ListChecks },
  { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
];
// Аналитика грузится при первом открытии вкладки
watch(activeTab, (t) => { if (t === 'analytics') visited.analytics = true; });

definePageMeta({
  layout: 'default',
});

useHead({
  title: 'База сертификатов - АТЦ Платформа',
});
</script>
