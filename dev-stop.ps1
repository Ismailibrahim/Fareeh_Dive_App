# SAS Scuba - Stop Development Servers
# Stops all running development servers

Write-Host "🛑 Stopping SAS Scuba Development Servers..." -ForegroundColor Yellow

# Stop Laravel server (port 8000)
$laravelProcess = Get-Process | Where-Object { $_.CommandLine -like "*php artisan serve*" -or $_.CommandLine -like "*artisan serve*" }
if ($laravelProcess) {
    Write-Host "Stopping Laravel API server..." -ForegroundColor Yellow
    $laravelProcess | Stop-Process -Force
}

# Stop Node/Next.js server (port 3000)
$nodeProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($nodeProcess) {
    Write-Host "Stopping Next.js frontend server..." -ForegroundColor Yellow
    Get-Process -Id ($nodeProcess | Select-Object -First 1).OwningProcess | Stop-Process -Force
}

# Alternative method: Kill processes on specific ports
$ports = @(8000, 3000)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            $processId = $_.OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Stopping process on port $port (PID: $processId)..." -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host "✅ Development servers stopped." -ForegroundColor Green

