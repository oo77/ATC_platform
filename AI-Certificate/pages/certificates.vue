<template>
    <div class="container mx-auto px-6 py-12">
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-4xl font-bold text-slate-800 mb-2">Сертификаты</h1>
                <p class="text-slate-600">Управление всеми сертификатами сотрудников</p>
            </div>

            <NuxtLink to="/"
                class="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300">
                + Загрузить новый
            </NuxtLink>
        </div>

        <!-- Filters -->
        <div class="glass p-6 rounded-2xl mb-8">
            <div class="grid md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Поиск</label>
                    <input v-model="filters.searchQuery" type="text" placeholder="Номер, ФИО..."
                        class="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Статус</label>
                    <select v-model="filters.status"
                        class="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all">
                        <option value="">Все</option>
                        <option value="active">Активные</option>
                        <option value="expired">Истекшие</option>
                        <option value="pending">Ожидают проверки</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Тип</label>
                    <select v-model="filters.certificateType"
                        class="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all">
                        <option value="">Все типы</option>
                        <option value="Авиационная безопасность">Авиационная безопасность</option>
                        <option value="Охрана труда">Охрана труда</option>
                        <option value="Первая помощь">Первая помощь</option>
                    </select>
                </div>

                <div class="flex items-end">
                    <button @click="applyFilters"
                        class="w-full px-4 py-2 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors">
                        Применить
                    </button>
                </div>
            </div>
        </div>

        <!-- Certificates List -->
        <div v-if="!loading && certificates.length > 0" class="space-y-4">
            <div v-for="cert in certificates" :key="cert.id"
                class="glass p-6 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-3">
                            <span :class="[
                                'px-3 py-1 rounded-full text-xs font-semibold',
                                cert.status === 'active' ? 'bg-green-100 text-green-700' :
                                    cert.status === 'expired' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                            ]">
                                {{ cert.status === 'active' ? 'Активен' : cert.status === 'expired' ? 'Истёк' :
                                'Ожидает' }}
                            </span>
                            <span class="text-sm font-mono text-slate-500">{{ cert.certificateNumber }}</span>
                        </div>

                        <h3 class="text-xl font-bold text-slate-800 mb-2">{{ cert.courseName }}</h3>

                        <div class="grid md:grid-cols-2 gap-4 text-sm text-slate-600">
                            <div class="flex items-center space-x-2">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                        clip-rule="evenodd" />
                                </svg>
                                <span>Сотрудник ID: {{ cert.employeeId }}</span>
                            </div>

                            <div class="flex items-center space-x-2">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                        clip-rule="evenodd" />
                                </svg>
                                <span>Выдан: {{ formatDate(cert.issueDate) }}</span>
                            </div>

                            <div class="flex items-center space-x-2">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                                        clip-rule="evenodd" />
                                </svg>
                                <span>{{ cert.issuingOrganization }}</span>
                            </div>

                            <div v-if="cert.expiryDate" class="flex items-center space-x-2">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                        clip-rule="evenodd" />
                                </svg>
                                <span>Действителен до: {{ formatDate(cert.expiryDate) }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col items-end space-y-2">
                        <button class="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                        <button class="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && certificates.length === 0" class="glass p-12 rounded-2xl text-center">
            <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h3 class="text-xl font-bold text-slate-700 mb-2">Сертификаты не найдены</h3>
            <p class="text-slate-500 mb-6">Загрузите первый сертификат, чтобы начать работу</p>
            <NuxtLink to="/"
                class="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300">
                Загрузить сертификат
            </NuxtLink>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
            <div
                class="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4">
            </div>
            <p class="text-slate-500">Загрузка сертификатов...</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Certificate, CertificateFilters } from '~/types';

const { fetchCertificates, certificates, loading } = useCertificates();

const filters = ref<CertificateFilters>({
    searchQuery: '',
    status: undefined,
    certificateType: '',
});

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ru-RU');
};

const applyFilters = async () => {
    await fetchCertificates(filters.value);
};

onMounted(async () => {
    await fetchCertificates();
});
</script>
