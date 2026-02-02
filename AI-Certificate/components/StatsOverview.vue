<template>
  <div v-if="stats" class="grid md:grid-cols-4 gap-6">
    <!-- Total Certificates -->
    <div class="glass p-6 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div class="flex items-center justify-between mb-4">
        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
            <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        </div>
      </div>
      <p class="text-3xl font-bold text-slate-800 mb-1">{{ stats.total }}</p>
      <p class="text-sm text-slate-500">Всего сертификатов</p>
    </div>

    <!-- Active Certificates -->
    <div class="glass p-6 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div class="flex items-center justify-between mb-4">
        <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
      <p class="text-3xl font-bold text-green-600 mb-1">{{ stats.active }}</p>
      <p class="text-sm text-slate-500">Активных</p>
    </div>

    <!-- Expiring Soon -->
    <div class="glass p-6 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div class="flex items-center justify-between mb-4">
        <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
      <p class="text-3xl font-bold text-yellow-600 mb-1">{{ stats.expiringSoon }}</p>
      <p class="text-sm text-slate-500">Истекают скоро</p>
    </div>

    <!-- Expired -->
    <div class="glass p-6 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div class="flex items-center justify-between mb-4">
        <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
      <p class="text-3xl font-bold text-red-600 mb-1">{{ stats.expired }}</p>
      <p class="text-sm text-slate-500">Истекших</p>
    </div>
  </div>

  <!-- Charts -->
  <div v-if="stats" class="grid md:grid-cols-2 gap-6 mt-6">
    <!-- By Type -->
    <div class="glass p-6 rounded-2xl">
      <h3 class="text-lg font-bold text-slate-800 mb-4">По типам</h3>
      <div class="space-y-3">
        <div v-for="(count, type) in stats.byType" :key="type" class="flex items-center justify-between">
          <span class="text-sm text-slate-600">{{ type }}</span>
          <div class="flex items-center space-x-3">
            <div class="w-32 bg-slate-200 rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-500"
                :style="{ width: (count / stats.total * 100) + '%' }"
              ></div>
            </div>
            <span class="text-sm font-semibold text-slate-800 w-8 text-right">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- By Department -->
    <div class="glass p-6 rounded-2xl">
      <h3 class="text-lg font-bold text-slate-800 mb-4">По отделам</h3>
      <div class="space-y-3">
        <div v-for="(count, department) in stats.byDepartment" :key="department" class="flex items-center justify-between">
          <span class="text-sm text-slate-600">{{ department }}</span>
          <div class="flex items-center space-x-3">
            <div class="w-32 bg-slate-200 rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                :style="{ width: (count / stats.total * 100) + '%' }"
              ></div>
            </div>
            <span class="text-sm font-semibold text-slate-800 w-8 text-right">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  <div v-if="loading" class="text-center py-12">
    <div class="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    <p class="text-slate-500 mt-4">Загрузка статистики...</p>
  </div>

  <!-- Error State -->
  <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
    <svg class="w-12 h-12 text-red-500 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
    </svg>
    <p class="text-red-800 font-medium">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import type { CertificateStats } from '~/types';

const { getStats } = useCertificates();

const stats = ref<CertificateStats | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  try {
    stats.value = await getStats();
  } catch (e: any) {
    error.value = e.message || 'Ошибка при загрузке статистики';
  } finally {
    loading.value = false;
  }
});
</script>
