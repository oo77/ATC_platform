# Руководство по деплою ATC Nuxt Application

## Содержание

1. [Требования](#требования)
2. [Деплой на Netlify (тестирование)](#деплой-на-netlify-тестирование)
3. [Деплой на VPS/ahost (production)](#деплой-на-vpsahost-production)
4. [Настройка внешней базы данных](#настройка-внешней-базы-данных)
5. [Ограничения платформ](#ограничения-платформ)

---

## Требования

### Версии пакетов

| Пакет | Версия | Примечание |
|-------|--------|------------|
| Nuxt | 4.2.2 | Последняя стабильная |
| Node.js | 18+ | Рекомендуется 20.x |
| MySQL | 8.0+ | Обязательно |
| Vue | 3.5.x | Включено |

### Системные зависимости

- **Node.js 18+** — обязательно
- **MySQL 8.0+** — или внешний сервис
- **Chromium** — только для генерации PDF (не работает на Netlify)

---

## Деплой на Netlify (тестирование)

### Шаг 1: Подготовка внешней базы данных

Netlify не предоставляет MySQL. Используйте внешний сервис:

| Сервис | URL | Бесплатный план |
|--------|-----|-----------------|
| PlanetScale | https://planetscale.com | 5GB |
| Railway | https://railway.app | $5/month |
| TiDB Cloud | https://tidbcloud.com | 5GB |
| Aiven | https://aiven.io | 30 дней триал |

#### Настройка PlanetScale (рекомендуется)

```bash
# 1. Создайте аккаунт и базу данных на planetscale.com
# 2. Получите connection string:
#    - Host: aws.connect.psdb.cloud
#    - Username: ваш_username
#    - Password: ваш_password
#    - Database: ваш_database
```

### Шаг 2: Подключение репозитория к Netlify

1. Войдите на [app.netlify.com](https://app.netlify.com)
2. Нажмите **"Add new site"** → **"Import an existing project"**
3. Выберите ваш Git-провайдер (GitHub/GitLab)
4. Выберите репозиторий `nuxt-tailadmin`

### Шаг 3: Настройка Environment Variables

В Netlify Dashboard → **Site settings** → **Environment variables**:

```
DATABASE_HOST = your-database-host.com
DATABASE_PORT = 3306
DATABASE_USER = your_username
DATABASE_PASSWORD = your_password
DATABASE_NAME = atc_test

JWT_SECRET = your-super-secret-jwt-key-minimum-64-characters
JWT_EXPIRES_IN = 7d
REFRESH_TOKEN_SECRET = another-super-secret-key-minimum-64-characters
REFRESH_TOKEN_EXPIRES_IN = 30d

TELEGRAM_BOT_TOKEN = your_telegram_bot_token
TELEGRAM_WEBHOOK_SECRET = your_webhook_secret

NODE_ENV = production
AUTO_MIGRATE = true
```

> ⚠️ **ВАЖНО:** Установите `AUTO_MIGRATE=true` для автоматического применения миграций при первом запуске!

### Шаг 4: Деплой

```bash
# Netlify автоматически выполнит:
npm install
npm run build  # nuxt build
# + AUTO_MIGRATE=true запустит миграции при первом запросе
```

### Что работает на Netlify

| Функционал | Статус |
|------------|--------|
| ✅ Авторизация/JWT | Работает |
| ✅ CRUD операции | Работает |
| ✅ Telegram Bot | Работает |
| ✅ Расписание/Группы/Курсы | Работает |
| ✅ Импорт Excel | Работает |
| ✅ Тестирование студентов | Работает |
| ❌ Генерация PDF сертификатов | **НЕ работает** |
| ❌ Постоянное хранение файлов | **НЕ работает** |

---

## Деплой на VPS/ahost (production)

### Шаг 1: Подготовка сервера

Минимальные требования:
- **RAM:** 2 GB+
- **CPU:** 1 vCPU
- **Disk:** 10 GB+
- **OS:** Ubuntu 22.04 / Debian 11+

```bash
# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2
sudo npm install -g pm2

# Установка MySQL 8
sudo apt-get install -y mysql-server

# Установка зависимостей для Puppeteer (генерация PDF)
sudo apt-get install -y \
  chromium-browser \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  fonts-liberation \
  libappindicator3-1 \
  libnss3 \
  lsb-release \
  xdg-utils
```

### Шаг 2: Настройка MySQL

```bash
# Войдите в MySQL
sudo mysql

# Создайте базу данных и пользователя
CREATE DATABASE atc_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'atc_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON atc_production.* TO 'atc_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Шаг 3: Клонирование и настройка

```bash
# Клонируйте репозиторий
cd /var/www
git clone <your-repo-url> atc-nuxt
cd atc-nuxt

# Установите зависимости
npm ci

# Создайте .env файл
cp .env.example .env
nano .env  # Отредактируйте с вашими значениями
```

### Шаг 4: Миграции и сборка

```bash
# Примените миграции
npm run db:migrate

# Соберите production-билд
npm run build
```

### Шаг 5: Настройка PM2

```bash
# Создайте конфигурацию PM2
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'atc-nuxt',
    script: '.output/server/index.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/atc-error.log',
    out_file: '/var/log/pm2/atc-out.log',
    time: true
  }]
}
EOF

# Создайте директорию для логов
sudo mkdir -p /var/log/pm2

# Запустите приложение
pm2 start ecosystem.config.cjs

# Настройте автозапуск
pm2 startup
pm2 save
```

### Шаг 6: Настройка Nginx (reverse proxy)

```bash
sudo apt-get install -y nginx

# Создайте конфигурацию
sudo nano /etc/nginx/sites-available/atc-nuxt
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Статические файлы из storage
    location /storage/ {
        alias /var/www/atc-nuxt/storage/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Ограничение размера загрузки
    client_max_body_size 50M;
}
```

```bash
# Активируйте конфигурацию
sudo ln -s /etc/nginx/sites-available/atc-nuxt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 7: SSL с Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Настройка внешней базы данных

### PlanetScale

```env
DATABASE_HOST=aws.connect.psdb.cloud
DATABASE_PORT=3306
DATABASE_USER=your_planetscale_username
DATABASE_PASSWORD=pscale_pw_xxxxx
DATABASE_NAME=atc_db
```

> ⚠️ PlanetScale использует SSL по умолчанию. Может потребоваться добавить: `?ssl={"rejectUnauthorized":true}`

### Railway

```env
DATABASE_HOST=containers-us-west-XXX.railway.app
DATABASE_PORT=XXXXX
DATABASE_USER=root
DATABASE_PASSWORD=xxxxxxxx
DATABASE_NAME=railway
```

---

## Ограничения платформ

| Платформа | MySQL | Puppeteer/PDF | File Storage | Telegram |
|-----------|-------|---------------|--------------|----------|
| **Netlify** | Только внешний | ❌ | ❌ Stateless | ✅ |
| **Vercel** | Только внешний | ❌ | ❌ Stateless | ✅ |
| **Railway** | ✅ Встроенный | ✅ (Docker) | ⚠️ Volume | ✅ |
| **Render** | ✅ Встроенный | ✅ (Docker) | ✅ Disk | ✅ |
| **VPS/ahost** | ✅ Полный | ✅ Полный | ✅ Полный | ✅ |

---

## Команды для быстрого старта

```bash
# Локальная разработка
npm run dev

# Сборка production
npm run build

# Предпросмотр production-сборки
npm run preview

# Миграции
npm run db:migrate       # Применить
npm run db:status        # Статус
npm run db:rollback      # Откатить последнюю

# Заполнение тестовыми данными
npm run db:seed
npm run db:seed:tests    # Датасет для тестирования
```

---

## Troubleshooting

### Ошибка подключения к БД на Netlify

```
Error: ECONNREFUSED 127.0.0.1:3306
```

**Решение:** Убедитесь, что указали правильный внешний хост базы данных в Environment Variables.

### Миграции не применяются

**Решение:** Проверьте `AUTO_MIGRATE=true` в Environment Variables.

### PDF не генерируется

**Причина:** Netlify не поддерживает headless Chrome.  
**Решение:** Используйте VPS или Railway с Docker для полного функционала.
