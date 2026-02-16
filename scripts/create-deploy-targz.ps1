# Создание TAR.GZ архива вместо ZIP
# TAR.GZ реже вызывает ложные срабатывания антивируса

Write-Host "📦 Создание TAR.GZ архива..." -ForegroundColor Cyan

$deployPath = ".\deploy-cpanel"
$archiveName = "deploy-cpanel-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"

# Проверка наличия папки
if (-not (Test-Path $deployPath)) {
    Write-Host "❌ Папка deploy-cpanel не найдена!" -ForegroundColor Red
    Write-Host "Сначала выполните: .\scripts\create-deploy-cpanel.ps1" -ForegroundColor Yellow
    exit 1
}

# Для создания TAR.GZ в Windows нужен WSL или 7-Zip
# Проверяем наличие tar (в Windows 10+ встроен)
$tarExists = Get-Command tar -ErrorAction SilentlyContinue

if ($tarExists) {
    Write-Host "✅ Используем встроенный tar..." -ForegroundColor Green
    
    # Создаем TAR.GZ архив
    tar -czf $archiveName -C $deployPath .
    
    if (Test-Path $archiveName) {
        $size = [math]::Round((Get-Item $archiveName).Length / 1MB, 2)
        Write-Host ""
        Write-Host "✅ TAR.GZ архив создан успешно!" -ForegroundColor Green
        Write-Host "📦 Файл: $archiveName" -ForegroundColor Cyan
        Write-Host "📊 Размер: $size MB" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📤 Загрузите этот архив на сервер и распакуйте:" -ForegroundColor Yellow
        Write-Host "   tar -xzf $archiveName -C /home/intrauz1/atc/" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  Команда tar не найдена" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Используйте один из вариантов:" -ForegroundColor Cyan
    Write-Host "1. Загрузите файлы через FTP (см. upload-via-ftp.ps1)" -ForegroundColor White
    Write-Host "2. Установите 7-Zip и используйте его для создания .tar.gz" -ForegroundColor White
    Write-Host "3. Используйте WSL: wsl tar -czf $archiveName -C deploy-cpanel ." -ForegroundColor White
}
