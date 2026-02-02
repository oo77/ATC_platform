// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: [
    '@nuxtjs/tailwindcss'
  ],

  app: {
    head: {
      title: 'Система управления сертификатами',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Интеллектуальная система для автоматизированной обработки сертификатов сотрудников' }
      ],
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Приватные ключи (только на сервере)
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    
    public: {
      // Публичные ключи (доступны на клиенте)
      apiBase: process.env.API_BASE || '/api'
    }
  }
})
