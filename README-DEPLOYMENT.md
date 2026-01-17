# SAS Scuba - Deployment Documentation

This directory contains all documentation and scripts needed to deploy the SAS Scuba application for **testing purposes**.

⚠️ **IMPORTANT:** This deployment is for **TESTING ENVIRONMENT ONLY**. It is **NOT production-ready**.

---

## 📚 Documentation

### Quick Start
1. **DEPLOYMENT_SUMMARY.md** - Start here! Quick overview and next steps
2. **DEPLOYMENT_GUIDE.md** - Complete step-by-step deployment guide
3. **DEPLOYMENT_CHECKLIST.md** - Pre-deployment checklist
4. **DEPLOYMENT_CODE_REVIEW.md** - Detailed code review findings

### Recommended Reading Order
1. Read **DEPLOYMENT_SUMMARY.md** first
2. Review **DEPLOYMENT_CHECKLIST.md**
3. Follow **DEPLOYMENT_GUIDE.md** for deployment
4. Reference **DEPLOYMENT_CODE_REVIEW.md** for details

---

## 🚀 Quick Deployment

### Using Scripts

**Linux/macOS:**
```bash
chmod +x deploy-test.sh
./deploy-test.sh
```

**Windows:**
```powershell
.\deploy-test.ps1
```

### Manual Deployment

See **DEPLOYMENT_GUIDE.md** for detailed manual steps.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Server meets requirements (PHP 8.2+, Node.js 18+, MySQL 8.0+)
- [ ] Redis installed and running (recommended)
- [ ] Web server configured (Apache/Nginx)
- [ ] Database created and accessible
- [ ] Environment variables prepared
- [ ] Domain/IP configured
- [ ] SSL certificate (recommended)

See **DEPLOYMENT_CHECKLIST.md** for complete checklist.

---

## ⚙️ Configuration

### Backend (Laravel API)

Create `.env` file in `sas-scuba-api/`:

```env
APP_NAME="SAS Scuba"
APP_ENV=testing
APP_DEBUG=true
APP_URL=http://your-api-domain.com

FRONTEND_URL=http://your-frontend-domain.com
SANCTUM_STATEFUL_DOMAINS=your-frontend-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sas_scuba_test
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# Redis Configuration (recommended)
CACHE_STORE=redis
SESSION_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null
```

### Frontend (Next.js)

Create `.env.local` file in `sas-scuba-web/`:

```env
NEXT_PUBLIC_API_URL=http://your-api-domain.com
NEXT_PUBLIC_API_VERSION=v1
```

See **DEPLOYMENT_GUIDE.md** for complete configuration.

---

## 🔒 Security Notes

### For Testing (Current)
- ✅ Basic security measures in place
- ✅ Rate limiting configured
- ✅ Security headers implemented
- ⚠️ Debug mode enabled (OK for testing)
- ⚠️ HTTP acceptable (OK for internal testing)

### For Production (Future)
- ⚠️ Disable debug mode (`APP_DEBUG=false`)
- ⚠️ Enable HTTPS
- ✅ Redis configured for cache/sessions/queue (see DEPLOYMENT_GUIDE.md)
- ⚠️ Configure S3 for file storage
- ⚠️ Set up monitoring
- ⚠️ Security audit required

---

## 📁 Project Structure

```
Fareeh_DiveApplicaiton/
├── DEPLOYMENT_GUIDE.md          # Complete deployment guide
├── DEPLOYMENT_CHECKLIST.md      # Pre-deployment checklist
├── DEPLOYMENT_CODE_REVIEW.md    # Code review summary
├── DEPLOYMENT_SUMMARY.md        # Quick reference
├── README-DEPLOYMENT.md         # This file
├── deploy-test.sh              # Bash deployment script
├── deploy-test.ps1             # PowerShell deployment script
├── sas-scuba-api/              # Laravel backend
│   └── .env                    # Backend configuration (create)
└── sas-scuba-web/              # Next.js frontend
    └── .env.local              # Frontend configuration (create)
```

---

## 🐛 Troubleshooting

Common issues and solutions:

1. **500 Internal Server Error**
   - Check Laravel logs: `sas-scuba-api/storage/logs/laravel.log`
   - Verify `.env` configuration
   - Check file permissions

2. **Database Connection Error**
   - Verify database credentials
   - Check database server is running
   - Verify database exists

3. **CORS Errors**
   - Check `FRONTEND_URL` in backend `.env`
   - Verify `SANCTUM_STATEFUL_DOMAINS`

See **DEPLOYMENT_GUIDE.md** → **Troubleshooting** for more.

---

## ✅ Post-Deployment Verification

After deployment, verify:

1. **Health Checks**
   ```bash
   curl https://your-api-domain.com/up
   curl https://your-frontend-domain.com
   ```

2. **API Test**
   ```bash
   curl https://your-api-domain.com/api/v1/user
   # Should return 401 (Unauthenticated) - expected
   ```

3. **Frontend Test**
   - Navigate to frontend URL
   - Verify login page loads
   - Test login functionality

---

## 📞 Support

For issues:
1. Check **DEPLOYMENT_GUIDE.md** → **Troubleshooting**
2. Review logs: `sas-scuba-api/storage/logs/laravel.log`
3. Check browser console for frontend errors

---

## 📝 Notes

- This deployment is for **TESTING** only
- Review all configurations before deploying
- Test thoroughly before going live
- See individual documentation files for details

---

**Last Updated:** January 2025  
**Status:** ✅ Ready for Testing Deployment  
**Environment:** Testing (NOT Production Ready)

