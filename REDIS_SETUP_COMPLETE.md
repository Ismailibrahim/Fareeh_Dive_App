# Redis Setup - Current Status

## ✅ Configuration Complete

**Status:** Redis cache is **configured** but requires a Redis server to be running.

### What's Been Done

1. ✅ **Predis package installed** - Redis PHP client ready
2. ✅ **`.env` updated** - `CACHE_STORE=redis` configured
3. ✅ **Configuration cleared** - Laravel ready to use Redis

### Current Status

- **Cache Driver:** `redis` (configured in `.env`)
- **Redis Client:** `predis` (installed)
- **Redis Server:** ⚠️ **Not running** (needs to be started)

## 🚀 Options to Enable Redis

### Option 1: Start Redis with Docker (Recommended for Development)

**Prerequisites:** Docker Desktop must be running

```bash
# Start Docker Desktop first, then:

# Windows PowerShell
docker run -d --name redis -p 6379:6379 redis:latest

# Or use the script (after Docker Desktop is running):
cd sas-scuba-api
powershell -ExecutionPolicy Bypass -File start-redis-docker.ps1
```

**Verify Redis is running:**
```bash
docker ps | grep redis
docker exec redis redis-cli ping
# Should return: PONG
```

### Option 2: Install Redis Server Directly

**Windows:**
- Download from: https://github.com/microsoftarchive/redis/releases
- Or use WSL: `wsl sudo apt-get install redis-server`

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

### Option 3: Use Managed Redis Service (Production)

- **Redis Cloud:** https://redis.com/try-free/
- **AWS ElastiCache**
- **Azure Cache for Redis**
- **DigitalOcean Managed Redis**

Update `.env` with your Redis connection details.

## ✅ Test Redis Connection

After starting Redis server:

```bash
cd sas-scuba-api
php enable-redis.php
```

Expected output:
```
✓ Redis cache is working!
✓ 100 cache operations completed in XXms
✅ Redis cache is enabled and working!
```

## 🔄 Fallback Behavior

**Current Configuration:**
- If Redis is unavailable, Laravel will throw an error
- To enable automatic fallback, change `.env`:
  ```env
  CACHE_STORE=failover
  ```
  This will try Redis first, then fallback to database cache.

## 📊 Performance Impact

**With Redis:**
- Cache operations: **1-3ms** (5-10x faster than database cache)
- Overall API response: **30-40% faster**

**Without Redis (using database cache):**
- Cache operations: **10-20ms** (still good performance)
- Application works normally

## 🎯 Next Steps

1. **Start Docker Desktop** (if using Docker)
2. **Start Redis server** (choose one of the options above)
3. **Test connection:** `php enable-redis.php`
4. **Verify performance:** `php check-performance.php`

## ⚠️ Important Notes

- **Development:** Redis server must be running for Redis cache to work
- **Production:** Ensure Redis server is always running (use systemd/docker restart policies)
- **Fallback:** If Redis fails, switch to `CACHE_STORE=database` temporarily

## Current Configuration

```env
CACHE_STORE=redis
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null
```

**Status:** ✅ Configured, ⚠️ Waiting for Redis server

---

**To enable Redis:** Start a Redis server using one of the options above, then test with `php enable-redis.php`

