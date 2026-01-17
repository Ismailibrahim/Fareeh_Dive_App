# SAS Scuba - Testing Environment Deployment Script (PowerShell)
# ⚠️ WARNING: This script is for TESTING purposes only
# Review and customize before running

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Configuration
$PROJECT_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$API_DIR = Join-Path $PROJECT_ROOT "sas-scuba-api"
$WEB_DIR = Join-Path $PROJECT_ROOT "sas-scuba-web"

Write-ColorOutput Green "=== SAS Scuba Deployment Script (Testing) ==="
Write-Output ""

# Check prerequisites
Write-ColorOutput Yellow "Checking prerequisites..."

# Check PHP
try {
    $phpVersion = & php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;"
    Write-ColorOutput Green "✓ PHP found: $phpVersion"
} catch {
    Write-ColorOutput Red "✗ PHP is required but not installed."
    exit 1
}

# Check Composer
try {
    $composerVersion = & composer --version
    Write-ColorOutput Green "✓ Composer found"
} catch {
    Write-ColorOutput Red "✗ Composer is required but not installed."
    exit 1
}

# Check Node.js
try {
    $nodeVersion = & node -v
    Write-ColorOutput Green "✓ Node.js found: $nodeVersion"
} catch {
    Write-ColorOutput Red "✗ Node.js is required but not installed."
    exit 1
}

# Check npm
try {
    $npmVersion = & npm -v
    Write-ColorOutput Green "✓ npm found: $npmVersion"
} catch {
    Write-ColorOutput Red "✗ npm is required but not installed."
    exit 1
}

Write-Output ""

# Backend Deployment
Write-ColorOutput Yellow "=== Deploying Backend (Laravel API) ==="

Set-Location $API_DIR

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-ColorOutput Yellow "⚠ .env file not found. Please create it from .env.example"
    Write-ColorOutput Yellow "Continuing with existing configuration..."
} else {
    Write-ColorOutput Green "✓ .env file found"
}

# Install dependencies
Write-ColorOutput Yellow "Installing PHP dependencies..."
& composer install --no-dev --optimize-autoloader

# Generate app key if not set
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
if ($envContent -notmatch "APP_KEY=base64:") {
    Write-ColorOutput Yellow "Generating application key..."
    & php artisan key:generate --force
}

# Create storage link
Write-ColorOutput Yellow "Creating storage link..."
try {
    & php artisan storage:link
} catch {
    Write-ColorOutput Yellow "Storage link may already exist"
}

# Set permissions (Windows doesn't use chmod, but we can try)
Write-ColorOutput Yellow "Note: On Windows, ensure storage directories are writable"

# Run migrations
Write-ColorOutput Yellow "Running database migrations..."
$runMigrations = Read-Host "Do you want to run migrations? (y/n)"
if ($runMigrations -eq "y" -or $runMigrations -eq "Y") {
    & php artisan migrate --force
} else {
    Write-ColorOutput Yellow "Skipping migrations"
}

# Cache configuration
Write-ColorOutput Yellow "Caching configuration..."
& php artisan config:cache
& php artisan route:cache
& php artisan view:cache

# Build assets
Write-ColorOutput Yellow "Building assets..."
if (Test-Path "package.json") {
    & npm install
    & npm run build
}

Write-ColorOutput Green "✓ Backend deployment complete"
Write-Output ""

# Frontend Deployment
Write-ColorOutput Yellow "=== Deploying Frontend (Next.js) ==="

Set-Location $WEB_DIR

# Check if .env.local exists
if (-Not (Test-Path ".env.local")) {
    Write-ColorOutput Yellow "⚠ .env.local file not found. Please create it"
    Write-ColorOutput Yellow "Continuing with existing configuration..."
} else {
    Write-ColorOutput Green "✓ .env.local file found"
}

# Install dependencies
Write-ColorOutput Yellow "Installing Node.js dependencies..."
& npm install

# Build application
Write-ColorOutput Yellow "Building Next.js application..."
& npm run build

Write-ColorOutput Green "✓ Frontend deployment complete"
Write-Output ""

# Summary
Write-ColorOutput Green "=== Deployment Summary ==="
Write-ColorOutput Green "Backend: $API_DIR"
Write-ColorOutput Green "Frontend: $WEB_DIR"
Write-Output ""
Write-ColorOutput Yellow "Next Steps:"
Write-Output "1. Configure web server (Apache/Nginx)"
Write-Output "2. Set up reverse proxy for frontend"
Write-Output "3. Configure SSL certificates (recommended)"
Write-Output "4. Test the application"
Write-Output "5. Review DEPLOYMENT_GUIDE.md for detailed instructions"
Write-Output ""
Write-ColorOutput Red "⚠️  REMEMBER: This is for TESTING only. Not production ready!"
Write-Output ""

