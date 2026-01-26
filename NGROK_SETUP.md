# Настройка ngrok со статическим доменом

## Шаг 1: Получите authtoken

1. Перейдите на https://dashboard.ngrok.com/get-started/your-authtoken
2. Скопируйте ваш authtoken
3. Откройте файл `ngrok.yml` в корне проекта
4. Замените `YOUR_AUTH_TOKEN_HERE` на ваш реальный токен

## Шаг 2: Создайте статический домен

1. Перейдите на https://dashboard.ngrok.com/cloud-edge/domains
2. Нажмите **"+ New Domain"** или **"Create Domain"**
3. На бесплатном тарифе вам дадут один статический домен вида: `your-name-12345.ngrok-free.app`
4. Скопируйте этот домен
5. Откройте файл `ngrok.yml`
6. Замените `YOUR_STATIC_DOMAIN_HERE` на ваш домен

## Шаг 3: Запустите ngrok

После настройки файла `ngrok.yml`, используйте команду:

```bash
npm run ngrok:config
```

Или напрямую:

```bash
ngrok start nuxt-dev
```

## Проверка конфигурации

Ваш `ngrok.yml` должен выглядеть примерно так:

```yaml
version: "2"
authtoken: 2abc123def456ghi789jkl0mnop1qrs_2tuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ

tunnels:
  nuxt-dev:
    proto: http
    addr: 3000
    domain: atc-platform-abc123.ngrok-free.app
    inspect: true
```

## Использование

После настройки ваш URL будет **всегда одинаковым**:
- `https://atc-platform-abc123.ngrok-free.app` (ваш статический домен)

Этот URL можно использовать в настройках Telegram Mini App без изменений.

## Важно

⚠️ **Не коммитьте файл `ngrok.yml` в git!** Он содержит ваш приватный токен.

Файл уже добавлен в `.gitignore` (проверьте).

## Альтернатива: Переменные окружения

Если не хотите хранить токен в файле, можете использовать:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

Это сохранит токен в системную конфигурацию ngrok.
