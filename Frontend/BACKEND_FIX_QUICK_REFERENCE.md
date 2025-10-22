# URGENT: Backend Fix Required for APK to Work

## Problem
APK login fails with: **"Redirect is not allowed for a preflight request"**

**Root Cause:** Backend is redirecting HTTP → HTTPS (Status 307), which breaks CORS preflight.

---

## Fix (2 Required Changes)

### 1. Remove HTTPS Redirect for API Routes

**In `Program.cs`, find and REMOVE/COMMENT this line:**
```csharp
app.UseHttpsRedirection();  // ← REMOVE THIS
```

**Replace with:**
```csharp
// Don't redirect API routes in development
#if !DEBUG
app.UseHttpsRedirection();
#endif
```

---

### 2. Add CORS Policy for Capacitor

**In `Program.cs`, add BEFORE `var app = builder.Build();`:**
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost",
                "https://localhost",
                "http://localhost:3000"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});
```

**Add AFTER `app.UseRouting();` and BEFORE `app.UseAuthorization();`:**
```csharp
app.UseRouting();
app.UseCors();  // ← Add this line
app.UseAuthentication();
app.UseAuthorization();
```

---

## Complete Example

```csharp
// In Program.cs

// 1. Add CORS service
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost", "https://localhost", "http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// 2. Remove or conditionally apply HTTPS redirect
#if !DEBUG
app.UseHttpsRedirection();  // Only in production
#endif

// 3. Apply CORS middleware (BEFORE UseAuthorization)
app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

---

## Test After Fix

1. Restart the backend
2. Test from PowerShell:
```powershell
Invoke-WebRequest -Uri "http://192.168.43.48:5137/api/health" -MaximumRedirection 0
```
Should return **Status 200**, NOT 307 redirect

3. Test CORS:
```powershell
$headers = @{'Origin' = 'http://localhost'}
Invoke-WebRequest -Uri "http://192.168.43.48:5137/api/health" -Method OPTIONS -Headers $headers
```
Should return headers with `Access-Control-Allow-Origin: http://localhost`

4. APK should now work!

---

## Why This Matters

- **Browser works** because Vite proxy hides the CORS issue
- **APK fails** because it directly calls the backend from `http://localhost` origin
- **Redirect breaks CORS** because browsers don't allow redirects during preflight

---

## For Production (Later)

When deploying to `aisakro.online`:
1. Re-enable `app.UseHttpsRedirection()` for all routes
2. Update CORS to only allow production domain
3. Remove `http://localhost` from CORS origins
