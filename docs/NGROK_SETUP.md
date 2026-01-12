# Настройка ngrok для проекта

## Что такое ngrok?

ngrok — это инструмент для создания безопасных туннелей к вашему локальному серверу, позволяющий получить публичный URL для доступа к приложению из интернета. Это полезно для:
- Тестирования webhook'ов (например, Telegram-бота)
- Демонстрации проекта клиентам
- Тестирования на мобильных устройствах
- Интеграции с внешними сервисами

## Установка ngrok

### Вариант 1: Через Homebrew (рекомендуется для macOS)
```bash
brew install ngrok/ngrok/ngrok
```

### Вариант 2: Скачать вручную
1. Перейдите на [ngrok.com/download](https://ngrok.com/download)
2. Скачайте версию для macOS
3. Распакуйте архив и переместите в `/usr/local/bin`:
```bash
unzip ~/Downloads/ngrok-v3-stable-darwin-amd64.zip
sudo mv ngrok /usr/local/bin/
```

## Регистрация и получение токена

1. Зарегистрируйтесь на [ngrok.com](https://dashboard.ngrok.com/signup)
2. Получите ваш authtoken на [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Настройте токен:
```bash
ngrok config add-authtoken ВАШ_ТОКЕН
```

## Настройка проекта

### 1. Обновите nuxt.config.ts

Файл уже настроен, но убедитесь, что `devServer.host` установлен правильно:

```typescript
devServer: {
  host: '0.0.0.0', // Важно для ngrok
  port: 3000,
}
```

### 2. Добавьте переменные окружения

Добавьте в `.env`:
```env
# Ngrok настройки (опционально)
NGROK_DOMAIN=your-custom-domain.ngrok-free.app  # Только для платных аккаунтов
APP_URL=http://localhost:3000  # Будет заменён на ngrok URL при использовании
```

## Использование

### Базовое использование

1. **Запустите dev-сервер:**
```bash
npm run dev
```

2. **В новом терминале запустите ngrok:**
```bash
ngrok http 3000
```

3. **Скопируйте публичный URL** из вывода ngrok (например, `https://abc123.ngrok-free.app`)

### Использование с доменом (платный аккаунт)

```bash
ngrok http --domain=your-custom-domain.ngrok-free.app 3000
```

### Использование с конфигурацией

Создайте файл `ngrok.yml` в корне проекта:
```yaml
version: "2"
authtoken: ВАШ_ТОКЕН
tunnels:
  nuxt-dev:
    proto: http
    addr: 3000
    inspect: true
    # Для платного аккаунта:
    # domain: your-custom-domain.ngrok-free.app
```

Запуск с конфигурацией:
```bash
ngrok start nuxt-dev
```

## Скрипты для package.json

Добавьте в `package.json` удобные команды:

```json
{
  "scripts": {
    "dev:tunnel": "concurrently \"npm run dev\" \"ngrok http 3000\"",
    "ngrok": "ngrok http 3000",
    "ngrok:config": "ngrok start nuxt-dev"
  }
}
```

> **Примечание:** Для `dev:tunnel` нужно установить `concurrently`:
> ```bash
> npm install -D concurrently
> ```

## Настройка для Telegram-бота

Если вы используете Telegram-бота, после запуска ngrok:

1. Получите публичный URL (например, `https://abc123.ngrok-free.app`)
2. Обновите webhook бота:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://abc123.ngrok-free.app/api/telegram/webhook"
```

Или добавьте API endpoint для автоматической настройки webhook'а.

## Важные замечания

### Безопасность
- ⚠️ **Не используйте ngrok для production!** Только для разработки и тестирования
- Бесплатная версия показывает предупреждение при первом посещении
- URL меняется при каждом перезапуске (если нет платного аккаунта)

### Ограничения бесплатной версии
- Случайный URL при каждом запуске
- Ограничение на количество соединений
- Предупреждающая страница для посетителей
- 1 онлайн процесс одновременно

### Рекомендации
- Используйте платный аккаунт для постоянного домена
- Для production используйте реальный хостинг
- Логируйте все запросы через ngrok для отладки

## Альтернативы ngrok

- **localtunnel** - бесплатная альтернатива
- **serveo** - SSH-туннели
- **cloudflared** - от Cloudflare
- **localhost.run** - простой SSH-туннель

## Отладка

### Проверка статуса туннеля
Откройте в браузере: `http://localhost:4040`

Здесь вы увидите:
- Все HTTP-запросы
- Заголовки
- Тело запросов/ответов
- Время выполнения

### Проблемы и решения

**Проблема:** "ERR_NGROK_108"
**Решение:** Проверьте authtoken и лимиты аккаунта

**Проблема:** Приложение недоступно
**Решение:** Убедитесь, что `host: '0.0.0.0'` в `nuxt.config.ts`

**Проблема:** Медленная работа
**Решение:** Это нормально для бесплатной версии, используйте платный аккаунт

## Полезные команды

```bash
# Проверка версии
ngrok version

# Просмотр конфигурации
ngrok config check

# Список активных туннелей
ngrok api tunnels list

# Остановка всех туннелей
pkill ngrok
```

## Пример workflow

1. Разработка локально: `npm run dev`
2. Нужно показать клиенту: `ngrok http 3000`
3. Отправить ссылку клиенту
4. После демо: остановить ngrok (Ctrl+C)
