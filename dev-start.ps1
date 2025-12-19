# SAS Scuba - Development Server Startup Script
# Starts both Laravel API and Next.js frontend servers

# Load paths configuration
. .\paths.ps1

Write-Host "🚀 Starting SAS Scuba Development Servers..." -ForegroundColor Green
Write-Host ""

# Check if paths are set
if (-not (Test-Path $PHP_EXE)) {
    Write-Host "❌ PHP not found at: $PHP_EXE" -ForegroundColor Red
    Write-Host "Please check your Laragon installation." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $PROJECT_API)) {
    Write-Host "❌ API project not found at: $PROJECT_API" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $PROJECT_WEB)) {
    Write-Host "❌ Web project not found at: $PROJECT_WEB" -ForegroundColor Red
    exit 1
}

# Start Laravel API Server
Write-Host "📡 Starting Laravel API server on port $API_PORT..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_API'; Write-Host 'Laravel API Server' -ForegroundColor Cyan; $env:PATH = '$LARAGON_PHP;$env:PATH'; php artisan serve --port=$API_PORT"

# Wait a moment for API to start
Start-Sleep -Seconds 2

# Start Next.js Frontend Server
Write-Host "🌐 Starting Next.js frontend server on port $WEB_PORT..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_WEB'; Write-Host 'Next.js Frontend Server' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "✅ Development servers starting..." -ForegroundColor Green
Write-Host "   API:    http://localhost:$API_PORT" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:$WEB_PORT" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

