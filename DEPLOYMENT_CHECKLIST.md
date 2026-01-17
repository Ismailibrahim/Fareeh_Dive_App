# Deployment Checklist

Use this checklist to ensure all steps are completed before deploying.

## Pre-Deployment

### Server Setup
- [ ] Server meets minimum requirements (PHP 8.2+, Node.js 18+, MySQL 8.0+)
- [ ] Web server (Apache/Nginx) installed and configured
- [ ] SSL certificate obtained and configured (recommended)
- [ ] Firewall rules configured
- [ ] Domain/subdomain DNS configured
- [ ] Backup strategy in place

### Code Preparation
- [ ] Code pulled from repository
- [ ] All dependencies installed (`composer install`, `npm install`)
- [ ] No uncommitted changes (or intentional for testing)
- [ ] Code reviewed for hardcoded values

### Environment Configuration
- [ ] Backend `.env` file created with correct values
- [ ] Frontend `.env.local` file created with correct values
- [ ] Database credentials configured
- [ ] API URLs configured correctly
- [ ] CORS settings configured
- [ ] Mail settings configured (if needed)

## Backend Deployment

### Laravel API Setup
- [ ] Dependencies installed (`composer install --no-dev --optimize-autoloader`)
- [ ] Application key generated (`php artisan key:generate`)
- [ ] Storage link created (`php artisan storage:link`)
- [ ] Storage permissions set correctly (775)
- [ ] Database created
- [ ] Migrations run successfully (`php artisan migrate --force`)
- [ ] Seeders run (if needed) (`php artisan db:seed`)
- [ ] Configuration cached (`php artisan config:cache`)
- [ ] Routes cached (`php artisan route:cache`)
- [ ] Views cached (`php artisan view:cache`)
- [ ] Assets built (`npm run build`)

### Web Server Configuration
- [ ] Virtual host configured (Apache/Nginx)
- [ ] Document root set to `public` directory
- [ ] PHP-FPM configured correctly
- [ ] Web server restarted
- [ ] Permissions set correctly (755 for directories, 644 for files)

## Frontend Deployment

### Next.js Setup
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env.local`)
- [ ] Application built (`npm run build`)
- [ ] Build successful with no errors
- [ ] Production server started (PM2/systemd/standalone)

### Reverse Proxy
- [ ] Nginx/Apache reverse proxy configured
- [ ] Proxy headers configured correctly
- [ ] SSL configured (if using HTTPS)

## Database

- [ ] Database created
- [ ] Database user created with appropriate permissions
- [ ] Migrations run successfully
- [ ] Test data seeded (if needed)
- [ ] Database backup taken

## Post-Deployment Verification

### Health Checks
- [ ] Backend health endpoint accessible (`/up`)
- [ ] Frontend loads correctly
- [ ] API endpoints respond correctly
- [ ] CORS headers configured correctly

### Functionality Tests
- [ ] User can access login page
- [ ] User can log in successfully
- [ ] API authentication works
- [ ] File uploads work (if applicable)
- [ ] Database queries execute correctly
- [ ] Error handling works correctly

### Security Checks
- [ ] `.env` files not publicly accessible
- [ ] Storage directories have correct permissions
- [ ] Debug mode disabled (`APP_DEBUG=false` for production)
- [ ] HTTPS configured (if applicable)
- [ ] Security headers present
- [ ] Rate limiting working

### Performance Checks
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] No console errors in browser
- [ ] Assets loading correctly

## Monitoring & Logging

- [ ] Error logging configured
- [ ] Log rotation configured
- [ ] Monitoring tools set up (optional)
- [ ] Log files accessible and readable

## Documentation

- [ ] Deployment documentation updated
- [ ] Environment variables documented
- [ ] Troubleshooting guide available
- [ ] Contact information for support

## Rollback Plan

- [ ] Previous version backed up
- [ ] Database backup available
- [ ] Rollback procedure documented
- [ ] Team notified of deployment

---

## Notes

- ⚠️ This checklist is for **TESTING** environment deployment
- ⚠️ Additional security measures required for production
- ⚠️ Review all configurations before deployment
- ⚠️ Test thoroughly before going live

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Environment:** Testing
**Status:** ⚠️ NOT PRODUCTION READY

