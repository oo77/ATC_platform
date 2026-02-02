<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="glass sticky top-0 z-50 border-b border-white/20">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                CertificateAI
              </h1>
              <p class="text-xs text-slate-500">Умная система управления сертификатами</p>
            </div>
          </div>
          
          <nav class="flex items-center space-x-6">
            <NuxtLink to="/" class="text-slate-700 hover:text-primary-600 transition-colors font-medium">
              Главная
            </NuxtLink>
            <NuxtLink to="/certificates" class="text-slate-700 hover:text-primary-600 transition-colors font-medium">
              Сертификаты
            </NuxtLink>
            <NuxtLink to="/employees" class="text-slate-700 hover:text-primary-600 transition-colors font-medium">
              Сотрудники
            </NuxtLink>
            <NuxtLink to="/stats" class="text-slate-700 hover:text-primary-600 transition-colors font-medium">
              Статистика
            </NuxtLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <NuxtPage />
    </main>

    <!-- Footer -->
    <footer class="glass mt-20 border-t border-white/20">
      <div class="container mx-auto px-6 py-8">
        <div class="text-center text-slate-600">
          <p class="text-sm">
            © 2024 CertificateAI. Интеллектуальная система управления сертификатами.
          </p>
          <p class="text-xs mt-2 text-slate-500">
            Powered by AI • Сделано с ❤️ для авиационной индустрии
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Дополнительные стили при необходимости */
</style>
