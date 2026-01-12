<template>
  <div class="mx-auto max-w-7xl">
    <PageBreadcrumb pageName="404 Error" />
    <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div class="text-center">
        <h1 class="mb-4 text-9xl font-bold text-brand-500">404</h1>
        <h2 class="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
          Page Not Found
        </h2>
        <p class="mb-8 text-gray-600 dark:text-gray-400">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 text-white transition-colors hover:bg-brand-600"
        >
          Go Back Home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import PageBreadcrumb from '~/components/common/PageBreadcrumb.vue'

useHead({
  title: '404 Error | TailAdmin - Nuxt Tailwind CSS Dashboard',
})
</script>
