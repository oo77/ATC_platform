# Скрипт создания деплой-пакета для cPanel (Passenger Node.js)
# Упаковывает .output и необходимые файлы для развертывания

Write-Host "🚀 Создание деплой-пакета для cPanel..." -ForegroundColor Cyan

# Проверка наличия .output
if (-not (Test-Path ".\.output")) {
    Write-Host "❌ Папка .output не найдена!" -ForegroundColor Red
    Write-Host "Сначала выполните: npm run build" -ForegroundColor Yellow
    exit 1
}

# Пути
$outputPath = ".\.output"
$deployPath = ".\deploy-cpanel"

# Очистка предыдущего деплой-пакета
if (Test-Path $deployPath) {
    Write-Host "🧹 Очистка предыдущего деплой-пакета..." -ForegroundColor Yellow
    Remove-Item $deployPath -Recurse -Force
}

# Создание структуры
Write-Host "📁 Создание структуры папок..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $deployPath -Force | Out-Null

# Копирование .output (весь собранный проект)
Write-Host "📦 Копирование .output..." -ForegroundColor Yellow
Copy-Item "$outputPath" "$deployPath\.output" -Recurse -Force

# Копирование package.json и package-lock.json
Write-Host "📦 Копирование package.json..." -ForegroundColor Yellow
Copy-Item ".\package.json" "$deployPath\package.json" -Force
if (Test-Path ".\package-lock.json") {
    Copy-Item ".\package-lock.json" "$deployPath\package-lock.json" -Force
}

# Копирование .htaccess
Write-Host "📦 Копирование .htaccess..." -ForegroundColor Yellow
if (Test-Path ".\.htaccess") {
    Copy-Item ".\.htaccess" "$deployPath\.htaccess" -Force
} else {
    Write-Host "⚠️  .htaccess не найден, создаю новый..." -ForegroundColor Yellow
    $htaccess = @"
# Passenger Node.js Configuration
PassengerEnabled on
PassengerNodejs /usr/bin/node
PassengerStartupFile .output/server/index.mjs
PassengerAppEnv production
PassengerRestartDir tmp
PassengerLogLevel 3
PassengerMinInstances 1
PassengerMaxPoolSize 6
PassengerFriendlyErrorPages on

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ - [L]
</IfModule>
"@
    Set-Content "$deployPath\.htaccess" $htaccess -Encoding UTF8
}

# Копирование .env.example как шаблон
Write-Host "📦 Копирование .env.example..." -ForegroundColor Yellow
if (Test-Path ".\.env.example") {
    Copy-Item ".\.env.example" "$deployPath\.env.example" -Force
}

# Создание необходимых папок
Write-Host "📁 Создание папок storage и tmp..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$deployPath\storage\ai-import-temp" -Force | Out-Null
New-Item -ItemType Directory -Path "$deployPath\storage\certificates" -Force | Out-Null
New-Item -ItemType Directory -Path "$deployPath\storage\uploads" -Force | Out-Null
New-Item -ItemType Directory -Path "$deployPath\tmp" -Force | Out-Null

# Копирование server/certs если есть
if (Test-Path ".\server\certs") {
    Write-Host "📦 Копирование SSL сертификатов..." -ForegroundColor Yellow
    Copy-Item ".\server\certs" "$deployPath\server\certs" -Recurse -Force
}

# Создание .gitkeep для пустых папок
"" | Out-File "$deployPath\storage\.gitkeep" -Encoding UTF8
"" | Out-File "$deployPath\tmp\.gitkeep" -Encoding UTF8

# Создание README с инструкциями
Write-Host "📝 Создание README..." -ForegroundColor Yellow
$readme = @"
# Деплой-пакет для cPanel (Passenger Node.js)

## Содержимое пакета:
- `.output/` - собранное Nuxt 3 приложение
- `package.json` - список зависимостей
- `package-lock.json` - точные версии пакетов
- `.htaccess` - конфигурация Passenger
- `.env.example` - шаблон переменных окружения
- `storage/` - папки для загруженных файлов
- `tmp/` - папка для перезапуска приложения

## Инструкция по развертыванию:

### 1. Загрузка на сервер
Загрузите все файлы из этого пакета в `/home/intrauz1/atc/` (или ваш путь)

### 2. Настройка Node.js приложения в cPanel
1. Откройте **Setup Node.js App** в cPanel
2. Заполните:
   - Node.js version: 24.13 (или последняя)
   - Application mode: Production
   - Application root: `atc`
   - Application URL: `intra.uz`
   - Application startup file: `.output/server/index.mjs`
3. Нажмите **Create**

### 3. Установка зависимостей
В интерфейсе Node.js App нажмите **"Run NPM Install"**

Или через SSH:
``````bash
cd /home/intrauz1/atc
npm install --production
``````

### 4. Настройка переменных окружения
В интерфейсе Node.js App добавьте переменные из `.env.example`:

**Обязательные:**
- NODE_ENV=production
- DATABASE_HOST=localhost
- DATABASE_PORT=3306
- DATABASE_USER=ваш_пользователь
- DATABASE_PASSWORD=ваш_пароль
- DATABASE_NAME=ваша_база
- JWT_SECRET=случайная_строка_64_символа
- REFRESH_TOKEN_SECRET=другая_случайная_строка_64_символа
- AUTO_MIGRATE=true

**Опциональные (если используются):**
- TELEGRAM_BOT_TOKEN
- OPENAI_API_KEY
- USE_OPENROUTER=true

### 5. Создание базы данных
1. Откройте **MySQL Databases** в cPanel
2. Создайте БД и пользователя
3. Добавьте пользователя к БД с полными правами

### 6. Установка прав доступа
``````bash
chmod -R 755 /home/intrauz1/atc/storage
chmod -R 755 /home/intrauz1/atc/tmp
``````

### 7. Запуск приложения
В интерфейсе Node.js App нажмите **"Start App"**

### 8. Проверка
Откройте `https://intra.uz` в браузере

## Перезапуск приложения
``````bash
touch /home/intrauz1/atc/tmp/restart.txt
``````

## Обновление приложения
1. Соберите новую версию локально: `npm run build`
2. Загрузите новую папку `.output` на сервер (замените старую)
3. Перезапустите: `touch tmp/restart.txt`

## Размер пакета:
- Без node_modules: ~20-50 MB
- С зависимостями: ~150-300 MB (устанавливаются на сервере)

## Поддержка:
Подробная инструкция: см. CPANEL_DEPLOY.md в корне проекта
"@

Set-Content "$deployPath\README.md" $readme -Encoding UTF8

# Создание архива
Write-Host "📦 Создание ZIP архива..." -ForegroundColor Yellow
$archiveName = "deploy-cpanel-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"

Compress-Archive -Path "$deployPath\*" -DestinationPath $archiveName -Force

$archiveSize = (Get-Item $archiveName).Length / 1MB
$folderSize = (Get-ChildItem $deployPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host ""
Write-Host "✅ Деплой-пакет создан успешно!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📦 Архив: $archiveName" -ForegroundColor Cyan
Write-Host "📊 Размер архива: $([math]::Round($archiveSize, 2)) MB" -ForegroundColor Cyan
Write-Host "📁 Размер распакованного: $([math]::Round($folderSize, 2)) MB" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📤 Следующие шаги:" -ForegroundColor Yellow
Write-Host "1. Загрузите архив на сервер через File Manager" -ForegroundColor White
Write-Host "2. Распакуйте в /home/intrauz1/atc/" -ForegroundColor White
Write-Host "3. Следуйте инструкциям в README.md" -ForegroundColor White
Write-Host "4. Подробная документация: CPANEL_DEPLOY.md" -ForegroundColor White
Write-Host ""
