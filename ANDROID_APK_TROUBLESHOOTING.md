# Android APK Connection Troubleshooting Guide

## Current Configuration

### Android App (APK)
- **API URL**: `http://192.168.43.48:5137/api`
- **Protocol**: HTTP (not HTTPS to avoid certificate issues)
- **Network Security**: Configured to allow cleartext traffic

### Backend Server
- **HTTP Port**: `http://0.0.0.0:5137` (accessible from network)
- **HTTPS Port**: `https://0.0.0.0:7137` (for browser access)
- **Listening on**: All network interfaces (0.0.0.0)

### Your Network
- **Computer IP**: 192.168.43.48
- **Backend Accessible At**: 
  - HTTP: `http://192.168.43.48:5137/api`
  - HTTPS: `https://192.168.43.48:7137/api`

## Changes Made to Fix Connection Issues

### 1. Network Security Configuration
**File**: `Frontend/android/app/src/main/res/xml/network_security_config.xml`
- Allows cleartext (HTTP) traffic
- Trusts user-added certificates for HTTPS
- Specifically configured for your development IP: 192.168.43.48

### 2. Android Manifest
**File**: `Frontend/android/app/src/main/AndroidManifest.xml`
- Added `android:networkSecurityConfig="@xml/network_security_config"`
- Added `android:usesCleartextTraffic="true"`

### 3. Backend Configuration
**File**: `Backend/YaqeenPay.API/appsettings.Development.json`
- Changed from: `"Urls": "https://0.0.0.0:7137"`
- Changed to: `"Urls": "https://0.0.0.0:7137;http://0.0.0.0:5137"`
- Now listens on both HTTP (5137) and HTTPS (7137) ports

### 4. Frontend Production Config
**File**: `Frontend/.env.production`
- Changed from: `VITE_API_URL=https://192.168.43.48:7137/api`
- Changed to: `VITE_API_URL=http://192.168.43.48:5137/api`
- Using HTTP to avoid certificate validation issues

### 5. CORS Configuration
**File**: `Backend/YaqeenPay.API/Program.cs`
- Added origins for port 5137 (HTTP)
- Added origins for 192.168.43.48
- Added Capacitor-specific origins (capacitor://localhost, ionic://localhost)

## Troubleshooting Steps

### Step 1: Verify Backend is Running
Check terminal output - you should see:
```
Now listening on: https://0.0.0.0:7137
Now listening on: http://0.0.0.0:5137
```

### Step 2: Test Backend from Your Computer
Run these commands in PowerShell:

```powershell
# Test localhost HTTP
curl http://localhost:5137/api/auth/login

# Test network IP HTTP
curl http://192.168.43.48:5137/api/auth/login
```

Both should respond (even if it's an error response, that's OK - it means the port is accessible).

### Step 3: Check Windows Firewall
If Step 2 fails for the network IP, allow port 5137:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "YaqeenPay HTTP" -Direction Inbound -LocalPort 5137 -Protocol TCP -Action Allow
```

### Step 4: Verify Android and Computer are on Same Network
- Android device must be on the **same WiFi** as your computer
- Check Android WiFi settings - IP should be 192.168.43.x
- If on different network, APK won't connect

### Step 5: Install Fresh APK
1. Uninstall old APK from Android device
2. Install new APK: `Frontend/android/app/build/outputs/apk/debug/app-debug.apk`
3. Try logging in

### Step 6: Check Android Logcat (Advanced)
Connect Android device via USB and run:
```powershell
adb logcat | Select-String -Pattern "YaqeenPay|Capacitor|HTTP"
```

Look for connection errors or API call logs.

## Common Issues and Solutions

### Issue: "Failed to fetch" or "Network request failed"

**Possible Causes:**
1. ❌ Backend not running → Check terminal, restart if needed
2. ❌ Wrong IP address → Your IP might have changed after reconnecting WiFi
3. ❌ Firewall blocking → Allow port 5137 (see Step 3 above)
4. ❌ Different networks → Ensure Android and PC on same WiFi
5. ❌ Old APK cached → Uninstall and reinstall

**Solution:**
```powershell
# 1. Verify your current IP
ipconfig | Select-String -Pattern "192.168"

# 2. If IP changed, update .env.production
# Edit: Frontend/.env.production
# Change: VITE_API_URL=http://[NEW_IP]:5137/api

# 3. Rebuild
cd "d:\Work Repos\AI\yaqeenpay\Frontend"
npm run build
npx cap sync android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd android
.\gradlew.bat assembleDebug
```

### Issue: "Certificate validation failed" (if using HTTPS)

**Solution:** We're now using HTTP (port 5137) to avoid this. If you still see this:
1. Ensure `.env.production` uses `http://` not `https://`
2. Rebuild the APK

### Issue: CORS Error

**Symptoms:** Login request reaches backend but returns CORS error

**Solution:** Already configured in `Program.cs`. If still occurs:
1. Check backend terminal logs for CORS errors
2. Verify `capacitor://localhost` is in CORS origins
3. Restart backend

## Verification Checklist

Before testing APK, verify:

- [ ] Backend terminal shows both ports listening (5137 and 7137)
- [ ] `.env.production` has `http://192.168.43.48:5137/api`
- [ ] `network_security_config.xml` exists in Android project
- [ ] Frontend built successfully (`npm run build`)
- [ ] Capacitor synced (`npx cap sync android`)
- [ ] APK built successfully (gradlew.bat assembleDebug)
- [ ] Old APK uninstalled from Android device
- [ ] New APK installed
- [ ] Android device on same WiFi (192.168.43.x)
- [ ] Port 5137 allowed in Windows Firewall

## Testing the APK

### On Android Device:
1. Open the YaqeenPay app
2. Try to login with valid credentials
3. Should successfully connect to backend

### Expected Behavior:
- App sends request to: `http://192.168.43.48:5137/api/auth/login`
- Backend receives request on port 5137
- Backend returns response (success or error)
- App displays result

### If Still Failing:

1. **Test backend accessibility from Android browser:**
   - Open Chrome on Android device
   - Navigate to: `http://192.168.43.48:5137/api/auth/login`
   - Should see JSON response (even if error)
   - If this fails, it's a network/firewall issue, not an app issue

2. **Check for IP change:**
   ```powershell
   # On your computer
   ipconfig /all
   ```
   Look for your WiFi adapter's IPv4 address. If it's different from 192.168.43.48, update configs and rebuild.

3. **Try HTTPS instead (requires accepting certificate):**
   Update `.env.production`:
   ```bash
   VITE_API_URL=https://192.168.43.48:7137/api
   ```
   Then rebuild everything.

## Production Notes

For production deployment:
1. Use a real domain name (not IP)
2. Use HTTPS with valid SSL certificate
3. Remove cleartext traffic permission
4. Update `.env.production` with production domain
5. Build release APK: `.\gradlew.bat assembleRelease`

## Quick Rebuild Command

If you need to rebuild everything quickly:

```powershell
# One command to rule them all
cd "d:\Work Repos\AI\yaqeenpay\Frontend"; npm run build; npx cap sync android; $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; cd android; .\gradlew.bat assembleDebug
```

APK will be at: `Frontend/android/app/build/outputs/apk/debug/app-debug.apk`
