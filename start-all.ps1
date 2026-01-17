# SAS Scuba - Start All Services Script
# Starts Redis, Laravel API, and Next.js Frontend servers

# Load paths configuration
. .\paths.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SAS Scuba - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorOccurred = $false

# ============================================
# Step 1: Start Redis Server
# ============================================
Write-Host "[1/3] Starting Redis Server..." -ForegroundColor Yellow
Write-Host ""

# Check if Redis is already running
$redisPortCheck = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
if ($redisPortCheck) {
    Write-Host "  ✅ Redis is already running on port 6379 (PID: $($redisPortCheck.OwningProcess))" -ForegroundColor Green
    Write-Host ""
} else {
    # Try Laragon Redis first
    $redisExe = "C:\laragon\bin\redis\redis-x64-5.0.14.1\redis-server.exe"
    $redisConf = "C:\laragon\bin\redis\redis-x64-5.0.14.1\redis.windows.conf"
    
    if (Test-Path $redisExe) {
        Write-Host "  📡 Starting Redis from Laragon..." -ForegroundColor Cyan
        if (Test-Path $redisConf) {
            Start-Process -FilePath $redisExe -ArgumentList $redisConf -WindowStyle Minimized
        } else {
            Start-Process -FilePath $redisExe -WindowStyle Minimized
        }
        Start-Sleep -Seconds 3
        
        # Verify Redis started
        $redisPortCheck = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
        if ($redisPortCheck) {
            Write-Host "  ✅ Redis started successfully on port 6379" -ForegroundColor Green
            
            # Test connection
            $redisCli = "C:\laragon\bin\redis\redis-x64-5.0.14.1\redis-cli.exe"
            if (Test-Path $redisCli) {
                $result = & $redisCli ping 2>&1
                if ($result -match "PONG") {
                    Write-Host "  ✅ Redis is responding to commands" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "  ⚠️  Redis may not have started. Check the Redis window for errors." -ForegroundColor Yellow
        }
    } else {
        # Try Docker Redis as fallback
        Write-Host "  📡 Laragon Redis not found. Trying Docker..." -ForegroundColor Cyan
        
        # Check if Docker is available
        $dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue
        if ($dockerAvailable) {
            # Check if Redis container exists
            $existingContainer = docker ps -a --filter "name=redis" --format "{{.Names}}" 2>&1
            
            if ($existingContainer -eq "redis") {
                # Check if running
                $running = docker ps --filter "name=redis" --format "{{.Names}}" 2>&1
                if ($running -eq "redis") {
                    Write-Host "  ✅ Redis Docker container is already running" -ForegroundColor Green
                } else {
                    Write-Host "  📡 Starting existing Redis container..." -ForegroundColor Cyan
                    docker start redis 2>&1 | Out-Null
                    Start-Sleep -Seconds 3
                    Write-Host "  ✅ Redis Docker container started" -ForegroundColor Green
                }
            } else {
                Write-Host "  📡 Creating and starting Redis Docker container..." -ForegroundColor Cyan
                docker run -d --name redis -p 6379:6379 redis:7-alpine 2>&1 | Out-Null
                Start-Sleep -Seconds 3
                
                # Test connection
                $testResult = docker exec redis redis-cli ping 2>&1
                if ($testResult -match "PONG") {
                    Write-Host "  ✅ Redis Docker container created and started" -ForegroundColor Green
                } else {
                    Write-Host "  ⚠️  Redis container started but connection test failed" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "  ⚠️  Redis executable not found and Docker is not available" -ForegroundColor Yellow
            Write-Host "  ⚠️  Please install Redis in Laragon or ensure Docker is installed" -ForegroundColor Yellow
            $ErrorOccurred = $true
        }
    }
    Write-Host ""
}

# ============================================
# Step 2: Start Laravel API Server
# ============================================
Write-Host "[2/3] Starting Laravel API Server..." -ForegroundColor Yellow
Write-Host ""

# Check if PHP is available
if (-not (Test-Path $PHP_EXE)) {
    Write-Host "  ❌ PHP not found at: $PHP_EXE" -ForegroundColor Red
    Write-Host "  Please check your Laragon installation." -ForegroundColor Yellow
    $ErrorOccurred = $true
    Write-Host ""
} elseif (-not (Test-Path $PROJECT_API)) {
    Write-Host "  ❌ API project not found at: $PROJECT_API" -ForegroundColor Red
    $ErrorOccurred = $true
    Write-Host ""
} else {
    # Check if API server is already running
    $apiPortCheck = Get-NetTCPConnection -LocalPort $API_PORT -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
    if ($apiPortCheck) {
        Write-Host "  ✅ Laravel API server is already running on port $API_PORT" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "  📡 Starting Laravel API server on port $API_PORT..." -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_API'; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  Laravel API Server - Port $API_PORT' -ForegroundColor Cyan; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; `$env:PATH = '$LARAGON_PHP;' + `$env:PATH; php artisan serve --port=$API_PORT --host=127.0.0.1"
        Start-Sleep -Seconds 3
        
        # Verify API started
        $apiPortCheck = Get-NetTCPConnection -LocalPort $API_PORT -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
        if ($apiPortCheck) {
            Write-Host "  ✅ Laravel API server started successfully" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Laravel API server may still be starting..." -ForegroundColor Yellow
        }
        Write-Host ""
    }
}

# ============================================
# Step 3: Start Next.js Frontend Server
# ============================================
Write-Host "[3/3] Starting Next.js Frontend Server..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $PROJECT_WEB)) {
    Write-Host "  ❌ Web project not found at: $PROJECT_WEB" -ForegroundColor Red
    $ErrorOccurred = $true
    Write-Host ""
} else {
    # Check if Frontend server is already running
    $webPortCheck = Get-NetTCPConnection -LocalPort $WEB_PORT -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
    if ($webPortCheck) {
        Write-Host "  ✅ Next.js Frontend server is already running on port $WEB_PORT" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "  📡 Starting Next.js Frontend server on port $WEB_PORT..." -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_WEB'; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  Next.js Frontend Server - Port $WEB_PORT' -ForegroundColor Cyan; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; npm run dev"
        Start-Sleep -Seconds 3
        
        # Verify Frontend started
        $webPortCheck = Get-NetTCPConnection -LocalPort $WEB_PORT -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
        if ($webPortCheck) {
            Write-Host "  ✅ Next.js Frontend server started successfully" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Next.js Frontend server may still be starting..." -ForegroundColor Yellow
        }
        Write-Host ""
    }
}

# ============================================
# Final Status Report
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Startup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Wait a moment and check final status
Start-Sleep -Seconds 2

Write-Host "📊 Service Status:" -ForegroundColor Yellow
Write-Host ""

$redisRunning = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
$apiRunning = Get-NetTCPConnection -LocalPort $API_PORT -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
$webRunning = Get-NetTCPConnection -LocalPort $WEB_PORT -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }

if ($redisRunning) {
    Write-Host "  ✅ Redis        : Running on port 6379" -ForegroundColor Green
} else {
    Write-Host "  ❌ Redis        : Not running" -ForegroundColor Red
}

if ($apiRunning) {
    Write-Host "  ✅ Backend API  : Running on port $API_PORT" -ForegroundColor Green
    Write-Host "     → http://localhost:$API_PORT" -ForegroundColor Cyan
} else {
    Write-Host "  ❌ Backend API  : Not running" -ForegroundColor Red
}

if ($webRunning) {
    Write-Host "  ✅ Frontend     : Running on port $WEB_PORT" -ForegroundColor Green
    Write-Host "     → http://localhost:$WEB_PORT" -ForegroundColor Cyan
} else {
    Write-Host "  ❌ Frontend     : Not running" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Yellow
Write-Host "   Frontend App : http://localhost:$WEB_PORT" -ForegroundColor Cyan
Write-Host "   Login Page   : http://localhost:$WEB_PORT/login" -ForegroundColor Cyan
Write-Host "   Backend API  : http://localhost:$API_PORT" -ForegroundColor Cyan
Write-Host "   API Health   : http://localhost:$API_PORT/up" -ForegroundColor Cyan
Write-Host ""

if ($ErrorOccurred) {
    Write-Host "⚠️  Some services failed to start. Please check the errors above." -ForegroundColor Yellow
    Write-Host ""
    exit 1
} else {
    Write-Host "✅ All services started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Tip: Servers are running in separate PowerShell windows." -ForegroundColor Gray
    Write-Host "   You can monitor logs in those windows." -ForegroundColor Gray
    Write-Host "   To stop all services, run: .\stop-all.ps1" -ForegroundColor Gray
    Write-Host ""
}
