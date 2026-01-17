# Next.js Reverse Proxy Readiness Check

## ✅ Status: READY

This document verifies that the Next.js application is properly configured for deployment behind a reverse proxy.

## Configuration Summary

### 1. Next.js Configuration (`next.config.ts`)

**✅ Security Headers Configured:**
- `X-DNS-Prefetch-Control`: Enabled
- `X-Frame-Options`: SAMEORIGIN
- `X-Content-Type-Options`: nosniff
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Content-Security-Policy`: Configured with API URL support
- `poweredByHeader`: Disabled (security best practice)
- `compress`: Enabled (performance optimization)

**✅ Image Configuration:**
- Remote patterns configured for API storage
- Supports both HTTP (localhost) and HTTPS (production)
- Image optimization disabled in development

**✅ React Compiler:**
- Enabled for better performance

### 2. API Client Configuration

**✅ Environment Variable Support:**
- Uses `NEXT_PUBLIC_API_URL` environment variable
- Falls back to `http://localhost:8000` for development
- All API calls use this centralized configuration

**✅ CORS & Authentication:**
- `withCredentials: true` configured for cookie-based auth
- CSRF token handling implemented
- Proper headers for Laravel Sanctum

**Files Using API URL:**
- `src/lib/api/client.ts` - Main API client
- `src/lib/api/services/auth.service.ts` - Authentication
- `src/lib/api/services/pre-registration.service.ts` - Public endpoints
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/pre-registration/[token]/page.tsx` - Pre-registration

### 3. Backend (Laravel) Configuration

**✅ Reverse Proxy Support:**
- `TrustProxies` middleware configured (trusts all proxies)
- CORS configured with multiple origin support
- Sanctum stateful domains configured
- Security headers middleware active

**✅ Environment Variables Required:**
```env
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
SANCTUM_STATEFUL_DOMAINS=app.yourdomain.com,yourdomain.com
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
```

### 4. Frontend Environment Variables

**Required for Production:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

**Optional:**
```env
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_APP_NAME="SAS Scuba"
NEXT_PUBLIC_ITEMS_PER_PAGE=20
NEXT_PUBLIC_CURRENCY=USD
```

## Reverse Proxy Configuration Examples

### Nginx Configuration for Next.js

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;

    # Redirect HTTP to HTTPS (recommended)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to Next.js (default port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header X-Forwarded-Host $host;
        
        # Cache bypass for upgrades
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache Configuration for Next.js

```apache
<VirtualHost *:80>
    ServerName app.yourdomain.com
    
    # Redirect to HTTPS
    Redirect permanent / https://app.yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName app.yourdomain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    # Proxy to Next.js
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
    
    # Forward proxy headers
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"
    RequestHeader set X-Forwarded-Host "app.yourdomain.com"
    
    # WebSocket support
    RewriteEngine on
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:3000/$1" [P,L]
</VirtualHost>
```

## Deployment Checklist

### Pre-Deployment

- [x] Next.js configuration includes security headers
- [x] API client uses environment variables
- [x] Image remote patterns configured
- [x] Backend TrustProxies middleware configured
- [x] CORS properly configured
- [ ] Environment variables set for production
- [ ] SSL certificates obtained
- [ ] Reverse proxy (Nginx/Apache) configured
- [ ] Domain DNS configured

### Build & Deploy

1. **Build Next.js Application:**
   ```bash
   cd sas-scuba-web
   npm install
   npm run build
   ```

2. **Start Production Server:**
   ```bash
   # Option 1: Using PM2 (Recommended)
   pm2 start npm --name "sas-scuba-web" -- start
   
   # Option 2: Using systemd
   # See DEPLOYMENT_GUIDE.md for systemd configuration
   
   # Option 3: Standalone mode
   # Uncomment `output: 'standalone'` in next.config.ts
   # Then: node .next/standalone/server.js
   ```

3. **Configure Reverse Proxy:**
   - Use Nginx or Apache configuration above
   - Ensure proxy headers are forwarded
   - Configure SSL/TLS

4. **Verify Deployment:**
   ```bash
   # Check Next.js is running
   curl http://localhost:3000
   
   # Check through reverse proxy
   curl https://app.yourdomain.com
   
   # Check API connection
   curl https://api.yourdomain.com/up
   ```

## Testing Reverse Proxy Setup

### 1. Test Next.js Directly
```bash
curl http://localhost:3000
# Should return HTML response
```

### 2. Test Through Reverse Proxy
```bash
curl https://app.yourdomain.com
# Should return same HTML response
```

### 3. Test API Connection
```bash
# From browser console or Postman
# Should connect to API without CORS errors
fetch('https://api.yourdomain.com/api/v1/user', {
  credentials: 'include'
})
```

### 4. Test Security Headers
```bash
curl -I https://app.yourdomain.com
# Should see security headers in response
```

## Common Issues & Solutions

### Issue: CORS Errors
**Solution:**
- Verify `FRONTEND_URL` in backend `.env` matches frontend domain
- Check `SANCTUM_STATEFUL_DOMAINS` includes frontend domain
- Ensure `NEXT_PUBLIC_API_URL` is set correctly

### Issue: 502 Bad Gateway
**Solution:**
- Verify Next.js is running on port 3000
- Check reverse proxy configuration
- Review Next.js logs: `pm2 logs sas-scuba-web`

### Issue: Security Headers Not Applied
**Solution:**
- Clear Next.js cache: `rm -rf .next`
- Rebuild application: `npm run build`
- Restart Next.js server

### Issue: API Connection Fails
**Solution:**
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Check API server is accessible
- Verify CORS configuration on backend
- Check browser console for detailed errors

### Issue: Images Not Loading
**Solution:**
- Verify image remote patterns in `next.config.ts`
- Check API storage URL is accessible
- Verify CORS allows image requests

## Performance Optimizations

### Already Configured:
- ✅ Compression enabled
- ✅ Security headers optimized
- ✅ Image optimization (disabled in dev, enabled in prod)

### Recommended Additional Optimizations:

1. **Enable Standalone Output:**
   ```typescript
   // In next.config.ts
   output: 'standalone',
   ```

2. **Configure CDN:**
   - Use CDN for static assets
   - Configure Cloudflare or similar
   - Update image domains in `next.config.ts`

3. **Enable Caching:**
   - Configure reverse proxy caching
   - Set appropriate cache headers
   - Use Next.js ISR (Incremental Static Regeneration)

## Security Considerations

### ✅ Implemented:
- Security headers configured
- CSP policy in place
- XSS protection enabled
- Clickjacking protection
- MIME type sniffing prevention

### ⚠️ Production Recommendations:
1. **Restrict TrustProxies:**
   ```php
   // In Laravel bootstrap/app.php
   $middleware->trustProxies(at: ['192.168.1.1', '10.0.0.1']); // Specific IPs
   ```

2. **Enable HTTPS Only:**
   - Force HTTPS redirects
   - Use HSTS headers
   - Configure secure cookies

3. **Rate Limiting:**
   - Configure rate limits on reverse proxy
   - Use Laravel rate limiting
   - Monitor for abuse

## Monitoring & Logging

### Next.js Logs:
```bash
# PM2 logs
pm2 logs sas-scuba-web

# Systemd logs
journalctl -u sas-scuba-web -f
```

### Reverse Proxy Logs:
```bash
# Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Apache
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log
```

## Summary

✅ **Next.js is ready for reverse proxy deployment**

**Key Points:**
- Security headers configured
- API client properly configured
- Environment variables supported
- Image handling configured
- Backend reverse proxy support ready
- CORS properly configured

**Next Steps:**
1. Set production environment variables
2. Configure reverse proxy (Nginx/Apache)
3. Obtain SSL certificates
4. Build and deploy application
5. Test all functionality
6. Monitor logs and performance

---

**Last Updated:** January 2025  
**Status:** ✅ Ready for Reverse Proxy Deployment
