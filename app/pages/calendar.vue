<template>
  <!-- Заглушка страницы: единый заголовок и карточка, без max-w-7xl -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <UiPageHeader title="Календарь" />
    <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <p class="text-sm text-gray-600 dark:text-gray-400">Содержимое страницы календаря появится здесь.</p>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'Calendar | TailAdmin - Nuxt Tailwind CSS Dashboard',
})
</script>
