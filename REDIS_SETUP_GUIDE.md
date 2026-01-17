# Redis Cache Setup Guide

## Why Redis?

Redis provides **3-5x faster** cache operations compared to database cache:
- In-memory storage (much faster than database)
- Better scalability
- Supports cache tags for easier invalidation
- Lower database load

## Installation Options

### Option 1: Install Redis Server (Recommended for Production)

#### Windows (Using WSL or Docker)
```bash
# Using Docker (easiest)
docker run -d -p 6379:6379 --name redis redis:latest

# Or using WSL
wsl
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### macOS
```bash
brew install redis
brew services start redis
```

### Option 2: Use Predis (No Redis Server Required)

Predis is a pure PHP Redis client that doesn't require the Redis PHP extension:

```bash
cd sas-scuba-api
composer require predis/predis
```

Then configure Laravel to use Predis:
```env
REDIS_CLIENT=predis
```

### Option 3: Use Redis Cloud/Managed Service

For production, consider:
- Redis Cloud (redis.com)
- AWS ElastiCache
- Azure Cache for Redis
- DigitalOcean Managed Redis

## PHP Extension Setup

### Install PHP Redis Extension

#### Windows (via PECL)
```bash
pecl install redis
```

#### Linux
```bash
sudo apt-get install php-redis
# Or
sudo yum install php-redis
```

#### macOS
```bash
pecl install redis
```

### Verify Installation
```bash
php -m | grep redis
```

Should output: `redis`

## Laravel Configuration

### 1. Update .env File

```env
# Cache Configuration
CACHE_STORE=redis

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_CLIENT=phpredis
# Or use Predis (no extension needed):
# REDIS_CLIENT=predis

# Session Configuration (optional, but recommended)
SESSION_DRIVER=redis
SESSION_CONNECTION=default

# Queue Configuration (optional)
QUEUE_CONNECTION=redis
```

### 2. Test Redis Connection

```bash
cd sas-scuba-api
php artisan tinker
```

Then run:
```php
Cache::store('redis')->put('test', 'value', 60);
Cache::store('redis')->get('test');
// Should return: "value"
```

### 3. Clear Old Cache

```bash
php artisan cache:clear
php artisan config:clear
```

### 4. Test Performance

Run the performance check:
```bash
php check-performance.php
```

Should show: "✓ Using Redis cache (optimal for performance)"

## Verification

### Check Redis is Working

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis info
redis-cli info stats
```

### Test Cache Performance

```bash
php artisan tinker
```

```php
// Test cache speed
$start = microtime(true);
for ($i = 0; $i < 1000; $i++) {
    Cache::put("test_{$i}", "value_{$i}", 60);
    Cache::get("test_{$i}");
}
$end = microtime(true);
echo "Time: " . ($end - $start) . " seconds\n";
```

## Troubleshooting

### Issue: "Class Redis not found"

**Solution:**
- Install Redis PHP extension: `pecl install redis`
- Or use Predis: `composer require predis/predis` and set `REDIS_CLIENT=predis`

### Issue: "Connection refused"

**Solution:**
- Check Redis server is running: `redis-cli ping`
- Verify host/port in `.env`
- Check firewall settings

### Issue: "Authentication required"

**Solution:**
- Set `REDIS_PASSWORD` in `.env` if Redis requires password
- Or disable Redis password authentication

### Issue: Redis not available in production

**Solution:**
- Use Predis (no extension needed)
- Or use managed Redis service
- Or fallback to database cache temporarily

## Fallback Strategy

If Redis is not available, the application will fallback to database cache automatically. However, for best performance, Redis is recommended.

## Performance Comparison

| Cache Driver | Read Speed | Write Speed | Best For |
|-------------|------------|-------------|----------|
| Database | ~10-20ms | ~10-20ms | Development, small apps |
| File | ~5-10ms | ~5-10ms | Single server |
| Redis | ~1-3ms | ~1-3ms | Production, high traffic |
| Memcached | ~1-3ms | ~1-3ms | Production, high traffic |

## Production Recommendations

1. **Use Redis** for cache, session, and queue
2. **Enable persistence** (RDB or AOF) for data safety
3. **Set memory limits** to prevent OOM
4. **Use Redis Sentinel** for high availability
5. **Monitor Redis** performance and memory usage

## Quick Setup Script

For quick testing, you can use Docker:

```bash
# Start Redis container
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:latest

# Verify it's running
docker ps | grep redis

# Test connection
docker exec -it redis redis-cli ping
```

## Next Steps

1. Install Redis (or use Predis)
2. Update `.env` file
3. Test connection
4. Run performance check
5. Monitor cache hit rates

---

**Redis setup will significantly improve your application's performance!** 🚀

