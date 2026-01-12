// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Настройка dev-сервера для доступа извне (включая ngrok)
  devServer: {
    host: 'localhost', // Слушает все сетевые интерфейсы (необходимо для ngrok)
    port: 3000,      // Порт можно изменить при необходимости
  },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    }
  },

  modules: ['nuxt-icon'],

  app: {
    head: {
      title: 'АТЦ - Учебный центр',
      meta: [
        { name: 'description', content: 'Платформа управления учебно-тренировочным центром АТЦ' }
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    }
  },

  typescript: {
    strict: true
  },

  components: [
    {
      path: '~/components',
    },
    {
      path: '~/components/icons',
      prefix: 'Icons', // Иконки доступны с префиксом Icons (IconsPlusIcon, IconsUserGroupIcon и т.д.)
    },
  ],

  nitro: {
    // Пресет для Netlify (SSR через Netlify Functions)
    preset: 'netlify',

    esbuild: {
      options: {
        target: 'esnext'
      }
    },
    rollupConfig: {
      output: {
        format: 'esm'
      }
    },
    // Исключаем xlsx и sharp из бандлинга через rollup external для избежания проблем с ESM на Windows
    externals: {
      external: ['xlsx', 'sharp']
    },
    // Cron задачи
    experimental: {
      tasks: true
    },
    scheduledTasks: {
      '0 * * * *': ['check-deadlines']
    },
    // Добавляем сертификаты как серверные ассеты
    serverAssets: [
      {
        baseName: 'certs',
        dir: 'server/certs'
      }
    ],
    // Раздача папки storage как статических файлов
    publicAssets: [
      {
        dir: 'storage',
        baseURL: '/storage',
        maxAge: 60 * 60 * 24 * 7 // 7 дней кэширования
      }
    ],
  }
})
