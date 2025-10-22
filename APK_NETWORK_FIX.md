# APK Network Configuration Fix

## Problem
The APK was unable to log in when installed on Android devices because it was configured to connect to `localhost`, which refers to the device itself, not your development computer.

## Solution Applied

### 1. Frontend Configuration (`.env.production`)
**Changed:** API URL from localhost to network IP
```bash
# Before
VITE_API_URL=http://localhost:3000/api

# After
VITE_API_URL=https://192.168.43.48:7137/api
```

### 2. Backend Configuration

#### Updated `appsettings.json` and `appsettings.Development.json`
**Changed:** Server listening address to accept connections from all network interfaces
```json
// Before
"Urls": "https://localhost:7137"

// After
"Urls": "https://0.0.0.0:7137"
```

This allows the backend to accept connections from:
- localhost (127.0.0.1)
- Your computer's network IP (192.168.43.48)
- Any other network interface

#### Updated `Program.cs` - CORS Settings
**Added:** Network IP and Capacitor origins to CORS policy
```csharp
policy.WithOrigins(
    // ... existing localhost origins ...
    "http://192.168.43.48:3000",
    "https://192.168.43.48:3000",
    "http://192.168.43.48:7137",
    "https://192.168.43.48:7137",
    "capacitor://localhost",
    "ionic://localhost",
    "http://localhost",
    "https://localhost")
```

## Build Process
After making these changes, the following steps were executed:

1. **Restart Backend**: Backend now listens on `https://0.0.0.0:7137`
2. **Rebuild Frontend**: `npm run build` (compiles with production settings)
3. **Sync Capacitor**: `npx cap sync android` (copies web assets to Android project)
4. **Build APK**: `.\gradlew.bat assembleDebug` (creates APK)

## APK Location
```
Frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

## Testing

### Prerequisites
- Your Android device must be on the same network as your development computer
- Your network IP is **192.168.43.48** (as shown in Vite dev server output)
- Backend is running and accessible at `https://192.168.43.48:7137`

### Verification Steps
1. Install the APK on your Android device
2. Connect to the same WiFi network as your development computer
3. Launch the app
4. Try to log in - it should now connect successfully

## Important Notes

### IP Address Changes
If your computer's IP address changes (e.g., after reconnecting to WiFi), you'll need to:
1. Update `.env.production` with the new IP
2. Update CORS settings in `Program.cs` with the new IP
3. Rebuild: `npm run build` → `npx cap sync android` → `.\gradlew.bat assembleDebug`

### HTTPS Certificate Warning
Since the backend uses a self-signed HTTPS certificate, you may encounter certificate warnings. For development:
- Android may show "Network Security Configuration" warnings
- You might need to add network security exceptions in Android configuration if needed

### For Production Deployment
When deploying to production:
1. Use a proper domain name instead of IP address
2. Use a valid SSL certificate (e.g., Let's Encrypt)
3. Update `.env.production` with production domain
4. Remove development-specific CORS origins
5. Build release APK: `.\gradlew.bat assembleRelease`

## Troubleshooting

### APK Still Can't Connect
1. Check that both devices are on the same network
2. Verify backend is running: `curl https://192.168.43.48:7137/api/health` (if health endpoint exists)
3. Check Windows Firewall isn't blocking port 7137
4. Verify the IP address hasn't changed (check Vite dev server output)

### Firewall Issues
If connection fails, allow port 7137 through Windows Firewall:
```powershell
New-NetFirewallRule -DisplayName "YaqeenPay Backend" -Direction Inbound -LocalPort 7137 -Protocol TCP -Action Allow
```

## Current Configuration Summary
- **Frontend Dev Server**: http://192.168.43.48:3000
- **Backend API**: https://192.168.43.48:7137 (accessible on all interfaces)
- **APK connects to**: https://192.168.43.48:7137/api
- **Database**: PostgreSQL on 127.0.0.1:5432 (localhost only)
