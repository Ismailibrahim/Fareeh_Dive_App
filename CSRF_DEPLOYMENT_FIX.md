# CSRF Token Issue - Deployment Fix

## Problem

During deployment, login fails with CSRF token errors. This is a common issue with Laravel Sanctum when deploying to production.

## Root Cause

The frontend was not properly reading the XSRF token from cookies and sending it in the `X-XSRF-TOKEN` header that Laravel expects.

## Solution Applied

### 1. Frontend Fix (`sas-scuba-web/src/lib/api/client.ts`)

**Changed:**
- Removed `withXSRFToken: true` (doesn't work reliably in all browsers)
- Added explicit cookie reading function
- Added code to read `XSRF-TOKEN` cookie and set `X-XSRF-TOKEN` header

**Key Changes:**
```typescript
// Added helper function to read cookies
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
}

// In request interceptor, after getting CSRF cookie:
const xsrfToken = getCookie('XSRF-TOKEN');
if (xsrfToken) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
}
```

## Required Environment Configuration

### Backend (.env)

```env
# Application
APP_NAME="SAS Scuba"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

# Frontend URL (for CORS and Sanctum)
FRONTEND_URL=https://app.yourdomain.com

# Sanctum Stateful Domains (comma-separated)
SANCTUM_STATEFUL_DOMAINS=app.yourdomain.com,localhost:3000

# Session Configuration
SESSION_DRIVER=database
SESSION_DOMAIN=.yourdomain.com  # Use leading dot for subdomain sharing
SESSION_SECURE_COOKIE=true      # Must be true for HTTPS
SESSION_SAME_SITE=lax           # Use 'none' if frontend/backend on different domains
SESSION_HTTP_ONLY=true
SESSION_LIFETIME=120

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
```

### Frontend (.env.local or .env.production)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Important Configuration Notes

### 1. Sanctum Stateful Domains

The `SANCTUM_STATEFUL_DOMAINS` must include your frontend domain:

```env
SANCTUM_STATEFUL_DOMAINS=app.yourdomain.com,localhost:3000
```

**Important:** Include the protocol and port if not standard:
- `https://app.yourdomain.com` (if using HTTPS)
- `app.yourdomain.com:3000` (if using custom port)

### 2. Session Cookie Domain

If frontend and backend are on different subdomains:

```env
SESSION_DOMAIN=.yourdomain.com  # Leading dot allows subdomain sharing
```

If frontend and backend are on same domain:

```env
SESSION_DOMAIN=null  # or don't set it
```

### 3. Session SameSite

For cross-origin requests (different domains):

```env
SESSION_SAME_SITE=none  # Requires SESSION_SECURE_COOKIE=true
```

For same-origin requests (same domain, different ports):

```env
SESSION_SAME_SITE=lax  # Default, works for most cases
```

### 4. HTTPS Requirements

If using HTTPS:
- `SESSION_SECURE_COOKIE=true` (required)
- `SESSION_SAME_SITE=none` (if cross-origin)
- Both frontend and backend must use HTTPS

## Deployment Checklist

### Backend
- [ ] Set `APP_URL` to production API URL
- [ ] Set `FRONTEND_URL` to production frontend URL
- [ ] Configure `SANCTUM_STATEFUL_DOMAINS` with frontend domain
- [ ] Set `SESSION_DOMAIN` correctly (or leave null for same domain)
- [ ] Set `SESSION_SECURE_COOKIE=true` if using HTTPS
- [ ] Set `SESSION_SAME_SITE` appropriately (lax or none)
- [ ] Clear config cache: `php artisan config:clear && php artisan config:cache`

### Frontend
- [ ] Set `NEXT_PUBLIC_API_URL` to production API URL
- [ ] Rebuild frontend: `npm run build`
- [ ] Verify API client is using correct base URL

### Testing
- [ ] Test CSRF cookie endpoint: `GET /sanctum/csrf-cookie`
- [ ] Verify XSRF-TOKEN cookie is set
- [ ] Test login with browser dev tools open
- [ ] Check Network tab for X-XSRF-TOKEN header
- [ ] Verify cookies are being sent (withCredentials: true)

## Troubleshooting

### Issue: CSRF token mismatch (419 error)

**Possible Causes:**
1. Frontend domain not in `SANCTUM_STATEFUL_DOMAINS`
2. Session cookie not being sent (check `withCredentials: true`)
3. XSRF-TOKEN cookie not being read correctly
4. Session domain mismatch

**Solutions:**
```bash
# Check Sanctum config
php artisan tinker
config('sanctum.stateful')

# Clear all caches
php artisan optimize:clear
php artisan config:clear
php artisan config:cache

# Check session configuration
php artisan tinker
config('session')
```

### Issue: Cookies not being sent

**Check:**
1. `withCredentials: true` in axios config ✓ (already set)
2. CORS `supports_credentials: true` ✓ (already set)
3. Session cookie domain matches frontend domain
4. HTTPS is configured correctly

### Issue: XSRF-TOKEN cookie not found

**Check:**
1. `/sanctum/csrf-cookie` endpoint is accessible
2. Cookie is being set (check browser DevTools > Application > Cookies)
3. Cookie domain matches frontend domain
4. Cookie is not being blocked by browser

## Browser DevTools Debugging

1. **Open DevTools** (F12)
2. **Network Tab:**
   - Check `/sanctum/csrf-cookie` request
   - Verify `Set-Cookie` header contains `XSRF-TOKEN`
   - Check subsequent requests have `X-XSRF-TOKEN` header

3. **Application Tab > Cookies:**
   - Verify `XSRF-TOKEN` cookie exists
   - Check cookie domain matches frontend domain
   - Check cookie `SameSite` attribute

4. **Console:**
   - Check for any CORS errors
   - Check for cookie-related errors

## Common Deployment Scenarios

### Scenario 1: Same Domain, Different Ports
```
Frontend: http://localhost:3000
Backend:  http://localhost:8000
```
**Config:**
```env
SESSION_DOMAIN=null
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=false
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

### Scenario 2: Different Subdomains (Same Domain)
```
Frontend: https://app.yourdomain.com
Backend:  https://api.yourdomain.com
```
**Config:**
```env
SESSION_DOMAIN=.yourdomain.com
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=true
SANCTUM_STATEFUL_DOMAINS=app.yourdomain.com
```

### Scenario 3: Different Domains
```
Frontend: https://app.example.com
Backend:  https://api.otherdomain.com
```
**Config:**
```env
SESSION_DOMAIN=null  # Can't share cookies across domains
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=true
SANCTUM_STATEFUL_DOMAINS=app.example.com
```

## Verification Steps

After deployment:

1. **Test CSRF Cookie Endpoint:**
   ```bash
   curl -X GET https://api.yourdomain.com/sanctum/csrf-cookie \
     -H "Origin: https://app.yourdomain.com" \
     -c cookies.txt \
     -v
   ```
   Should return `Set-Cookie: XSRF-TOKEN=...`

2. **Test Login:**
   ```bash
   curl -X POST https://api.yourdomain.com/api/v1/login \
     -H "Origin: https://app.yourdomain.com" \
     -H "X-XSRF-TOKEN: <token-from-cookie>" \
     -H "Content-Type: application/json" \
     -b cookies.txt \
     -d '{"email":"test@example.com","password":"password"}'
   ```

3. **Check Browser:**
   - Open browser DevTools
   - Go to Network tab
   - Try to login
   - Verify `X-XSRF-TOKEN` header is present in login request

## Additional Notes

- The fix ensures the XSRF token is properly read from cookies and sent in headers
- Works for both development and production environments
- Handles URL decoding of cookie values (Laravel URL-encodes cookie values)
- Gracefully handles cases where cookie might not be available (SSR)

## Files Modified

1. `sas-scuba-web/src/lib/api/client.ts` - Added cookie reading and header setting

## Related Files

- `sas-scuba-api/config/sanctum.php` - Sanctum configuration
- `sas-scuba-api/config/session.php` - Session configuration
- `sas-scuba-api/config/cors.php` - CORS configuration
- `sas-scuba-api/app/Http/Middleware/ValidateCsrfToken.php` - CSRF validation

---

**Fix Applied:** Frontend now properly reads XSRF token from cookies and sends it in headers.

