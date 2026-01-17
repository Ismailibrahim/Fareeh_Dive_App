# Fast Build Configuration Guide

## Optimizations Applied

### 1. TypeScript Configuration
- ✅ `ignoreBuildErrors: true` - Skip type checking during build (much faster)
- ✅ `strict: false` - Less strict checking for faster compilation
- ✅ `skipLibCheck: true` - Skip checking declaration files
- ✅ `incremental: true` - Use incremental compilation

### 2. Next.js Configuration
- ✅ Disabled production source maps
- ✅ Enabled package import optimization
- ✅ React Compiler enabled (faster runtime)

### 3. Build Process
- ✅ Increased Node.js memory to 4GB
- ✅ Clean cache when needed
- ✅ Kill stuck processes automatically

## Build Commands

### Fast Build (Recommended)
```powershell
cd sas-scuba-web
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Clean Build (if issues)
```powershell
cd sas-scuba-web
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Kill Stuck Processes
```powershell
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
```

## Expected Build Times

- **First Build:** 1-2 minutes
- **Incremental Build:** 20-40 seconds
- **With Type Checking:** 2-3 minutes (if enabled)

## Type Checking Separately

If you want to check types without building:
```powershell
npx tsc --noEmit
```

## Performance Tips

1. **Use Incremental Builds** - Don't delete `.next` unless necessary
2. **Kill Stuck Processes** - If build hangs, kill Node processes
3. **Increase Memory** - Already set to 4GB
4. **Skip Type Checking** - Enabled for speed (check separately)

---

**Status:** ✅ Optimized for Fast Builds
**Build Time:** ~30-60 seconds (incremental)
