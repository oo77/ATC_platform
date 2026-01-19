#!/bin/bash

# 🚀 Скрипт деплоя на Ahost (сборка локально)
# Использование: ./deploy-to-ahost.sh

set -e

echo "🚀 Деплой ATC Platform на Ahost"
echo "================================"

# Конфигурация (измените на свои значения)
SERVER_USER="uzairpor"
SERVER_HOST="edu.uzairports.com"
SERVER_PATH="/home/uzairpor/apps/atc-platform"
APP_NAME="atc-platform"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Проверка, что мы в правильной директории
if [ ! -f "package.json" ]; then
    log_error "Ошибка: package.json не найден. Запустите скрипт из корня проекта."
    exit 1
fi

# Шаг 1: Проверка изменений
log_info "Проверка Git статуса..."
if [[ -n $(git status -s) ]]; then
    log_warn "Есть незакоммиченные изменения:"
    git status -s
    read -p "Продолжить? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Шаг 2: Установка зависимостей
log_info "Установка зависимостей..."
npm install

# Шаг 3: Проверка типов (опционально)
log_info "Проверка типов..."
npm run typecheck || log_warn "Проверка типов завершилась с предупреждениями"

# Шаг 4: Сборка проекта
log_info "Сборка проекта..."
npm run build

if [ ! -d ".output" ]; then
    log_error "Ошибка: .output директория не создана"
    exit 1
fi

# Шаг 5: Создание архива для деплоя
log_info "Создание архива для деплоя..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="atc-deploy-${TIMESTAMP}.tar.gz"

tar -czf "$ARCHIVE_NAME" \
    .output \
    package.json \
    package-lock.json \
    ecosystem.config.js \
    .env.example

log_info "Архив создан: $ARCHIVE_NAME ($(du -h "$ARCHIVE_NAME" | cut -f1))"

# Шаг 6: Загрузка на сервер
log_info "Загрузка на сервер..."
scp "$ARCHIVE_NAME" "${SERVER_USER}@${SERVER_HOST}:/tmp/"

# Шаг 7: Деплой на сервере
log_info "Деплой на сервере..."
ssh "${SERVER_USER}@${SERVER_HOST}" << ENDSSH
    set -e
    
    echo "📦 Распаковка архива..."
    cd "$SERVER_PATH"
    
    # Бэкап текущей версии
    if [ -d ".output" ]; then
        echo "💾 Создание бэкапа..."
        mv .output .output.backup.$TIMESTAMP
    fi
    
    # Распаковка нового архива
    tar -xzf /tmp/$ARCHIVE_NAME
    
    # Установка только production зависимостей
    echo "📚 Установка production зависимостей..."
    npm ci --production --prefer-offline
    
    # Перезапуск PM2
    echo "🔄 Перезапуск приложения..."
    pm2 restart $APP_NAME || pm2 start ecosystem.config.js
    
    # Проверка статуса
    echo "✅ Проверка статуса..."
    pm2 status $APP_NAME
    
    # Очистка
    rm /tmp/$ARCHIVE_NAME
    
    echo "✨ Деплой завершен успешно!"
ENDSSH

# Шаг 8: Очистка локального архива
log_info "Очистка..."
rm "$ARCHIVE_NAME"

# Шаг 9: Проверка доступности
log_info "Проверка доступности приложения..."
sleep 3
if curl -f -s "http://${SERVER_HOST}:3000/api/health" > /dev/null 2>&1; then
    log_info "✨ Приложение успешно развернуто и работает!"
else
    log_warn "Приложение развернуто, но health check не прошел. Проверьте логи:"
    log_warn "ssh ${SERVER_USER}@${SERVER_HOST} 'pm2 logs ${APP_NAME} --lines 50'"
fi

echo ""
echo "================================"
echo "🎉 Деплой завершен!"
echo "================================"
echo ""
echo "Полезные команды:"
echo "  Логи:      ssh ${SERVER_USER}@${SERVER_HOST} 'pm2 logs ${APP_NAME}'"
echo "  Статус:    ssh ${SERVER_USER}@${SERVER_HOST} 'pm2 status'"
echo "  Рестарт:   ssh ${SERVER_USER}@${SERVER_HOST} 'pm2 restart ${APP_NAME}'"
echo ""
