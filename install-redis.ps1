# Redis Installation Script for Windows
# This script installs Redis using Docker

Write-Host "=== Redis Installation Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
$dockerAvailable = $false
try {
    $dockerVersion = docker --version 2>&1
    if ($dockerVersion -match "Docker version") {
        $dockerAvailable = $true
        Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Docker not found" -ForegroundColor Red
}

if (-not $dockerAvailable) {
    Write-Host ""
    Write-Host "Please install Docker Desktop from:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installing Docker Desktop:" -ForegroundColor Yellow
    Write-Host "1. Start Docker Desktop" -ForegroundColor White
    Write-Host "2. Wait for it to fully start" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    exit 1
}

# Check if Docker daemon is running
Write-Host "Checking Docker daemon..." -ForegroundColor Yellow
try {
    docker ps 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon not running"
    }
    Write-Host "✅ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon is not running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop and wait for it to fully initialize." -ForegroundColor Yellow
    Write-Host "Look for the Docker whale icon in your system tray." -ForegroundColor Yellow
    exit 1
}

# Check if Redis container already exists
Write-Host ""
Write-Host "Checking for existing Redis container..." -ForegroundColor Yellow
$existingContainer = docker ps -a --filter "name=redis" --format "{{.Names}}" 2>&1

if ($existingContainer -eq "redis") {
    Write-Host "✅ Redis container found" -ForegroundColor Green
    
    # Check if it's running
    $running = docker ps --filter "name=redis" --format "{{.Names}}" 2>&1
    if ($running -eq "redis") {
        Write-Host "✅ Redis container is already running" -ForegroundColor Green
    } else {
        Write-Host "Starting Redis container..." -ForegroundColor Yellow
        docker start redis 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Redis container started" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start Redis container" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "Installing Redis container..." -ForegroundColor Yellow
    docker run -d --name redis -p 6379:6379 redis:7-alpine 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Redis container installed and started" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install Redis container" -ForegroundColor Red
        Write-Host "Error details:" -ForegroundColor Yellow
        docker run -d --name redis -p 6379:6379 redis:7-alpine 2>&1
        exit 1
    }
}

# Wait for Redis to be ready
Write-Host ""
Write-Host "Waiting for Redis to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Test Redis connection
Write-Host "Testing Redis connection..." -ForegroundColor Yellow
try {
    $testResult = docker exec redis redis-cli ping 2>&1
    if ($testResult -match "PONG") {
        Write-Host "✅ Redis is responding!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Redis might not be ready yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not test Redis connection" -ForegroundColor Yellow
}

# Check if port is listening
Write-Host ""
Write-Host "Checking port 6379..." -ForegroundColor Yellow
$portCheck = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
if ($portCheck) {
    Write-Host "✅ Redis is listening on port 6379" -ForegroundColor Green
} else {
    Write-Host "⚠️ Port 6379 is not listening yet" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Redis Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Redis is now running at:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 6379" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your Laravel .env file to use Redis" -ForegroundColor White
Write-Host "2. Run: php artisan config:clear" -ForegroundColor White
Write-Host "3. Restart your Laravel server" -ForegroundColor White
Write-Host ""

