# Stop Redis Server
# This script stops Redis server running on port 6379

Write-Host "=== Stopping Redis Server ===" -ForegroundColor Cyan
Write-Host ""

$portCheck = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
if ($portCheck) {
    $pid = $portCheck.OwningProcess
    Write-Host "Stopping Redis (PID: $pid)..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    $portCheck = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
    if (-not $portCheck) {
        Write-Host "✅ Redis stopped successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Redis might still be running" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Redis is not running" -ForegroundColor Green
}

