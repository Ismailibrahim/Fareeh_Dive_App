# PowerShell script to clear Laravel route cache
Write-Host "Clearing Laravel route cache..." -ForegroundColor Yellow
php artisan route:clear
php artisan config:clear
php artisan cache:clear
Write-Host "Route cache cleared successfully!" -ForegroundColor Green

