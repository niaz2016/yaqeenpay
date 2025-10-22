# APK "Failed to Fetch" - Complete Resolution Guide

## Current Status (October 21, 2025)

### ✅ Frontend APK: FULLY CONFIGURED & READY
- APK built with HTTP configuration
- Capacitor properly configured
- APK installed on device
- **No frontend changes needed - APK is ready to work**

### ❌ Backend API: REQUIRES UPDATES
- **Problem:** Backend redirecting HTTP → HTTPS (Status 307)
- **Impact:** Breaks CORS preflight requests from APK
- **Estimated fix time:** 5-10 minutes

---

## The Error (From APK Logcat)

```
Access to fetch at 'http://192.168.43.48:5137/api/auth/login' from origin 'http://localhost' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
Redirect is not allowed for a preflight request.
```

### What This Means:
1. APK (Capacitor WebView) tries to call backend API
2. Browser sends CORS preflight OPTIONS request
3. Backend redirects HTTP → HTTPS (Status 307)
4. Browser rejects this because **redirects are not allowed during CORS preflight**
5. Login fails with "Failed to fetch"

---

## Why Browser Works But APK Doesn't

| Environment | What Happens | Result |
|-------------|--------------|--------|
| **Browser (http://192.168.43.48:3000)** | Uses Vite dev server proxy<br>Requests go to same origin<br>No CORS issues | ✅ Works |
| **APK** | Direct call to backend<br>Origin: `http://localhost`<br>Backend redirects → CORS fails | ❌ Fails |

---

## Required Backend Changes

### File to Edit: `Program.cs` (ASP.NET Core backend)

### Change 1: Disable HTTPS Redirect for Development

**Find this line (usually near the middleware configuration):**
```csharp
app.UseHttpsRedirection();
```

**Replace with ONE of these options:**

**Option A: Conditional (Recommended)**
```csharp
#if !DEBUG
app.UseHttpsRedirection();  // Only redirect in production
#endif
```

**Option B: Exclude API routes**
```csharp
// Remove: app.UseHttpsRedirection();

// Add this instead:
app.Use(async (context, next) =>
{
    if (!context.Request.Path.StartsWithSegments("/api") && !context.Request.IsHttps)
    {
        var httpsUrl = $"https://{context.Request.Host}{context.Request.Path}{context.Request.QueryString}";
        context.Response.Redirect(httpsUrl, permanent: false);
        return;
    }
    await next();
});
```

### Change 2: Add CORS Policy

**Add this BEFORE `var app = builder.Build();`:**
```csharp
// Configure CORS for Capacitor and development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost",      // Capacitor WebView
                "https://localhost",     // Capacitor HTTPS mode
                "http://localhost:3000", // Vite dev server
                "http://192.168.43.48:3000" // Network access
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});
```

**Add this in the middleware section (AFTER `app.UseRouting()`, BEFORE `app.UseAuthorization()`):**
```csharp
app.UseRouting();
app.UseCors();  // ← Add this line
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

---

## Complete Example (Program.cs)

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();

// ✅ ADD CORS CONFIGURATION
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost",
                "https://localhost",
                "http://localhost:3000",
                "http://192.168.43.48:3000"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

// ✅ DISABLE HTTPS REDIRECT IN DEBUG
#if !DEBUG
app.UseHttpsRedirection();
#endif

app.UseRouting();

// ✅ USE CORS MIDDLEWARE
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

---

## Testing After Backend Update

### Step 1: Restart Backend
Stop and restart your ASP.NET Core backend completely.

### Step 2: Verify No Redirect
Run in PowerShell:
```powershell
Invoke-WebRequest -Uri "http://192.168.43.48:5137/api/health" -MaximumRedirection 0
```
- ✅ Should return **Status 200** (not 307)
- ❌ If returns 307, backend still has redirect enabled

### Step 3: Test APK
On your phone, open the APK and try to login.

Monitor logs:
```powershell
adb logcat | Select-String "Capacitor/Console"
```

Expected result:
- ✅ No CORS errors
- ✅ Login succeeds
- ✅ Dashboard loads

---

## Troubleshooting

### Still getting CORS error after update?
1. **Verify backend restart:** Completely stop and restart (not just save)
2. **Check middleware order:** `app.UseCors()` must be BEFORE `app.UseAuthorization()`
3. **Check for multiple CORS configs:** Remove any conflicting CORS setup
4. **Clear APK cache:** Uninstall and reinstall APK

### Still getting redirect error?
1. Check if `app.UseHttpsRedirection()` is called elsewhere
2. Check if controllers have `[RequireHttps]` attribute
3. Check IIS/Kestrel configuration for redirects

---

## For Production Deployment (Later)

When deploying to `aisakro.online`:

1. **Re-enable HTTPS redirect:**
```csharp
app.UseHttpsRedirection();  // Remove #if DEBUG
```

2. **Update CORS to production domain:**
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("Production", policy =>
    {
        policy.WithOrigins(
                "https://aisakro.online",
                "https://www.aisakro.online"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

app.UseCors("Production");
```

3. **Remove localhost origins** from CORS

---

## Summary

**Frontend:** ✅ Ready
**Backend:** ❌ Needs 2 changes in Program.cs
**Time Required:** 5-10 minutes
**Impact:** APK will work immediately after backend update

---

## Contact

If you need help with the backend changes, please provide:
1. Current `Program.cs` file (relevant sections)
2. Error messages from backend console
3. Any custom middleware or CORS configuration

The frontend team has done all required work. We're waiting for backend to:
1. Stop redirecting HTTP to HTTPS for API routes
2. Allow `http://localhost` in CORS policy
