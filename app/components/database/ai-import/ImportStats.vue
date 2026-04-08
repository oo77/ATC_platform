<template>
  <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity class="w-5 h-5 text-blue-500" />
          Показатели эффективности
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Аналитика работы AI моделей</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Обработано -->
      <div class="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-6">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30 text-blue-600 dark:text-blue-400">
            <Files class="w-5 h-5" />
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/30 rounded-full flex items-center gap-1.5">
            <CheckCircle2 class="w-3.5 h-3.5" />
            {{ successRate }}% успешно
          </span>
        </div>
        <div>
          <h3 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{{ stats.totalProcessed || 0 }}</h3>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">Всего обработано</p>
        </div>
      </div>

      <!-- Точность AI -->
      <div class="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-6">
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800/30 text-purple-600 dark:text-purple-400">
            <BrainCircuit class="w-5 h-5" />
          </div>
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <h3 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{{ averageConfidence }}%</h3>
            <span class="text-sm font-medium text-slate-500 dark:text-slate-400">уверенность</span>
          </div>
          <div class="mt-4 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden ring-1 ring-inset ring-slate-900/5 dark:ring-white/5">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="confidenceColorClass"
              :style="{ width: `${averageConfidence}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Расходы -->
      <div class="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-6">
          <div class="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400">
            <Banknote class="w-5 h-5" />
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
            ~${{ averageCost }} / шт.
          </span>
        </div>
        <div>
          <h3 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight">${{ totalCost }}</h3>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">Ориентировочные затраты</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AIImportStats } from "~/../server/types/aiCertificateImport";
import { Activity, Files, CheckCircle2, BrainCircuit, Banknote } from "lucide-vue-next";

const props = defineProps<{
  stats: AIImportStats;
}>();

const successRate = computed(() => {
  return props.stats.successRate
    ? Math.round(props.stats.successRate * 100)
    : 0;
});

const averageConfidence = computed(() => {
  return props.stats.averageConfidence
    ? Math.round(props.stats.averageConfidence * 100)
    : 0;
});

const confidenceColorClass = computed(() => {
  if (averageConfidence.value >= 90) return "bg-green-500";
  if (averageConfidence.value >= 70) return "bg-yellow-500";
  return "bg-red-500";
});

const totalCost = computed(() => {
  return props.stats.totalCost ? props.stats.totalCost.toFixed(2) : "0.00";
});

const averageCost = computed(() => {
  return props.stats.averageCost ? props.stats.averageCost.toFixed(3) : "0.000";
});
</script>
