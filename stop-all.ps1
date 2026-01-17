# SAS Scuba - Stop All Services Script
# Stops Redis, Laravel API, and Next.js Frontend servers

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SAS Scuba - Stopping All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$servicesStopped = 0

# ============================================
# Step 1: Stop Next.js Frontend Server
# ============================================
Write-Host "[1/3] Stopping Next.js Frontend Server..." -ForegroundColor Yellow
$webConnections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($webConnections) {
    $webConnections | ForEach-Object {
        $processId = $_.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process -and ($process.ProcessName -eq "node" -or $process.ProcessName -eq "powershell")) {
            Write-Host "  🛑 Stopping Next.js server (PID: $processId)..." -ForegroundColor Cyan
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            $servicesStopped++
        }
    }
    Start-Sleep -Seconds 1
    Write-Host "  ✅ Next.js Frontend server stopped" -ForegroundColor Green
} else {
    Write-Host "  ✅ Next.js Frontend server is not running" -ForegroundColor Gray
}
Write-Host ""

# ============================================
# Step 2: Stop Laravel API Server
# ============================================
Write-Host "[2/3] Stopping Laravel API Server..." -ForegroundColor Yellow
$apiConnections = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($apiConnections) {
    $apiConnections | ForEach-Object {
        $processId = $_.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process -and ($process.ProcessName -eq "php" -or $process.ProcessName -eq "powershell")) {
            Write-Host "  🛑 Stopping Laravel API server (PID: $processId)..." -ForegroundColor Cyan
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            $servicesStopped++
        }
    }
    Start-Sleep -Seconds 1
    Write-Host "  ✅ Laravel API server stopped" -ForegroundColor Green
} else {
    Write-Host "  ✅ Laravel API server is not running" -ForegroundColor Gray
}
Write-Host ""

# ============================================
# Step 3: Stop Redis Server
# ============================================
Write-Host "[3/3] Stopping Redis Server..." -ForegroundColor Yellow
$redisConnections = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue
if ($redisConnections) {
    # Try stopping Laragon Redis first
    $redisProcesses = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
    if ($redisProcesses) {
        $redisProcesses | ForEach-Object {
            Write-Host "  🛑 Stopping Redis server (PID: $($_.Id))..." -ForegroundColor Cyan
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            $servicesStopped++
        }
        Start-Sleep -Seconds 1
    }
    
    # Try stopping Docker Redis container
    $dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerAvailable) {
        $running = docker ps --filter "name=redis" --format "{{.Names}}" 2>&1
        if ($running -eq "redis") {
            Write-Host "  🛑 Stopping Redis Docker container..." -ForegroundColor Cyan
            docker stop redis 2>&1 | Out-Null
            $servicesStopped++
            Start-Sleep -Seconds 1
        }
    }
    
    # Verify Redis stopped
    $redisCheck = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
    if ($redisCheck) {
        Write-Host "  ⚠️  Redis may still be running. Check manually." -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ Redis server stopped" -ForegroundColor Green
    }
} else {
    Write-Host "  ✅ Redis server is not running" -ForegroundColor Gray
}
Write-Host ""

# ============================================
# Final Status Report
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Shutdown Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Wait a moment and check final status
Start-Sleep -Seconds 2

Write-Host "📊 Service Status:" -ForegroundColor Yellow
Write-Host ""

$redisRunning = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
$apiRunning = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
$webRunning = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }

if ($redisRunning) {
    Write-Host "  ⚠️  Redis       : Still running on port 6379" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Redis       : Stopped" -ForegroundColor Green
}

if ($apiRunning) {
    Write-Host "  ⚠️  Backend API : Still running on port 8000" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Backend API : Stopped" -ForegroundColor Green
}

if ($webRunning) {
    Write-Host "  ⚠️  Frontend    : Still running on port 3000" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Frontend    : Stopped" -ForegroundColor Green
}

Write-Host ""

if ($servicesStopped -gt 0) {
    Write-Host "✅ Stopped $servicesStopped service(s)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No services were running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "💡 To start all services again, run: .\start-all.ps1" -ForegroundColor Gray
Write-Host ""
