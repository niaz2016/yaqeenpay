# Backend CORS Configuration Fix for Capacitor APK

## Issue
APK fails with CORS error:
```
Access to fetch at 'http://192.168.43.48:5137/api/auth/login' from origin 'http://localhost' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
Redirect is not allowed for a preflight request.
```

## Root Cause
**CONFIRMED: Backend is redirecting HTTP (port 5137) to HTTPS (port 7137) with Status 307.**

This breaks CORS because:
1. Browser sends OPTIONS preflight request to `http://192.168.43.48:5137/api/auth/login`
2. Backend returns 307 redirect to `https://192.168.43.48:7137/api/auth/login`
3. Browser rejects this because **redirects are not allowed during CORS preflight**

## Solution: Two Required Changes

### Change 1: Remove HTTPS Redirection for API Routes ⚠️ CRITICAL

**The backend is currently redirecting all HTTP requests to HTTPS.**
This MUST be disabled for API routes during development.

Find your `Program.cs` file and locate this line:
```csharp
app.UseHttpsRedirection();  // ← THIS IS CAUSING THE PROBLEM
```

Replace it with conditional redirection that excludes API routes:

```csharp
// REMOVE THIS:
// app.UseHttpsRedirection();

// ADD THIS INSTEAD:
app.Use(async (context, next) =>
{
    // Only redirect non-API routes to HTTPS
    if (!context.Request.Path.StartsWithSegments("/api") && !context.Request.IsHttps)
    {
        var httpsUrl = $"https://{context.Request.Host}{context.Request.Path}{context.Request.QueryString}";
        context.Response.Redirect(httpsUrl, permanent: false);
        return;
    }
    await next();
});
```

OR for development, completely disable HTTPS redirection:

```csharp
#if !DEBUG
app.UseHttpsRedirection();  // Only redirect in production
#endif
```

### Change 2: Update CORS Configuration

Find your `Program.cs` or `Startup.cs` file in the backend project.

### Current Configuration (Likely)
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

### Updated Configuration (Required)
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowCapacitor", policy =>
    {
        policy.WithOrigins(
                // Capacitor WebView origins
                "http://localhost",
                "https://localhost",
                "capacitor://localhost",
                "ionic://localhost",
                
                // Development origins
                "http://localhost:3000",
                "http://192.168.43.48:3000",
                
                // Backend itself
                "http://192.168.43.48:5137",
                "https://192.168.43.48:7137",
                
                // Production domain (when deployed)
                "https://aisakro.online",
                "https://www.aisakro.online"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()  // Important for authentication
            .SetIsOriginAllowedToAllowWildcardSubdomains(); // For subdomains
    });
});

// Apply the CORS policy
app.UseCors("AllowCapacitor");
```

### Important Notes

1. **Place `app.UseCors()` BEFORE `app.UseAuthorization()`**:
```csharp
app.UseRouting();
app.UseCors("AllowCapacitor");  // ← BEFORE UseAuthorization
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

2. **Remove any HTTP → HTTPS redirect for API endpoints**:
```csharp
// DON'T USE THIS for API in development:
// app.UseHttpsRedirection();  // ← Comment this out or make it conditional

// Better approach - only redirect for non-API routes:
app.Use(async (context, next) =>
{
    if (!context.Request.Path.StartsWithSegments("/api"))
    {
        // Only redirect non-API routes to HTTPS
        if (!context.Request.IsHttps)
        {
            context.Response.Redirect($"https://{context.Request.Host}{context.Request.Path}");
            return;
        }
    }
    await next();
});
```

3. **Alternative: Allow all origins for development**:
```csharp
#if DEBUG
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
#else
// Production CORS policy with specific origins
builder.Services.AddCors(options =>
{
    options.AddPolicy("Production", policy =>
    {
        policy.WithOrigins("https://aisakro.online", "https://www.aisakro.online")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
#endif
```

## Verification Steps

### 1. Update Backend Code
Apply the CORS configuration above.

### 2. Restart Backend
```bash
# Stop the backend
# Rebuild
# Start again on port 5137 (HTTP)
```

### 3. Test from Frontend
The APK should now work without CORS errors.

### 4. Verify CORS Headers
You can test CORS from PowerShell:
```powershell
$headers = @{
    'Origin' = 'http://localhost'
}
Invoke-WebRequest -Uri "http://192.168.43.48:5137/api/health" -Method OPTIONS -Headers $headers
```

Should return headers like:
```
Access-Control-Allow-Origin: http://localhost
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: *
```

## Common Issues

### Issue 1: Still getting CORS error
- Make sure `app.UseCors()` is placed BEFORE `app.UseAuthorization()`
- Restart the backend completely
- Clear browser/APK cache

### Issue 2: Redirect error
- Remove or conditionally apply `app.UseHttpsRedirection()` for API routes
- Make sure API endpoints don't have `[RequireHttps]` attribute in development

### Issue 3: Credentials not working
- Add `.AllowCredentials()` to CORS policy
- Make sure frontend is sending credentials: `credentials: 'include'` in fetch

## Testing After Fix

From frontend PowerShell:
```powershell
# Clear logs
adb logcat -c

# Monitor
adb logcat | Select-String "192.168|CORS|Capacitor/Console"
```

Try login on APK - should see successful API calls without CORS errors.

## For Production

When deploying to `aisakro.online`:
1. Update CORS to only allow your production domain
2. Use HTTPS with proper SSL certificate
3. Remove `http://localhost` from allowed origins
4. Enable `app.UseHttpsRedirection()` for all routes
