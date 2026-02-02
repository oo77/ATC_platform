<template>
  <div class="container mx-auto px-6 py-12">
    <!-- Hero Section -->
    <section class="text-center mb-16 animate-fade-in">
      <div class="inline-block mb-6">
        <div class="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 rounded-3xl flex items-center justify-center animate-pulse-glow">
          <svg class="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      </div>
      
      <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-accent-600 to-primary-700 bg-clip-text text-transparent">
        Автоматизация учёта сертификатов
      </h1>
      
      <p class="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
        Загрузите сертификат, и наш искусственный интеллект автоматически распознает все данные, 
        определит сотрудника и заполнит форму за считанные секунды.
      </p>

      <div class="flex items-center justify-center space-x-4 text-sm text-slate-500">
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>OCR распознавание</span>
        </div>
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>AI анализ</span>
        </div>
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>Автоматическое заполнение</span>
        </div>
      </div>
    </section>

    <!-- Upload Section -->
    <section class="max-w-4xl mx-auto mb-16">
      <CertificateUploader @certificate-processed="handleCertificateProcessed" />
    </section>

    <!-- Stats Section -->
    <section class="max-w-6xl mx-auto mb-16">
      <h2 class="text-3xl font-bold text-center mb-8 text-slate-800">
        Статистика системы
      </h2>
      <StatsOverview />
    </section>

    <!-- Features Section -->
    <section class="max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-12 text-slate-800">
        Возможности системы
      </h2>
      
      <div class="grid md:grid-cols-3 gap-8">
        <div class="glass p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-3 text-slate-800">OCR Распознавание</h3>
          <p class="text-slate-600 leading-relaxed">
            Автоматическое распознавание текста из PDF, JPG, PNG и других форматов с высокой точностью.
          </p>
        </div>

        <div class="glass p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-3 text-slate-800">AI Анализ</h3>
          <p class="text-slate-600 leading-relaxed">
            Интеллектуальный анализ структуры документа и извлечение ключевых данных с помощью AI.
          </p>
        </div>

        <div class="glass p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-3 text-slate-800">Экономия времени</h3>
          <p class="text-slate-600 leading-relaxed">
            Сокращение времени обработки документов с часов до секунд. Минимизация ручного ввода.
          </p>
        </div>

        <div class="glass p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div class="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-3 text-slate-800">Высокая точность</h3>
          <p class="text-slate-600 leading-relaxed">
            Минимизация ошибок благодаря автоматической обработке и валидации данных.
          </p>
        </div>

        <div class="glass p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div class="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-3 text-slate-800">Умный поиск</h3>
          <p class="text-slate-600 leading-relaxed">
            Автоматическое определение сотрудника по данным из сертификата.
          </p>
        </div>

        <div class="glass p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-3 text-slate-800">Аналитика</h3>
          <p class="text-slate-600 leading-relaxed">
            Детальная статистика и отчёты по сертификатам, отделам и срокам действия.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const handleCertificateProcessed = (data: any) => {
  console.log('Сертификат обработан:', data);
  // Можно добавить навигацию или уведомление
};
</script>
