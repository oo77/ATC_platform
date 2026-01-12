# Nuxt TailAdmin - Admin Dashboard

Современная административная панель на базе Nuxt 4, Tailwind CSS 4 и MySQL.

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Настройка базы данных

1. Создайте базу данных MySQL
2. Скопируйте `.env.example` в `.env` и настройте подключение:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nuxt_tailadmin
```

3. Примените миграции:

```bash
npm run db:migrate
```

### Запуск dev-сервера

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

## 🗄️ Управление базой данных

### Миграции

```bash
# Применить все непримененные миграции
npm run db:migrate

# Откатить последнюю миграцию
npm run db:rollback

# Откатить все миграции
npm run db:rollback:all

# Показать статус миграций
npm run db:status
```

Подробная документация: [docs/DATABASE_MIGRATIONS.md](docs/DATABASE_MIGRATIONS.md)

### Учетные данные по умолчанию

После применения миграций будет создан администратор:

- **Email**: `admin@atc.uz`
- **Пароль**: `admin123`

⚠️ **ВАЖНО**: Смените пароль после первого входа!

## 📁 Структура проекта

```
nuxt-tailadmin/
├── app/                    # Клиентская часть
│   ├── components/         # Vue-компоненты
│   ├── composables/        # Composables
│   ├── layouts/            # Layouts
│   ├── pages/              # Страницы (роутинг)
│   └── plugins/            # Плагины
├── server/                 # Серверная часть
│   ├── api/                # API endpoints
│   ├── database/           # База данных
│   │   ├── migrations/     # Миграции БД
│   │   ├── migrator.ts     # Движок миграций
│   │   └── init.ts         # Инициализация БД
│   ├── middleware/         # Server middleware
│   └── utils/              # Утилиты
├── docs/                   # Документация
└── public/                 # Статические файлы
```

## 🛠️ Технологии

- **Framework**: Nuxt 4
- **Styling**: Tailwind CSS 4
- **Database**: MySQL 8+
- **Authentication**: JWT
- **UI Components**: Custom components
- **Charts**: ApexCharts
- **Calendar**: FullCalendar
- **Icons**: Lucide Vue Next

## 📚 Документация

- [Система миграций БД](docs/DATABASE_MIGRATIONS.md)
- [Nuxt Documentation](https://nuxt.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🏗️ Production

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

Подробнее: [Nuxt Deployment](https://nuxt.com/docs/getting-started/deployment)

## 📝 Лицензия

Частный проект
