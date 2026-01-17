# Deployment Readiness Checklist

## Pre-Deployment Testing Checklist

Use this checklist before deploying to production to ensure everything is ready.

### ✅ 1. Database & Migrations
- [x] All migrations reviewed and fixed
- [x] All migrations run successfully (`php artisan migrate:status`)
- [ ] Database backup created
- [ ] Test migrations on staging environment
- [ ] Verify rollback procedures work
- [ ] Check database connection credentials
- [ ] Verify database user has required permissions

### ✅ 2. Dependencies
- [ ] Composer dependencies installed (`composer install --no-dev --optimize-autoloader`)
- [ ] NPM dependencies installed (`npm install`)
- [ ] No dependency conflicts
- [ ] Production dependencies only (no dev dependencies)
- [ ] Autoloader optimized

### ✅ 3. Environment Configuration
- [ ] `.env` file configured for production
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY` generated
- [ ] Database credentials correct
- [ ] CORS origins configured correctly
- [ ] `FRONTEND_URL` set correctly
- [ ] `APP_URL` set correctly
- [ ] Session configuration correct
- [ ] Cache driver configured
- [ ] Queue driver configured
- [ ] Mail configuration correct
- [ ] File storage configured (S3/local)

### ✅ 4. File Permissions & Directories
- [ ] `storage/` directory writable (755 or 775)
- [ ] `storage/app/` writable
- [ ] `storage/framework/` writable
- [ ] `storage/logs/` writable
- [ ] `bootstrap/cache/` writable
- [ ] `.env` file permissions correct (600 or 640)
- [ ] All required directories exist

### ✅ 5. PHP Requirements
- [ ] PHP version >= 8.2
- [ ] Required PHP extensions installed:
  - [ ] `pdo`
  - [ ] `pdo_mysql` (or `pdo_pgsql` for PostgreSQL)
  - [ ] `mbstring`
  - [ ] `openssl`
  - [ ] `json`
  - [ ] `xml`
  - [ ] `curl`
  - [ ] `zip`
  - [ ] `gd` or `imagick` (for image processing)
  - [ ] `fileinfo`
  - [ ] `tokenizer`
  - [ ] `ctype`
  - [ ] `bcmath`

### ✅ 6. Laravel Configuration
- [ ] Application key generated (`php artisan key:generate`)
- [ ] Config cached (`php artisan config:cache`)
- [ ] Routes cached (`php artisan route:cache`)
- [ ] Views cached (`php artisan view:cache`)
- [ ] Events cached (`php artisan event:cache`)
- [ ] Cache cleared (`php artisan cache:clear`)
- [ ] Optimized (`php artisan optimize`)

### ✅ 7. Frontend Build
- [ ] Next.js build successful (`npm run build`)
- [ ] No build errors
- [ ] Environment variables set correctly
- [ ] API URL configured correctly
- [ ] Static assets generated
- [ ] Production build tested locally

### ✅ 8. API Routes & Endpoints
- [ ] All API routes registered
- [ ] Route caching works
- [ ] Authentication routes working
- [ ] CORS configured correctly
- [ ] Rate limiting configured
- [ ] API endpoints tested

### ✅ 9. Database Seeders
- [ ] Seeders reviewed
- [ ] Critical seeders identified
- [ ] Test seeders on staging
- [ ] Verify seeders don't duplicate data
- [ ] Check for idempotent seeders

### ✅ 10. Security
- [ ] `.env` file not in version control
- [ ] `.gitignore` configured correctly
- [ ] Debug mode disabled in production
- [ ] HTTPS configured
- [ ] CSRF protection enabled
- [ ] XSS protection enabled
- [ ] SQL injection protection verified
- [ ] Rate limiting enabled
- [ ] Authentication working correctly
- [ ] Authorization checks in place

### ✅ 11. Logging & Monitoring
- [ ] Logging configured
- [ ] Log directory writable
- [ ] Log rotation configured
- [ ] Error tracking setup (if applicable)
- [ ] Monitoring tools configured

### ✅ 12. Queue & Jobs
- [ ] Queue driver configured
- [ ] Queue workers configured
- [ ] Failed jobs table exists
- [ ] Queue monitoring setup

### ✅ 13. File Storage
- [ ] Storage disk configured
- [ ] Storage directory writable
- [ ] File upload limits configured
- [ ] S3 credentials correct (if using S3)

### ✅ 14. Session & Cache
- [ ] Session driver configured
- [ ] Cache driver configured
- [ ] Redis configured (if using)
- [ ] Session storage writable

### ✅ 15. Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] API tests pass
- [ ] Frontend tests pass
- [ ] End-to-end tests pass (if applicable)

### ✅ 16. Performance
- [ ] Database indexes created
- [ ] Query optimization reviewed
- [ ] Caching strategy implemented
- [ ] Asset optimization done
- [ ] CDN configured (if applicable)

### ✅ 17. Documentation
- [ ] API documentation updated
- [ ] Deployment guide updated
- [ ] Environment variables documented
- [ ] Troubleshooting guide available

### ✅ 18. Rollback Plan
- [ ] Rollback procedure documented
- [ ] Database backup strategy
- [ ] Code rollback procedure
- [ ] Emergency contacts listed

## Critical Pre-Deployment Commands

```bash
# Backend (Laravel)
cd sas-scuba-api

# Install dependencies
composer install --no-dev --optimize-autoloader

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Clear and cache config
php artisan config:clear
php artisan config:cache

# Clear and cache routes
php artisan route:clear
php artisan route:cache

# Clear and cache views
php artisan view:clear
php artisan view:cache

# Clear and cache events
php artisan event:clear
php artisan event:cache

# Clear all caches
php artisan cache:clear
php artisan optimize

# Frontend (Next.js)
cd sas-scuba-web

# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm start
```

## Post-Deployment Verification

After deployment, verify:

1. **Application Health**
   - [ ] Application loads correctly
   - [ ] No 500 errors
   - [ ] API endpoints responding
   - [ ] Frontend loads correctly

2. **Database**
   - [ ] Database connection working
   - [ ] All tables exist
   - [ ] Data integrity verified

3. **Authentication**
   - [ ] Login works
   - [ ] Logout works
   - [ ] Session persistence works
   - [ ] Token authentication works

4. **File Operations**
   - [ ] File uploads work
   - [ ] File downloads work
   - [ ] File storage accessible

5. **API Endpoints**
   - [ ] All critical endpoints tested
   - [ ] Response times acceptable
   - [ ] Error handling works

6. **Monitoring**
   - [ ] Logs being written
   - [ ] Errors being logged
   - [ ] Performance metrics available

## Emergency Rollback

If deployment fails:

1. **Immediate Actions**
   ```bash
   # Stop application
   # Restore previous code version
   # Restore database backup
   # Clear caches
   php artisan cache:clear
   php artisan config:clear
   php artisan route:clear
   php artisan view:clear
   ```

2. **Verify Rollback**
   - [ ] Application loads
   - [ ] Database restored
   - [ ] Critical features working

3. **Investigate Issues**
   - [ ] Check logs
   - [ ] Review error messages
   - [ ] Identify root cause
   - [ ] Fix issues before retry

## Notes

- Always backup database before deployment
- Test on staging environment first
- Deploy during low-traffic periods if possible
- Have rollback plan ready
- Monitor logs closely after deployment
- Keep emergency contacts available

