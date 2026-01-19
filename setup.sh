#!/bin/bash

# ==============================================
# Скрипт подготовки сервера для первого деплоя
# ==============================================

set -e

echo "🔧 Подготовка окружения для ATC Platform..."
echo ""

# Создание директории для логов PM2
echo "📁 Создание директории для логов..."
mkdir -p logs
chmod 755 logs
echo "✅ Директория logs создана"
echo ""

# Создание директории для storage
echo "📁 Создание директории для загрузок..."
mkdir -p storage/uploads
mkdir -p storage/certificates
mkdir -p storage/documents
mkdir -p storage/avatars
chmod -R 755 storage
echo "✅ Директории storage созданы"
echo ""

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "⚠️  Файл .env не найден!"
    echo "📝 Создание .env из .env.example..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Файл .env создан из .env.example"
        echo "⚠️  ВАЖНО: Отредактируйте .env и заполните все необходимые переменные!"
        echo "   nano .env"
    else
        echo "❌ Файл .env.example не найден!"
        echo "   Создайте .env вручную"
    fi
else
    echo "✅ Файл .env уже существует"
fi
echo ""

# Проверка Node.js версии
echo "🔍 Проверка версии Node.js..."
NODE_VERSION=$(node -v)
echo "   Установлена версия: $NODE_VERSION"

REQUIRED_VERSION="v20"
if [[ $NODE_VERSION == $REQUIRED_VERSION* ]]; then
    echo "✅ Версия Node.js подходит"
else
    echo "⚠️  Рекомендуется Node.js 20.x"
    echo "   Текущая версия: $NODE_VERSION"
fi
echo ""

# Проверка PM2
echo "🔍 Проверка PM2..."
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    echo "✅ PM2 установлен (версия $PM2_VERSION)"
else
    echo "⚠️  PM2 не установлен!"
    echo "   Установите: sudo npm install -g pm2"
fi
echo ""

# Проверка MySQL
echo "🔍 Проверка MySQL..."
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    echo "✅ MySQL установлен"
    echo "   $MYSQL_VERSION"
else
    echo "⚠️  MySQL не найден!"
    echo "   Установите: sudo apt install mysql-server"
fi
echo ""

# Проверка Nginx
echo "🔍 Проверка Nginx..."
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1)
    echo "✅ Nginx установлен"
    echo "   $NGINX_VERSION"
else
    echo "⚠️  Nginx не найден!"
    echo "   Установите: sudo apt install nginx"
fi
echo ""

echo "✅ Подготовка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Отредактируйте .env файл: nano .env"
echo "   2. Установите зависимости: npm install --production"
echo "   3. Соберите приложение: npm run build"
echo "   4. Примените миграции: npm run db:migrate"
echo "   5. Запустите приложение: pm2 start ecosystem.config.cjs"
echo ""
