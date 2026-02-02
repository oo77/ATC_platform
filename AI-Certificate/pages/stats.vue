<template>
    <div class="container mx-auto px-6 py-12">
        <h1 class="text-4xl font-bold text-slate-800 mb-8">Статистика и аналитика</h1>

        <!-- Main Stats -->
        <StatsOverview />

        <!-- Additional Analytics -->
        <div class="mt-12 grid md:grid-cols-2 gap-8">
            <!-- Recent Activity -->
            <div class="glass p-8 rounded-2xl">
                <h2 class="text-2xl font-bold text-slate-800 mb-6">Последняя активность</h2>
                <div class="space-y-4">
                    <div class="flex items-start space-x-4 p-4 bg-white/50 rounded-xl">
                        <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-slate-800">Новый сертификат добавлен</p>
                            <p class="text-sm text-slate-500">Иванов И.И. - Авиационная безопасность</p>
                            <p class="text-xs text-slate-400 mt-1">2 часа назад</p>
                        </div>
                    </div>

                    <div class="flex items-start space-x-4 p-4 bg-white/50 rounded-xl">
                        <div
                            class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-slate-800">Сертификат истекает</p>
                            <p class="text-sm text-slate-500">Петров П.П. - через 15 дней</p>
                            <p class="text-xs text-slate-400 mt-1">Сегодня</p>
                        </div>
                    </div>

                    <div class="flex items-start space-x-4 p-4 bg-white/50 rounded-xl">
                        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                            </svg>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-slate-800">Новый сотрудник</p>
                            <p class="text-sm text-slate-500">Сидорова М.А. добавлена в систему</p>
                            <p class="text-xs text-slate-400 mt-1">Вчера</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="glass p-8 rounded-2xl">
                <h2 class="text-2xl font-bold text-slate-800 mb-6">Быстрые действия</h2>
                <div class="space-y-3">
                    <NuxtLink to="/"
                        class="flex items-center justify-between p-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <div class="flex items-center space-x-3">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span class="font-semibold">Загрузить сертификат</span>
                        </div>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </NuxtLink>

                    <NuxtLink to="/certificates"
                        class="flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-all duration-300 hover:scale-105">
                        <div class="flex items-center space-x-3">
                            <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span class="font-semibold text-slate-700">Просмотреть все сертификаты</span>
                        </div>
                        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </NuxtLink>

                    <NuxtLink to="/employees"
                        class="flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-all duration-300 hover:scale-105">
                        <div class="flex items-center space-x-3">
                            <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span class="font-semibold text-slate-700">Управление сотрудниками</span>
                        </div>
                        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// Страница статистики
</script>
