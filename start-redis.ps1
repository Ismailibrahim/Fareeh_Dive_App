# Start Redis Server for Laragon
# This script starts Redis server from Laragon installation

$redisExe = "C:\laragon\bin\redis\redis-x64-5.0.14.1\redis-server.exe"
$redisConf = "C:\laragon\bin\redis\redis-x64-5.0.14.1\redis.windows.conf"

Write-Host "=== Starting Redis Server ===" -ForegroundColor Cyan
Write-Host ""

# Check if Redis is already running
$portCheck = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
if ($portCheck) {
    Write-Host "✅ Redis is already running on port 6379 (PID: $($portCheck.OwningProcess))" -ForegroundColor Green
    exit 0
}

# Check if Redis executable exists
if (-not (Test-Path $redisExe)) {
    Write-Host "❌ Redis executable not found at: $redisExe" -ForegroundColor Red
    Write-Host "Please ensure Redis is installed in Laragon." -ForegroundColor Yellow
    exit 1
}

# Start Redis server
Write-Host "Starting Redis server..." -ForegroundColor Yellow
if (Test-Path $redisConf) {
    Start-Process -FilePath $redisExe -ArgumentList $redisConf -WindowStyle Minimized
} else {
    Start-Process -FilePath $redisExe -WindowStyle Minimized
}

# Wait for Redis to start
Start-Sleep -Seconds 3

# Verify Redis is running
$portCheck = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
if ($portCheck) {
    Write-Host "✅ Redis started successfully on port 6379 (PID: $($portCheck.OwningProcess))" -ForegroundColor Green
    
    # Test connection
    $redisCli = "C:\laragon\bin\redis\redis-x64-5.0.14.1\redis-cli.exe"
    if (Test-Path $redisCli) {
        $result = & $redisCli ping 2>&1
        if ($result -match "PONG") {
            Write-Host "✅ Redis is responding to commands" -ForegroundColor Green
        }
    }
} else {
    Write-Host "⚠️ Redis might not have started. Check the Redis window for errors." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Redis Configuration:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 6379" -ForegroundColor White
Write-Host ""

