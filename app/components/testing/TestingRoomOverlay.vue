<template>
  <ClientOnly>
    <!-- Вход в тест: компьютер получил назначение от администратора -->
    <Transition name="tr-fade">
      <div
        v-if="launch"
        class="fixed inset-0 z-[100000] flex items-center justify-center bg-gray-900/80 p-6 backdrop-blur-sm"
        role="alertdialog"
        aria-live="assertive"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-gray-900">
          <template v-if="!launch.error">
            <div class="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-r-transparent" />
            <p class="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Вход в тест</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ launch.studentName }}</p>
            <p v-if="launch.testName" class="mt-1 text-gray-600 dark:text-gray-300">{{ launch.testName }}</p>
          </template>
          <template v-else>
            <p class="text-lg font-semibold text-error-600 dark:text-error-400">Не удалось войти в тест</p>
            <p class="mt-2 text-gray-700 dark:text-gray-300">{{ launch.error }}</p>
            <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Сообщите администратору класса</p>
          </template>
        </div>
      </div>
    </Transition>

    <!-- «Показать номер»: администратор проверяет, где какой компьютер -->
    <Transition name="tr-fade">
      <div
        v-if="identify && !launch"
        class="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-brand-600/95 text-white"
        @click="identify = null"
      >
        <p class="text-[22vmin] font-bold leading-none tabular-nums">{{ identify.number }}</p>
        <p class="mt-4 text-3xl font-medium">{{ identify.name }}</p>
        <p v-if="ip" class="mt-2 text-lg opacity-80 tabular-nums">{{ ip }}</p>
      </div>
    </Transition>

    <!-- На странице входа — какой это компьютер (слушателю проще назвать номер) -->
    <div
      v-if="station && showChip"
      class="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-sm shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/90"
    >
      <span class="h-2 w-2 rounded-full" :class="connected ? 'bg-success-500' : 'bg-gray-400'" />
      <span class="font-semibold text-gray-900 dark:text-white">{{ station.name }}</span>
      <span class="text-gray-500 tabular-nums dark:text-gray-400">{{ ip }}</span>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const route = useRoute();
const { station, ip, connected, identify, launch } = useTestingRoom();
const showChip = computed(() => route.path.startsWith("/auth/signin"));
</script>

<style scoped>
.tr-fade-enter-active,
.tr-fade-leave-active {
  transition: opacity 0.2s ease;
}
.tr-fade-enter-from,
.tr-fade-leave-to {
  opacity: 0;
}
</style>
