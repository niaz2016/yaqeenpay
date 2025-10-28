# Android APK Production Build Guide

## Overview
This guide explains how to build the YaqeenPay Android APK configured to connect to the production backend at `https://techtorio.online/api`.

## Configuration Summary

### Backend Connection
- **API URL**: `https://techtorio.online/api`
- **Protocol**: HTTPS (SSL/TLS enabled)
- **Base Path**: `/` (root for mobile)
- **Database**: Production PostgreSQL
- **Mock Services**: Disabled

### Security
- **Network Security**: Configured to trust system certificates
- **Cleartext Traffic**: Allowed for development IPs only
- **HTTPS**: Required for techtorio.online
- **SSL Pinning**: Using system trust anchors

## Files Created/Modified

### 1. `.env.mobile`
Production environment configuration for mobile builds:
```bash
VITE_BASE_PATH=/
VITE_API_URL=https://techtorio.online/api
VITE_WALLET_USE_MOCK=false
VITE_USE_MOCK_SELLER_SERVICE=false
VITE_USE_MOCK_ADMIN=false
VITE_ENABLE_SMS_READING=true
VITE_ENABLE_LOCATION_TRACKING=true
VITE_ENABLE_CAMERA=true
```

### 2. `capacitor.config.ts`
Updated to support production backend:
```typescript
server: {
  androidScheme: 'https',
  hostname: 'techtorio.online',
  cleartext: true,
  allowNavigation: [
    'techtorio.online',
    'https://techtorio.online',
    'http://techtorio.online',
    'https://*.google.com',
    'https://*.googleapis.com'
  ]
}
```

### 3. `network_security_config.xml`
Android network security configuration:
```xml
<domain-config cleartextTrafficPermitted="false">
  <domain includeSubdomains="true">techtorio.online</domain>
  <trust-anchors>
    <certificates src="system" />
  </trust-anchors>
</domain-config>
```

### 4. `build-apk-production.ps1`
Automated build script for production APK.

## Build Instructions

### Prerequisites
1. **Node.js** installed (v18+)
2. **Android SDK** installed
3. **Gradle** installed
4. **Java JDK** 11 or 17 installed
5. All dependencies: `npm install`

### Build Steps

#### Option 1: Using Build Script (Recommended)
```powershell
cd Frontend
.\build-apk-production.ps1
```

This script will:
1. Clean previous builds
2. Copy mobile environment config
3. Install dependencies
4. Build frontend with production settings
5. Sync with Capacitor
6. Build Android APK
7. Copy APK to root as `YaqeenPay-production.apk`
8. Restore production .env

#### Option 2: Manual Build
```powershell
# 1. Navigate to Frontend directory
cd Frontend

# 2. Copy mobile environment
Copy-Item .env.mobile .env -Force

# 3. Install dependencies
npm install

# 4. Build frontend
npm run build

# 5. Sync with Capacitor
npx cap sync android

# 6. Copy assets
npx cap copy android

# 7. Update Android
npx cap update android

# 8. Build APK
cd android
./gradlew assembleDebug
cd ..

# 9. Locate APK
# APK Location: android/app/build/outputs/apk/debug/app-debug.apk

# 10. Restore production env
Copy-Item .env.production .env -Force
```

## APK Output

### Location
- Build output: `Frontend/android/app/build/outputs/apk/debug/app-debug.apk`
- Copied to: `Frontend/YaqeenPay-production.apk`

### Expected Size
- Approximately 40-60 MB (depends on dependencies)

## Installation

### Using ADB (Android Debug Bridge)
```bash
# Install on connected device
adb install -r YaqeenPay-production.apk

# Install on specific device (if multiple connected)
adb -s DEVICE_ID install -r YaqeenPay-production.apk

# Uninstall previous version first
adb uninstall com.yaqeenpay.app
adb install YaqeenPay-production.apk
```

### Manual Installation
1. Copy `YaqeenPay-production.apk` to device
2. Open file manager on device
3. Tap APK file
4. Allow installation from unknown sources
5. Install the app

## Testing the APK

### 1. Network Connectivity
After installation:
1. Open YaqeenPay app
2. Check if login screen loads
3. Try logging in with production credentials
4. Monitor network requests in backend logs

### 2. Backend Connection Test
```bash
# On server, monitor incoming requests
ssh -i "C:\Users\Precision\Downloads\firstKey.pem" ubuntu@16.170.233.86
sudo journalctl -u yaqeenpay -f
```

### 3. Features to Test
- ✅ Login/Registration
- ✅ SMS OTP verification
- ✅ Wallet balance display
- ✅ Top-up functionality
- ✅ Marketplace browsing
- ✅ Product search
- ✅ Order creation
- ✅ SMS reading (bank notifications)
- ✅ Location services
- ✅ Camera (for KYC)

## Troubleshooting

### APK Won't Install
**Error**: "App not installed"
**Solution**:
```bash
# Uninstall existing version
adb uninstall com.yaqeenpay.app

# Clear package installer cache
adb shell pm clear com.google.android.packageinstaller

# Reinstall
adb install YaqeenPay-production.apk
```

### Network Connection Failed
**Error**: "Network request failed" or "Cannot connect to server"

**Possible Causes**:
1. Backend server is down
2. SSL certificate issue
3. Firewall blocking requests
4. Incorrect API URL

**Solutions**:

1. **Check Backend Status**:
```bash
# Test if backend is accessible
curl https://techtorio.online/api/health

# Should return HTTP 200
```

2. **Check APK Network Config**:
   - Ensure `network_security_config.xml` includes techtorio.online
   - Verify HTTPS is enabled in Capacitor config

3. **Check Device Internet**:
   - Ensure device has active internet connection
   - Try accessing https://techtorio.online in device browser

4. **Check Backend Logs**:
```bash
ssh -i "C:\Users\Precision\Downloads\firstKey.pem" ubuntu@16.170.233.86
sudo journalctl -u yaqeenpay -n 50
```

### SSL/HTTPS Issues
**Error**: "SSL handshake failed" or "Certificate not trusted"

**Solution**:
1. Verify Let's Encrypt certificate is valid:
```bash
openssl s_client -connect techtorio.online:443 -servername techtorio.online
```

2. Check device date/time is correct (SSL requires accurate time)

3. If using self-signed cert, add to `network_security_config.xml`:
```xml
<certificates src="user" />
```

### APK Size Too Large
**Issue**: APK is larger than expected

**Solutions**:
1. Enable ProGuard/R8 (already configured)
2. Remove unused dependencies
3. Use APK splits for different architectures
4. Enable resource shrinking in `build.gradle`

### Permissions Not Working
**Error**: SMS reading, location, or camera not working

**Solution**:
1. Check `AndroidManifest.xml` has all required permissions
2. Manually grant permissions in device settings:
   - Settings → Apps → YaqeenPay → Permissions
   - Enable: SMS, Location, Camera, Storage

## Performance Optimization

### 1. Enable ProGuard
Edit `android/app/build.gradle`:
```gradle
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 2. Enable Resource Shrinking
```gradle
buildTypes {
    release {
        shrinkResources true
        minifyEnabled true
    }
}
```

### 3. Use APK Splits
```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
            universalApk false
        }
    }
}
```

## Release Build (Production APK)

For Play Store or production release:

```powershell
# Generate keystore (one-time setup)
keytool -genkey -v -keystore yaqeenpay-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias yaqeenpay

# Update android/app/build.gradle with signing config
# Then build release APK:
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

## Backend Requirements

### Ensure Backend is Running
```bash
# Check service status
systemctl status yaqeenpay

# Check if listening on port 5000
sudo ss -tlnp | grep :5000

# Check nginx proxy
sudo nginx -t
systemctl status nginx
```

### Nginx Configuration
Ensure nginx is proxying `/api` to backend:
```nginx
location /api/ {
    proxy_pass http://localhost:5000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### CORS Configuration
Ensure backend allows mobile requests:
```csharp
// In Startup.cs or Program.cs
app.UseCors(policy => policy
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());
```

## Monitoring & Logs

### Device Logs (via ADB)
```bash
# View app logs
adb logcat | grep YaqeenPay

# View network logs
adb logcat | grep -E "http|network|ssl"

# Clear logs and monitor
adb logcat -c && adb logcat
```

### Backend Logs
```bash
# Watch backend logs
sudo journalctl -u yaqeenpay -f

# Filter for errors
sudo journalctl -u yaqeenpay -n 100 | grep -i error

# Filter for specific user
sudo journalctl -u yaqeenpay -n 100 | grep "userId"
```

## Next Steps

1. **Build APK**: Run `.\build-apk-production.ps1`
2. **Install on Device**: Use ADB or manual installation
3. **Grant Permissions**: SMS, Location, Camera
4. **Test Login**: Use production credentials
5. **Test Features**: Wallet, marketplace, orders
6. **Monitor Logs**: Check backend for API requests

## Support

If issues persist:
1. Check `Frontend/build_log.txt` for build errors
2. Review `android/app/build/outputs/logs/` for Gradle logs
3. Check device logcat for runtime errors
4. Verify backend is accessible: `curl https://techtorio.online/api/health`
5. Test API directly with Postman or curl

## Summary

✅ **Configuration Complete**:
- Mobile environment configured (`.env.mobile`)
- Capacitor configured for production
- Network security configured
- Build script created

✅ **Ready to Build**:
```powershell
cd Frontend
.\build-apk-production.ps1
```

✅ **After Build**:
- Install: `adb install -r YaqeenPay-production.apk`
- Test all features
- Monitor backend logs
- Check network connectivity

**Production API**: `https://techtorio.online/api`
**APK Output**: `Frontend/YaqeenPay-production.apk`
