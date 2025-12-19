# SAS Scuba - Initial Project Setup Script
# Sets up the development environment

# Load paths configuration
. .\paths.ps1

Write-Host "🔧 SAS Scuba Development Environment Setup" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check PHP
if (Test-Path $PHP_EXE) {
    $phpVersion = & $PHP_EXE -v | Select-Object -First 1
    Write-Host "✅ PHP found: $phpVersion" -ForegroundColor Green
} else {
    Write-Host "❌ PHP not found at: $PHP_EXE" -ForegroundColor Red
    Write-Host "   Please install Laragon or update the PHP path in paths.ps1" -ForegroundColor Yellow
    exit 1
}

# Check Composer
if (Test-Path $COMPOSER_PATH) {
    Write-Host "✅ Composer found: $COMPOSER_PATH" -ForegroundColor Green
} else {
    Write-Host "⚠️  Composer not found at: $COMPOSER_PATH" -ForegroundColor Yellow
    Write-Host "   Install Composer or update the path in paths.ps1" -ForegroundColor Yellow
}

# Check Node.js
if (Test-Path $NODE_PATH) {
    $nodeVersion = & $NODE_PATH -v
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found at: $NODE_PATH" -ForegroundColor Red
    Write-Host "   Please install Node.js" -ForegroundColor Yellow
    exit 1
}

# Check MySQL (Laragon)
if (Test-Path $LARAGON_MYSQL) {
    Write-Host "✅ MySQL (Laragon) found: $LARAGON_MYSQL" -ForegroundColor Green
} else {
    Write-Host "⚠️  MySQL (Laragon) not found at: $LARAGON_MYSQL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setting up backend (Laravel API)..." -ForegroundColor Yellow
Set-Location $PROJECT_API

# Install PHP dependencies
if (Test-Path $COMPOSER_PATH) {
    Write-Host "Installing PHP dependencies..." -ForegroundColor Cyan
    & $COMPOSER_PATH install
} else {
    Write-Host "⚠️  Skipping Composer install (Composer not found)" -ForegroundColor Yellow
}

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Cyan
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env file created. Please update database credentials." -ForegroundColor Green
    }
}

# Generate application key
Write-Host "Generating application key..." -ForegroundColor Cyan
& $PHP_EXE artisan key:generate

Write-Host ""
Write-Host "Setting up frontend (Next.js)..." -ForegroundColor Yellow
Set-Location $PROJECT_WEB

# Install Node dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
& $NPM_PATH install

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update database credentials in: $PROJECT_API\.env" -ForegroundColor Cyan
Write-Host "2. Run migrations: cd $PROJECT_API; php artisan migrate" -ForegroundColor Cyan
Write-Host "3. Start development servers: .\dev-start.ps1" -ForegroundColor Cyan
Write-Host ""

Set-Location $PROJECT_ROOT

