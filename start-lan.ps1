# SAS Scuba - LAN Startup Script
# Configures the application to be accessible from other computers on the local network

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SAS Scuba - LAN Exposure Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detect LAN IP
$IPAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
if (-not $IPAddress) {
    # Fallback to any active non-loopback starting with common LAN prefixes
    $IPAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback|vEthernet" -and ($_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*") } | Select-Object -First 1).IPAddress
}

if (-not $IPAddress) {
    Write-Host "❌ Could not detect a valid Local Network IP Address!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Detected Local Network IP: " -NoNewline; Write-Host $IPAddress -ForegroundColor Green
Write-Host ""

# Environment updating removed. The application now uses dynamic URL detection
# and wildcard CORS/Sanctum configuration, so it works on both localhost
# and LAN IP addresses simultaneously without modifying .env files.

Write-Host ""
Write-Host "🔄 Restarting services with LAN bindings (0.0.0.0)..." -ForegroundColor Cyan
Write-Host ""

# 4. Stop and Restart
.\stop-all.ps1
Start-Sleep -Seconds 2
.\start-all.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LAN Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now access the application from your other computer by visiting:" -ForegroundColor Yellow
Write-Host "👉 http://${IPAddress}:3000" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: If this is your first time, Windows Defender Firewall might ask you to allow Node.js or PHP. You MUST click 'Allow'." -ForegroundColor Red
Write-Host ""
