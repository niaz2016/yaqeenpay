# Ngrok Setup for YaqeenPay Development

## Installation

### Option 1: Download from Official Website
1. Go to https://ngrok.com/download
2. Download the Windows version
3. Extract ngrok.exe to a folder (e.g., `C:\ngrok\`)
4. Add the folder to your Windows PATH environment variable

### Option 2: Install via Chocolatey (if you have it)
```powershell
choco install ngrok
```

### Option 3: Install via Scoop (if you have it)
```powershell
scoop install ngrok
```

## Authentication Setup
1. Sign up for a free ngrok account at https://ngrok.com/
2. Get your authtoken from the dashboard
3. Run: `ngrok config add-authtoken YOUR_AUTH_TOKEN`

## Exposing Both Ports

### Method 1: Two Separate Terminal Windows

**Terminal 1 - Frontend (HTTP port 3000):**
```bash
ngrok http 3000
```

**Terminal 2 - Backend (HTTPS port 7137):**
```bash
ngrok http https://localhost:7137
```

### Method 2: Using ngrok Configuration File (Recommended)

Create `ngrok.yml` in your user directory (`C:\Users\YourUsername\.ngrok2\ngrok.yml`):

```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN_HERE
tunnels:
  frontend:
    proto: http
    addr: 3000
    hostname: your-custom-subdomain-frontend.ngrok.io  # Optional: requires paid plan
  backend:
    proto: http
    addr: https://localhost:7137
    hostname: your-custom-subdomain-backend.ngrok.io   # Optional: requires paid plan
```

Then run both tunnels:
```bash
ngrok start frontend backend
```

### Method 3: Free Version - Sequential Commands

If using free version (one tunnel at a time):

**For Frontend:**
```bash
ngrok http 3000
```

**For Backend:**
```bash
ngrok http https://localhost:7137
```

## Quick Start Commands

### Start Frontend Development Server
```bash
cd d:\Work\ Repos\AI\yaqeenpay\Frontend
npm run dev
# This should start on http://localhost:3000
```

### Start Backend Server
Make sure your .NET backend is running on https://localhost:7137

### Expose Frontend via Ngrok
```bash
ngrok http 3000
```
You'll get output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

### Expose Backend via Ngrok
```bash
ngrok http https://localhost:7137
```
You'll get output like:
```
Forwarding    https://def456.ngrok.io -> https://localhost:7137
```

## Environment Configuration

Update your frontend `.env.development` to use ngrok URLs when needed:

```env
# For local development
VITE_API_URL=https://localhost:7137/api

# For ngrok testing (update with your actual ngrok URL)
# VITE_API_URL=https://def456.ngrok.io/api
```

## CORS Configuration

Make sure your backend allows ngrok domains. In your backend startup/configuration:

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});
```

Or specifically allow ngrok domains:

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder
            .WithOrigins(
                "http://localhost:3000",
                "https://abc123.ngrok.io",  // Your frontend ngrok URL
                "https://def456.ngrok.io"   // Your backend ngrok URL
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});
```

## Testing

1. Start your backend server (https://localhost:7137)
2. Start your frontend server (http://localhost:3000)
3. Run ngrok for both ports using the methods above
4. Access your application via the ngrok URLs
5. Test mobile-based order creation functionality

## Notes

- **Free ngrok accounts** can only run one tunnel at a time
- **Paid ngrok accounts** can run multiple tunnels simultaneously
- URLs change every time you restart ngrok (unless you have a paid plan with reserved domains)
- Make sure to update CORS settings in your backend to allow ngrok domains
- For production use, consider other solutions like reverse proxies or cloud deployment

## Troubleshooting

### If ngrok command not found:
1. Verify installation and PATH configuration
2. Restart your terminal/PowerShell
3. Try running with full path: `C:\path\to\ngrok.exe http 3000`

### If CORS errors:
1. Update backend CORS configuration to allow ngrok domains
2. Make sure both HTTP and HTTPS are handled properly

### If backend HTTPS issues:
1. Make sure your backend is actually running on https://localhost:7137
2. Check SSL certificate configuration
3. Try using `ngrok http 7137` instead of `ngrok http https://localhost:7137` if issues persist