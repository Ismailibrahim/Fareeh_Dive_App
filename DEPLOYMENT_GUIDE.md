# SAS Scuba - Deployment Guide (Testing Environment)

This guide will help you deploy the SAS Scuba application for testing purposes. This is **NOT** production-ready and should only be used for testing.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Setup](#environment-setup)
4. [Backend (Laravel API) Deployment](#backend-laravel-api-deployment)
5. [Frontend (Next.js) Deployment](#frontend-nextjs-deployment)
6. [Database Setup](#database-setup)
7. [Redis Setup](#redis-setup)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

---

## Prerequisites

### Server Requirements

**Backend (Laravel API):**
- PHP 8.2 or higher
- Composer 2.x
- MySQL 8.0+ or PostgreSQL 13+ (MySQL recommended)
- Redis 6.0+ (recommended for caching, sessions, and rate limiting)
- PHP Redis extension or Predis package
- Web server (Apache/Nginx)
- Node.js 18+ (for asset compilation)

**Frontend (Next.js):**
- Node.js 18+ or higher
- npm 9+ or yarn/pnpm

### Software Installation

1. **PHP & Composer**
   ```bash
   # Verify PHP version
   php -v  # Should be 8.2+
   
   # Verify Composer
   composer --version
   ```

2. **Node.js**
   ```bash
   # Verify Node.js version
   node -v  # Should be 18+
   
   # Verify npm
   npm -v
   ```

3. **Database**
   - MySQL/MariaDB or PostgreSQL installed and running
   - Database user with CREATE DATABASE privileges

---

## Pre-Deployment Checklist

- [ ] Server meets all prerequisites
- [ ] Database server is running and accessible
- [ ] Redis server is installed and running (recommended)
- [ ] PHP Redis extension or Predis package installed
- [ ] Web server (Apache/Nginx) is configured
- [ ] SSL certificate configured (recommended for testing)
- [ ] Environment variables prepared
- [ ] Domain/subdomain configured (or IP address ready)
- [ ] Firewall rules configured
- [ ] Backup strategy in place

---

## Environment Setup

### 1. Backend Environment Variables

Create `.env` file in `sas-scuba-api/` directory:

```bash
cd sas-scuba-api
cp .env.example .env  # If .env.example exists, otherwise create manually
```

**Required Environment Variables:**

```env
# Application
APP_NAME="SAS Scuba"
APP_ENV=testing
APP_KEY=
APP_DEBUG=true
APP_URL=https://api.yourdomain.com

# Frontend URLs (CORS)
FRONTEND_URL=https://app.yourdomain.com
SANCTUM_STATEFUL_DOMAINS=app.yourdomain.com,yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sas_scuba_test
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# Session & Cache (Redis recommended for better performance)
SESSION_DRIVER=redis
SESSION_LIFETIME=120
CACHE_STORE=redis
QUEUE_CONNECTION=redis

# Redis Configuration
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null
REDIS_DB=0
REDIS_CACHE_DB=1

# Mail (Configure for your testing environment)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"

# File Storage
FILESYSTEM_DISK=local
# For S3 (optional):
# FILESYSTEM_DISK=s3
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_DEFAULT_REGION=us-east-1
# AWS_BUCKET=your-bucket-name

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=debug
```

### 2. Frontend Environment Variables

Create `.env.local` file in `sas-scuba-web/` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_APP_NAME="SAS Scuba"

# App Configuration
NEXT_PUBLIC_ITEMS_PER_PAGE=20
NEXT_PUBLIC_BOOKING_ADVANCE_DAYS=90
NEXT_PUBLIC_CURRENCY=USD
NEXT_PUBLIC_DATE_FORMAT=YYYY-MM-DD
NEXT_PUBLIC_TIME_FORMAT=HH:mm

# Development
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

---

## Backend (Laravel API) Deployment

### Step 1: Install Dependencies

```bash
cd sas-scuba-api

# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Install Node.js dependencies (for asset compilation)
npm install
```

### Step 2: Generate Application Key

```bash
php artisan key:generate
```

### Step 3: Configure Storage

```bash
# Create storage link
php artisan storage:link

# Ensure storage directories are writable
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache  # Adjust user/group as needed
```

### Step 4: Run Migrations

```bash
# Run database migrations
php artisan migrate --force

# (Optional) Seed database with test data
php artisan db:seed
```

### Step 5: Optimize Application

```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize
```

### Step 6: Build Assets

```bash
npm run build
```

### Step 7: Configure Web Server

#### Apache Configuration

Create or update virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName api.yourdomain.com
    DocumentRoot /path/to/sas-scuba-api/public

    <Directory /path/to/sas-scuba-api/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/sas-scuba-api-error.log
    CustomLog ${APACHE_LOG_DIR}/sas-scuba-api-access.log combined
</VirtualHost>
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /path/to/sas-scuba-api/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### Step 8: Set Permissions

```bash
# Set proper permissions
chown -R www-data:www-data /path/to/sas-scuba-api
chmod -R 755 /path/to/sas-scuba-api
chmod -R 775 /path/to/sas-scuba-api/storage
chmod -R 775 /path/to/sas-scuba-api/bootstrap/cache
```

---

## Frontend (Next.js) Deployment

### Step 1: Install Dependencies

```bash
cd sas-scuba-web

# Install dependencies
npm install
```

### Step 2: Build Application

```bash
# Build for production
npm run build
```

### Step 3: Start Production Server

**Option A: Using PM2 (Recommended)**

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "sas-scuba-web" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Option B: Using systemd**

Create `/etc/systemd/system/sas-scuba-web.service`:

```ini
[Unit]
Description=SAS Scuba Web Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/sas-scuba-web
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable sas-scuba-web
sudo systemctl start sas-scuba-web
```

**Option C: Using Next.js Standalone (Recommended for Production)**

Update `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  // ... rest of config
};
```

Then build and run:

```bash
npm run build
node .next/standalone/server.js
```

### Step 4: Configure Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Database Setup

### Step 1: Create Database

```sql
CREATE DATABASE sas_scuba_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sas_scuba_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON sas_scuba_test.* TO 'sas_scuba_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Run Migrations

```bash
cd sas-scuba-api
php artisan migrate --force
```

### Step 3: Seed Test Data (Optional)

```bash
php artisan db:seed
```

---

## Redis Setup

Redis is used for caching, session storage, and rate limiting. It significantly improves application performance.

### Step 1: Install Redis

#### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Redis
sudo apt install redis-server -y

# Start Redis service
sudo systemctl start redis-server

# Enable Redis to start on boot
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### Linux (CentOS/RHEL)

```bash
# Install EPEL repository
sudo yum install epel-release -y

# Install Redis
sudo yum install redis -y

# Start Redis service
sudo systemctl start redis

# Enable Redis to start on boot
sudo systemctl enable redis

# Verify Redis is running
redis-cli ping
```

#### macOS (using Homebrew)

```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Or start manually
redis-server /usr/local/etc/redis.conf

# Verify Redis is running
redis-cli ping
```

#### Windows (using Laragon)

Redis is included with Laragon. To start it:

```powershell
# Navigate to project root
cd D:\Sandbox\Fareeh_DiveApplicaiton

# Start Redis
.\start-redis.ps1
```

Or manually:
```powershell
# Start Redis server
C:\laragon\bin\redis\redis-x64-5.0.14.1\redis-server.exe C:\laragon\bin\redis\redis-x64-5.0.14.1\redis.windows.conf
```

#### Docker (Cross-platform)

```bash
# Run Redis container
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Verify Redis is running
docker exec redis redis-cli ping
```

### Step 2: Configure Redis

Edit Redis configuration file (usually `/etc/redis/redis.conf` or `/usr/local/etc/redis.conf`):

```bash
# For production, bind to localhost only
bind 127.0.0.1

# Set a password (recommended for production)
requirepass your_secure_redis_password

# Configure memory limits
maxmemory 256mb
maxmemory-policy allkeys-lru
```

**Note:** For testing environments, password is optional. For production, always set a strong password.

### Step 3: Update Laravel Configuration

Update `.env` file in `sas-scuba-api/`:

```env
# Cache Configuration
CACHE_STORE=redis
CACHE_PREFIX=sas_scuba_cache

# Session Configuration
SESSION_DRIVER=redis
SESSION_LIFETIME=120

# Redis Configuration
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null
REDIS_DB=0

# Redis Cache Database (separate from default)
REDIS_CACHE_DB=1

# Queue Configuration (optional, for background jobs)
QUEUE_CONNECTION=redis
```

**For production with Redis password:**
```env
REDIS_PASSWORD=your_secure_redis_password
```

### Step 4: Install PHP Redis Extension

Laravel requires the PHP Redis extension or Predis package.

#### Option A: Install PHP Redis Extension (Recommended - Faster)

**Linux (Ubuntu/Debian):**
```bash
sudo apt install php-redis -y
sudo systemctl restart php8.2-fpm  # Adjust PHP version as needed
```

**Linux (CentOS/RHEL):**
```bash
sudo yum install php-redis -y
sudo systemctl restart php-fpm
```

**macOS:**
```bash
pecl install redis
```

**Windows (Laragon):**
- Redis extension is usually included
- Or install via PECL: `pecl install redis`

#### Option B: Use Predis Package (No Extension Required)

Predis is already included in Laravel's `composer.json`. Ensure it's installed:

```bash
cd sas-scuba-api
composer require predis/predis
```

Then set in `.env`:
```env
REDIS_CLIENT=predis
```

### Step 5: Test Redis Connection

```bash
cd sas-scuba-api

# Test Redis connection from Laravel
php artisan tinker
```

In Tinker:
```php
Cache::store('redis')->put('test_key', 'test_value', 60);
Cache::store('redis')->get('test_key');
// Should return: "test_value"
```

Or test via command line:
```bash
php artisan tinker --execute="Cache::store('redis')->put('test', 'value', 10); echo Cache::store('redis')->get('test');"
```

### Step 6: Clear Laravel Cache

After configuring Redis, clear Laravel's configuration cache:

```bash
cd sas-scuba-api
php artisan config:clear
php artisan cache:clear
php artisan config:cache  # Rebuild config cache with Redis settings
```

### Step 7: Verify Redis is Working

1. **Check Redis is running:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check Laravel can connect:**
   ```bash
   cd sas-scuba-api
   php artisan tinker --execute="echo Cache::store('redis')->get('test') ?? 'Redis connection successful';"
   ```

3. **Monitor Redis activity:**
   ```bash
   redis-cli monitor
   ```

### Troubleshooting Redis

**Redis connection refused:**
- Verify Redis is running: `redis-cli ping`
- Check Redis is listening on correct port: `netstat -tulpn | grep 6379`
- Verify firewall allows port 6379

**Laravel can't connect to Redis:**
- Check `.env` Redis configuration
- Verify PHP Redis extension is installed: `php -m | grep redis`
- Or ensure Predis is installed: `composer show predis/predis`
- Clear Laravel config cache: `php artisan config:clear`

**Redis authentication failed:**
- Verify `REDIS_PASSWORD` in `.env` matches Redis `requirepass` setting
- Check Redis logs: `/var/log/redis/redis-server.log`

**Performance issues:**
- Monitor Redis memory usage: `redis-cli info memory`
- Check Redis slow log: `redis-cli slowlog get 10`
- Adjust `maxmemory` and `maxmemory-policy` in Redis config

### Redis Benefits

- **Faster caching:** In-memory storage provides sub-millisecond response times
- **Better session handling:** Faster than database sessions
- **Rate limiting:** Efficient request throttling
- **Queue support:** Background job processing
- **Real-time features:** Pub/sub for live updates

---

## Post-Deployment Verification

### 1. Health Check

**Backend:**
```bash
curl https://api.yourdomain.com/up
```

**Frontend:**
```bash
curl https://app.yourdomain.com
```

### 2. API Endpoints Test

```bash
# Test API is accessible
curl https://api.yourdomain.com/api/v1/user

# Should return 401 (Unauthenticated) - this is expected
```

### 3. Frontend Test

1. Navigate to `https://app.yourdomain.com`
2. Verify login page loads
3. Test login functionality
4. Verify API connection

### 4. CORS Test

Verify CORS headers are properly configured:

```bash
curl -H "Origin: https://app.yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://api.yourdomain.com/api/v1/login
```

---

## Troubleshooting

### Common Issues

**1. 500 Internal Server Error**
- Check Laravel logs: `storage/logs/laravel.log`
- Verify `.env` file exists and is configured correctly
- Check file permissions
- Clear cache: `php artisan config:clear && php artisan cache:clear`

**2. Database Connection Error**
- Verify database credentials in `.env`
- Check database server is running
- Verify database exists
- Check firewall rules

**3. CORS Errors**
- Verify `FRONTEND_URL` in backend `.env`
- Check `SANCTUM_STATEFUL_DOMAINS` includes frontend domain
- Verify CORS middleware is enabled

**4. Storage Permission Errors**
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

**5. Next.js Build Errors**
- Clear `.next` directory: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node -v` (should be 18+)

---

## Security Considerations

### ⚠️ IMPORTANT: This is for TESTING ONLY

**Security Issues to Address Before Production:**

1. **APP_DEBUG should be FALSE**
   ```env
   APP_DEBUG=false
   ```

2. **Use Strong Passwords**
   - Database passwords
   - Application keys
   - API keys

3. **Enable HTTPS**
   - Configure SSL certificates
   - Force HTTPS redirects
   - Update `APP_URL` to use `https://`

4. **File Permissions**
   - Restrict access to sensitive files
   - Ensure `.env` is not publicly accessible

5. **Rate Limiting**
   - Already configured in routes
   - Monitor for abuse

6. **Database Security**
   - Use strong passwords
   - Limit database user privileges
   - Enable database encryption

7. **Logging**
   - Monitor error logs regularly
   - Set up log rotation
   - Don't log sensitive information

8. **Backup Strategy**
   - Regular database backups
   - File storage backups
   - Test restore procedures

---

## Quick Deployment Script

A deployment script is available at `deploy-test.sh`. Run:

```bash
chmod +x deploy-test.sh
./deploy-test.sh
```

**Note:** Review and customize the script before running.

---

## Support

For issues or questions:
1. Check logs: `sas-scuba-api/storage/logs/laravel.log`
2. Review this guide
3. Check application documentation

---

**Last Updated:** January 2025
**Version:** Testing Environment
**Status:** ⚠️ NOT PRODUCTION READY

