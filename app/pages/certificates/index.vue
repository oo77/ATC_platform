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

    <!-- Панель управления сертификатами: KPI, фильтры, таблица -->
    <DatabaseCertificateManagementPanel />
  </div>
</template>

<script setup lang="ts">
// Award больше не нужен (иконка в заголовке убрана), остаётся только LayoutTemplate для кнопки
import { LayoutTemplate } from 'lucide-vue-next';

definePageMeta({
  layout: 'default',
});

useHead({
  title: 'База сертификатов - АТЦ Платформа',
});
</script>
