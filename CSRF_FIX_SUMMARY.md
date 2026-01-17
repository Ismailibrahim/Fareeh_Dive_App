# CSRF Token Issue - Fix Summary

## ✅ Issue Fixed

**Problem:** Login fails during deployment due to CSRF token mismatch (419 error)

**Root Cause:** Frontend was not reading the XSRF token from cookies and sending it in the `X-XSRF-TOKEN` header

**Solution:** Updated frontend API client to explicitly read `XSRF-TOKEN` cookie and set `X-XSRF-TOKEN` header

## Changes Made

### 1. Frontend Fix (`sas-scuba-web/src/lib/api/client.ts`)

**Added:**
- Cookie reading helper function
- Code to read `XSRF-TOKEN` cookie and decode it
- Code to set `X-XSRF-TOKEN` header in requests

**Key Code:**
```typescript
// Helper function to get cookie value
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
}

// In request interceptor:
const xsrfToken = getCookie('XSRF-TOKEN');
if (xsrfToken) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
}
```

## Deployment Configuration

### Required Environment Variables

#### Backend (.env)
```env
# Application
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com

# Sanctum
SANCTUM_STATEFUL_DOMAINS=app.yourdomain.com

# Session (adjust based on your setup)
SESSION_DOMAIN=.yourdomain.com  # For subdomains
SESSION_SECURE_COOKIE=true      # Required for HTTPS
SESSION_SAME_SITE=lax           # Use 'none' if different domains
```

#### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Configuration Scenarios

#### Scenario 1: Same Domain, Different Ports (Development)
```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
```

#### Scenario 2: Different Subdomains (Production)
```env
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
SANCTUM_STATEFUL_DOMAINS=app.yourdomain.com
SESSION_DOMAIN=.yourdomain.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
```

#### Scenario 3: Different Domains (Production)
```env
APP_URL=https://api.example.com
FRONTEND_URL=https://app.otherdomain.com
SANCTUM_STATEFUL_DOMAINS=app.otherdomain.com
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none
```

## Testing

### 1. Run CSRF Configuration Check
```bash
cd sas-scuba-api
php check-csrf-config.php
```

### 2. Test CSRF Cookie Endpoint
```bash
curl -X GET http://localhost:8000/sanctum/csrf-cookie \
  -H "Origin: http://localhost:3000" \
  -c cookies.txt \
  -v
```

Should return `Set-Cookie: XSRF-TOKEN=...`

### 3. Test Login (Browser)
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Check login request headers:
   - Should have `X-XSRF-TOKEN` header
   - Should have `Cookie` header with session cookie

### 4. Verify Cookies (Browser DevTools)
1. Open Application tab > Cookies
2. Verify `XSRF-TOKEN` cookie exists
3. Check cookie domain matches frontend domain
4. Check `SameSite` attribute is correct

## Post-Deployment Steps

1. **Clear Config Cache:**
   ```bash
   php artisan config:clear
   php artisan config:cache
   ```

2. **Rebuild Frontend:**
   ```bash
   cd sas-scuba-web
   npm run build
   ```

3. **Test Login:**
   - Try logging in
   - Check browser console for errors
   - Verify cookies are set
   - Check network requests have correct headers

## Troubleshooting

### Issue: Still getting 419 CSRF token mismatch

**Check:**
1. Frontend domain is in `SANCTUM_STATEFUL_DOMAINS`
2. `X-XSRF-TOKEN` header is present in requests (check Network tab)
3. `XSRF-TOKEN` cookie exists (check Application > Cookies)
4. Session cookie is being sent (`withCredentials: true`)
5. CORS `supports_credentials: true` is set

**Debug:**
```bash
# Check Sanctum config
php artisan tinker
config('sanctum.stateful')

# Check session config
config('session')
```

### Issue: Cookies not being set

**Check:**
1. CORS configuration allows credentials
2. Session domain matches frontend domain
3. HTTPS is configured correctly (if using HTTPS)
4. Browser is not blocking cookies

### Issue: XSRF-TOKEN cookie not found

**Check:**
1. `/sanctum/csrf-cookie` endpoint is accessible
2. Cookie is being set (check Set-Cookie header)
3. Cookie domain allows frontend to read it
4. Cookie is not being blocked by browser

## Files Modified

1. ✅ `sas-scuba-web/src/lib/api/client.ts` - Added cookie reading and header setting

## Files Created

1. ✅ `CSRF_DEPLOYMENT_FIX.md` - Detailed deployment guide
2. ✅ `sas-scuba-api/check-csrf-config.php` - Configuration checker script
3. ✅ `CSRF_FIX_SUMMARY.md` - This summary

## Verification Checklist

- [x] Frontend reads XSRF token from cookies
- [x] Frontend sends X-XSRF-TOKEN header
- [x] CSRF configuration check script created
- [x] Deployment guide created
- [ ] Tested on development environment
- [ ] Tested on staging environment
- [ ] Deployed to production

## Next Steps

1. **Test Locally:**
   - Clear browser cookies
   - Try logging in
   - Verify it works

2. **Deploy to Staging:**
   - Update environment variables
   - Rebuild frontend
   - Test login

3. **Deploy to Production:**
   - Follow deployment checklist
   - Monitor logs
   - Test login immediately after deployment

---

**Fix Applied:** Frontend now properly handles CSRF tokens for deployment! 🎉

