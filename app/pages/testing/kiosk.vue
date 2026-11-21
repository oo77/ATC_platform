<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center dark:bg-gray-950">
    <div class="w-full max-w-xl">
      <p class="text-sm font-medium uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
        Класс тестирования
      </p>

      <template v-if="station">
        <p class="mt-6 text-[9rem] font-bold leading-none text-gray-900 tabular-nums dark:text-white sm:text-[12rem]">
          {{ station.number }}
        </p>
        <p class="mt-2 text-2xl font-semibold text-gray-800 dark:text-gray-100">{{ station.name }}</p>
      </template>
      <template v-else>
        <p class="mt-8 text-3xl font-semibold text-gray-900 dark:text-white">Компьютер не зарегистрирован</p>
        <p class="mx-auto mt-3 max-w-md text-gray-600 dark:text-gray-400">
          Администратор увидит этот компьютер в разделе «Проведение тестирования» и присвоит ему номер.
        </p>
      </template>

      <p class="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
        <span class="h-2 w-2 rounded-full" :class="connected ? 'bg-success-500' : 'animate-pulse bg-warning-500'" />
        <span class="text-gray-700 dark:text-gray-300">{{ connected ? "На связи" : "Подключение…" }}</span>
        <span v-if="ip" class="text-gray-500 tabular-nums dark:text-gray-400">· {{ ip }}</span>
      </p>

      <div class="mt-12 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <template v-if="user && user.role !== 'STUDENT'">
          <p class="font-medium text-gray-900 dark:text-white">Вы вошли как {{ user.name }}</p>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Пока на компьютере открыта учётная запись сотрудника, слушатель не сможет войти в тест автоматически.
          </p>
          <UiButton class-name="mt-4" variant="outline" @click="logout">Выйти из учётной записи</UiButton>
        </template>
        <template v-else>
          <p class="text-lg font-medium text-gray-900 dark:text-white">Ожидание теста</p>
          <p class="mt-1 text-gray-600 dark:text-gray-400">
            Назовите администратору номер компьютера — тест откроется здесь автоматически.
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });
useHead({ title: "Ожидание теста" });

const { station, ip, connected, exitToWaiting } = useTestingRoom();
const user = useState<any>("auth:user");

const logout = () => exitToWaiting();
</script>
