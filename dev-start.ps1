# SAS Scuba - Development Server Startup Script
# Starts both Laravel API and Next.js frontend servers
# AUTO-DETECTS current LAN IP and injects it into .env so login works from any device on the network

# Load paths configuration
. .\paths.ps1

Write-Host "🚀 Starting SAS Scuba Development Servers..." -ForegroundColor Green
Write-Host ""

# ─────────────────────────────────────────────────────────────
# Auto-detect LAN IP address
# ─────────────────────────────────────────────────────────────
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
          Where-Object { $_.IPAddress -notmatch "^127\." -and $_.PrefixOrigin -ne "WellKnown" } |
          Sort-Object InterfaceIndex |
          Select-Object -First 1).IPAddress

if (-not $lanIp) {
    Write-Host "⚠️  Could not detect LAN IP – falling back to 127.0.0.1" -ForegroundColor Yellow
    $lanIp = "127.0.0.1"
}

Write-Host "📡 Detected LAN IP: $lanIp" -ForegroundColor Cyan

# ─────────────────────────────────────────────────────────────
# Patch the Laravel .env with the detected IP
# ─────────────────────────────────────────────────────────────
$envPath = Join-Path $PROJECT_API ".env"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw

    # Build the new values
    $newFrontendUrl  = "http://localhost:3000,http://127.0.0.1:3000,http://${lanIp}:3000"
    $newStateful     = "localhost,127.0.0.1,localhost:3000,127.0.0.1:3000,${lanIp},${lanIp}:3000"

    # Replace existing lines (or append if missing)
    $envContent = $envContent -replace '(?m)^FRONTEND_URL=.*$', "FRONTEND_URL=$newFrontendUrl"
    $envContent = $envContent -replace '(?m)^SANCTUM_STATEFUL_DOMAINS=.*$', "SANCTUM_STATEFUL_DOMAINS=$newStateful"
    $envContent = $envContent -replace '(?m)^APP_URL=.*$', "APP_URL=http://${lanIp}:$API_PORT"

    Set-Content $envPath $envContent -NoNewline
    Write-Host "✅ .env updated with current LAN IP ($lanIp)" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env not found at $envPath – skipping env patch" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────
# Patch the Next.js .env.local with the detected API URL
# ─────────────────────────────────────────────────────────────
$webEnvPath = Join-Path $PROJECT_WEB ".env.local"
$apiUrl     = "http://${lanIp}:$API_PORT"

if (Test-Path $webEnvPath) {
    $webEnv = Get-Content $webEnvPath -Raw
    if ($webEnv -match 'NEXT_PUBLIC_API_URL') {
        $webEnv = $webEnv -replace '(?m)^NEXT_PUBLIC_API_URL=.*$', "NEXT_PUBLIC_API_URL=$apiUrl"
    } else {
        $webEnv += "`nNEXT_PUBLIC_API_URL=$apiUrl"
    }
    Set-Content $webEnvPath $webEnv -NoNewline
    Write-Host "✅ .env.local updated (NEXT_PUBLIC_API_URL=$apiUrl)" -ForegroundColor Green
} else {
    # Create it
    "NEXT_PUBLIC_API_URL=$apiUrl" | Set-Content $webEnvPath
    Write-Host "✅ .env.local created (NEXT_PUBLIC_API_URL=$apiUrl)" -ForegroundColor Green
}

# ─────────────────────────────────────────────────────────────
# Clear Laravel config cache so new .env values take effect
# ─────────────────────────────────────────────────────────────
Write-Host "🔄 Clearing Laravel config cache..." -ForegroundColor Yellow
& $PHP_EXE "$PROJECT_API\artisan" config:clear 2>$null | Out-Null
& $PHP_EXE "$PROJECT_API\artisan" cache:clear  2>$null | Out-Null

# ─────────────────────────────────────────────────────────────
# Validate paths
# ─────────────────────────────────────────────────────────────
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

# ─────────────────────────────────────────────────────────────
# Start servers
# ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "📡 Starting Laravel API server on port $API_PORT..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_API'; Write-Host 'Laravel API Server' -ForegroundColor Cyan; & '$PHP_EXE' artisan serve --port=$API_PORT --host=0.0.0.0"

Start-Sleep -Seconds 2

Write-Host "🌐 Starting Next.js frontend server on port $WEB_PORT..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_WEB'; Write-Host 'Next.js Frontend Server' -ForegroundColor Cyan; npm run dev -- -H 0.0.0.0"

Write-Host ""
Write-Host "✅ Development servers starting!" -ForegroundColor Green
Write-Host ""
Write-Host "   API:       http://localhost:$API_PORT" -ForegroundColor Cyan
Write-Host "   API (LAN): http://${lanIp}:$API_PORT" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:$WEB_PORT" -ForegroundColor Cyan
Write-Host "   Frontend (LAN): http://${lanIp}:$WEB_PORT" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Share this address with devices on your network:" -ForegroundColor Green
Write-Host "   http://${lanIp}:$WEB_PORT" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
