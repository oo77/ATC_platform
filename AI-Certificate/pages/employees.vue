<template>
    <div class="container mx-auto px-6 py-12">
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-4xl font-bold text-slate-800 mb-2">Сотрудники</h1>
                <p class="text-slate-600">Управление базой данных сотрудников</p>
            </div>

            <button @click="showAddModal = true"
                class="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300">
                + Добавить сотрудника
            </button>
        </div>

        <!-- Search -->
        <div class="glass p-6 rounded-2xl mb-8">
            <div class="flex items-center space-x-4">
                <div class="flex-1">
                    <input v-model="searchQuery" @input="handleSearch" type="text"
                        placeholder="Поиск по ФИО, должности, отделу..."
                        class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all" />
                </div>
                <button @click="handleSearch"
                    class="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors">
                    Поиск
                </button>
            </div>
        </div>

        <!-- Employees Grid -->
        <div v-if="!loading && displayedEmployees.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="employee in displayedEmployees" :key="employee.id"
                class="glass p-6 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div class="flex items-start justify-between mb-4">
                    <div
                        class="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                        <span class="text-2xl font-bold text-white">
                            {{ employee.firstName.charAt(0) }}{{ employee.lastName.charAt(0) }}
                        </span>
                    </div>

                    <button class="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                </div>

                <h3 class="text-xl font-bold text-slate-800 mb-1">
                    {{ employee.lastName }} {{ employee.firstName }}
                </h3>
                <p v-if="employee.middleName" class="text-slate-500 text-sm mb-3">
                    {{ employee.middleName }}
                </p>

                <div class="space-y-2 text-sm text-slate-600 mb-4">
                    <div class="flex items-center space-x-2">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd"
                                d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                                clip-rule="evenodd" />
                        </svg>
                        <span>{{ employee.position }}</span>
                    </div>

                    <div class="flex items-center space-x-2">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd"
                                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                                clip-rule="evenodd" />
                        </svg>
                        <span>{{ employee.department }}</span>
                    </div>

                    <div class="flex items-center space-x-2">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span>{{ employee.email }}</span>
                    </div>

                    <div v-if="employee.phone" class="flex items-center space-x-2">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span>{{ employee.phone }}</span>
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-200">
                    <button
                        class="w-full px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium">
                        Просмотр сертификатов
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && displayedEmployees.length === 0" class="glass p-12 rounded-2xl text-center">
            <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
            </div>
            <h3 class="text-xl font-bold text-slate-700 mb-2">Сотрудники не найдены</h3>
            <p class="text-slate-500">Попробуйте изменить параметры поиска</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
            <div
                class="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4">
            </div>
            <p class="text-slate-500">Загрузка сотрудников...</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Employee } from '~/types';

const { fetchEmployees, searchEmployees, employees, loading } = useEmployees();

const searchQuery = ref('');
const showAddModal = ref(false);
const displayedEmployees = ref<Employee[]>([]);

const handleSearch = async () => {
    if (searchQuery.value.trim()) {
        displayedEmployees.value = await searchEmployees(searchQuery.value);
    } else {
        displayedEmployees.value = employees.value;
    }
};

onMounted(async () => {
    await fetchEmployees();
    displayedEmployees.value = employees.value;
});

watch(employees, (newVal) => {
    if (!searchQuery.value) {
        displayedEmployees.value = newVal;
    }
});
</script>
