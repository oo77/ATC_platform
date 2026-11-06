<template>
  <!-- Внешний враппер без двойного отступа: отступы уже задаёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок страницы вместо самописного h1 (без uppercase/font-black) -->
    <UiPageHeader
      title="Организации"
      description="Реестр партнёрских организаций, ИНН, реквизиты и слушатели"
    />

    <!-- Панель управления организациями: поиск, таблица, пагинация -->
    <OrganizationsOrganizationManagementPanel />
  </div>
</template>

<script setup lang="ts">
// Иконка Building2 больше не нужна: заголовок отрисовывает UiPageHeader

definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Организации - АТЦ Платформа',
});
</script>
