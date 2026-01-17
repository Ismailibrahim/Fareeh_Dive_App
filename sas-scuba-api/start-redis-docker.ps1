# Start Redis using Docker
Write-Host "=== Starting Redis with Docker ===" -ForegroundColor Cyan

# Check if Redis container already exists and is running
$running = docker ps --filter "name=redis" --format "{{.Names}}" 2>$null
if ($running -eq "redis") {
    Write-Host "✓ Redis container is already running" -ForegroundColor Green
    Write-Host "Redis is available at: localhost:6379" -ForegroundColor Green
} else {
    # Check if container exists but is stopped
    $exists = docker ps -a --filter "name=redis" --format "{{.Names}}" 2>$null
    if ($exists -eq "redis") {
        Write-Host "Starting existing Redis container..." -ForegroundColor Yellow
        docker start redis 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Redis container started successfully" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to start Redis container" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Creating new Redis container..." -ForegroundColor Yellow
        docker run -d --name redis -p 6379:6379 redis:latest redis-server --appendonly yes 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Redis container created and started" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to create Redis container" -ForegroundColor Red
            Write-Host "Make sure Docker is installed and running" -ForegroundColor Yellow
            exit 1
        }
    }
    Write-Host "Redis is available at: localhost:6379" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Testing Redis Connection ===" -ForegroundColor Cyan
Start-Sleep -Seconds 2
docker exec redis redis-cli ping 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Redis is working correctly!" -ForegroundColor Green
} else {
    Write-Host "⚠ Redis container started but connection test failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Run: php enable-redis.php (to test Laravel connection)" -ForegroundColor White
Write-Host "2. Run: php check-performance.php (to verify optimizations)" -ForegroundColor White
Write-Host ""
Write-Host "To stop Redis: docker stop redis" -ForegroundColor Gray
Write-Host "To remove Redis: docker rm -f redis" -ForegroundColor Gray
