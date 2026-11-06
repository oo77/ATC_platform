<template>
  <!-- Внешний враппер без двойного отступа: отступы уже задаёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок страницы вместо самописного h1 (без uppercase/font-black) -->
    <UiPageHeader
      title="Слушатели"
      description="База данных слушателей, история обучения и сертификаты"
    />

    <!-- Панель управления: сама рисует фильтры, таблицу и пагинацию (без лишней обёртки-карточки, чтобы не было «карточки в карточке») -->
    <DatabaseStudentManagementPanel />
  </div>
</template>

<script setup lang="ts">
// Иконка UserCheck больше не нужна: заголовок отрисовывает UiPageHeader

definePageMeta({
  layout: "default",
});

useHead({
  title: "Слушатели - АТЦ Платформа",
});
</script>
