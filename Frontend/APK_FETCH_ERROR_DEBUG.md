# APK "Failed to Fetch" Debugging Guide

## Issue Summary
- ✅ **Browser on phone works**: `http://192.168.43.48:3000` (uses Vite proxy)
- ❌ **APK fails**: Direct connection to `https://192.168.43.48:7137/api`

## Root Cause Analysis

### Why Browser Works
Browser connects to Vite dev server (`http://192.168.43.48:3000`) which:
1. Uses `.env.development` with `VITE_API_URL=/api`
2. Vite proxy forwards `/api` → `https://localhost:7137`
3. No CORS issues (same-origin)
4. No SSL certificate issues (backend on same machine)

### Why APK Fails
APK uses production build which:
1. Uses `.env.production` with `VITE_API_URL=https://192.168.43.48:7137/api`
2. Direct connection from `https://localhost` (Capacitor WebView) to backend
3. **Possible Issues:**
   - SSL certificate not trusted by Android
   - Backend CORS not allowing `https://localhost` origin
   - Backend not accessible from network IP

## Quick Diagnostics

### Step 1: Run Debug Script
```powershell
.\debug-apk-network.ps1
```
Then try to login on the APK and look for:
- `SSL`, `Certificate`, `ERR_CERT` errors → SSL issue
- `CORS policy`, `Access-Control` errors → CORS issue  
- `ERR_CONNECTION`, `Failed to connect` → Network issue

### Step 2: Test Backend Accessibility

Test HTTPS connection from Windows:
```powershell
# Should show TcpTestSucceeded: True
Test-NetConnection 192.168.43.48 -Port 7137
```

Test HTTPS from phone browser:
```
https://192.168.43.48:7137/api/health
```
- If you get SSL warning → Certificate issue
- If it loads → Backend is accessible

### Step 3: Check Backend CORS Configuration

Backend needs to allow requests from `https://localhost` origin (Capacitor WebView).

In your ASP.NET Core `Program.cs` or `Startup.cs`, you need:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowCapacitor", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost",
                "https://localhost",
                "capacitor://localhost",
                "ionic://localhost",
                "http://localhost:3000",
                "https://192.168.43.48:7137"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Then use it:
app.UseCors("AllowCapacitor");
```

## Solutions

### Solution 1: Fix CORS (Recommended)
Update backend CORS to allow `https://localhost` origin.

After updating backend:
```powershell
cd D:\Work Repos\AI\yaqeenpay\Frontend
.\rebuild-apk.ps1
```

### Solution 2: Use HTTP Instead (Quick Fix)
If SSL is problematic, use HTTP:

1. Make sure backend runs on HTTP port 5137:
```powershell
# Check if HTTP port is listening
netstat -ano | findstr ":5137"
```

2. Update `.env.production`:
```bash
VITE_API_URL=http://192.168.43.48:5137/api
```

3. Update `capacitor.config.ts`:
```typescript
server: {
    androidScheme: 'http',  // Change from 'https'
    cleartext: true,
    allowNavigation: ['*']
}
```

4. Rebuild:
```powershell
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

### Solution 3: Test with HTTP Temporarily

Just to verify connectivity works without SSL:
```powershell
# Start backend on HTTP (if not already running)
# Then update .env.production to use http://192.168.43.48:5137/api
# Rebuild APK
```

## Verification Steps

After applying a solution:

1. **Install fresh APK**
```powershell
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

2. **Monitor logs**
```powershell
.\debug-apk-network.ps1
```

3. **Try login**
   - Should see: `POST https://192.168.43.48:7137/api/auth/login`
   - Should NOT see: CORS errors, SSL errors, or "Failed to fetch"

4. **Success indicators:**
   - Login works
   - Token stored
   - Dashboard loads

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ERR_CERT_AUTHORITY_INVALID` | SSL certificate not trusted | Solution 1 (CORS) or Solution 2 (HTTP) |
| `blocked by CORS policy` | Backend doesn't allow origin | Solution 1 (Fix CORS) |
| `Failed to fetch` (immediate) | Backend not reachable | Check firewall, network |
| `Mixed Content` | HTTP/HTTPS mismatch | Match schemes in config |
| `ERR_CONNECTION_REFUSED` | Backend not running on that port | Check backend is listening |

## Next Steps

1. Run `.\debug-apk-network.ps1`
2. Try login on APK
3. Share the error message you see
4. I'll provide the exact fix based on the error

## Contact Backend Team

Ask them to:
1. ✅ Enable CORS for `https://localhost` origin
2. ✅ Run backend on `0.0.0.0` (not just `127.0.0.1`)
3. ✅ Confirm ports 7137 (HTTPS) or 5137 (HTTP) are listening on all interfaces
