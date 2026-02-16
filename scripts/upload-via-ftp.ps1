# Скрипт для загрузки файлов через FTP (без архива)
# Используйте FTP клиент (FileZilla, WinSCP) для загрузки папки deploy-cpanel

Write-Host "📤 Инструкция по загрузке через FTP" -ForegroundColor Cyan
Write-Host ""
Write-Host "Вместо загрузки ZIP архива, загрузите файлы напрямую через FTP:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Откройте FTP клиент (FileZilla, WinSCP или встроенный в cPanel)" -ForegroundColor White
Write-Host "2. Подключитесь к серверу:" -ForegroundColor White
Write-Host "   - Host: ftp.intra.uz (или IP сервера)" -ForegroundColor Gray
Write-Host "   - Username: ваш_пользователь_cpanel" -ForegroundColor Gray
Write-Host "   - Password: ваш_пароль_cpanel" -ForegroundColor Gray
Write-Host "   - Port: 21" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Перейдите в папку /home/intrauz1/" -ForegroundColor White
Write-Host "4. Создайте папку 'atc' (если её нет)" -ForegroundColor White
Write-Host "5. Загрузите содержимое папки 'deploy-cpanel' в 'atc'" -ForegroundColor White
Write-Host ""
Write-Host "Локальная папка для загрузки:" -ForegroundColor Cyan
Write-Host "  $(Resolve-Path '.\deploy-cpanel')" -ForegroundColor Green
Write-Host ""
Write-Host "Целевая папка на сервере:" -ForegroundColor Cyan
Write-Host "  /home/intrauz1/atc/" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Преимущества:" -ForegroundColor Green
Write-Host "  - Нет проблем с антивирусом" -ForegroundColor White
Write-Host "  - Быстрее для больших файлов" -ForegroundColor White
Write-Host "  - Можно обновлять отдельные файлы" -ForegroundColor White
