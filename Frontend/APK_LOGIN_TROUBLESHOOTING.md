# APK Login Issues - Troubleshooting Guide

## Current Issues
1. Password login not working
2. Google OAuth button not visible

## Changes Made in Latest Build

### 1. Network Configuration
- **API URL**: Changed to `http://techtorio.online/api` (HTTP instead of HTTPS)
- **Network Security**: Allowed cleartext traffic for techtorio.online
- **Reason**: SSL certificate validation can fail in mobile apps

### 2. Debug Logging Added
The new APK includes console logging. To view logs:

```powershell
# Connect phone via USB with debugging enabled
adb logcat | Select-String "LoginForm"
```

Or use Chrome DevTools:
1. Open Chrome on PC
2. Go to `chrome://inspect`
3. Click "inspect" under your device
4. Check Console tab

**Look for these logs:**
```
[LoginForm] Environment Check:
  API URL: http://techtorio.online/api
  Google Client ID: Present/Missing
  Is Capacitor: true

[LoginForm] Attempting login...
  API URL: http://techtorio.online/api
  Email: user@example.com

[LoginForm] Login error: {...}
```

## Debugging Steps

### Step 1: Check if Google Client ID is loaded
1. Install APK: `adb install -r "D:\Work Repos\AI\yaqeenpay\Frontend\YaqeenPay-production.apk"`
2. Open app
3. Connect Chrome DevTools (chrome://inspect)
4. Look for: `[LoginForm] Google Client ID: Present` or `Missing`

**If Missing**: Environment variable not included in build
**If Present**: OAuth button should be visible

### Step 2: Test Password Login
1. Try logging in with password
2. Watch console for errors
3. Look for `[LoginForm] Login error:` with details

**Common errors:**
- Network error → API not reachable
- CORS error → Backend CORS not configured for mobile
- 401/403 → Wrong credentials or backend issue

### Step 3: Check Network Connectivity
```javascript
// In Chrome DevTools console
fetch('http://techtorio.online/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## Google OAuth for Android - Requirements

### Current Setup
- **Web Client ID**: `968347595085-lguh8fnb8vuvtj6j1tdh65h5sv5ph77n.apps.googleusercontent.com`
- **Package Name**: `com.yaqeenpay.app`

### What's Needed
1. **Get SHA-1 Fingerprint**:
   ```powershell
   cd "D:\Work Repos\AI\yaqeenpay\Frontend\android"
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot"
   $env:Path = "$env:JAVA_HOME\bin;$env:Path"
   .\gradlew signingReport
   ```
   Look for SHA1 under "Variant: debug"

2. **Create Android OAuth Client**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create Credentials → OAuth client ID → Android
   - Package name: `com.yaqeenpay.app`
   - SHA-1: [from step 1]

3. **Two Options**:
   - **Option A**: Keep using Web client ID (simpler, works in many cases)
   - **Option B**: Use new Android client ID (more secure)

### Test Both Approaches

**Try Web Client ID first** (already configured):
- Current build uses Web client ID
- Should work if Google Sign-In library supports it

**If that doesn't work**, update `.env.mobile`:
```bash
VITE_GOOGLE_CLIENT_ID=[New Android Client ID]
```
Then rebuild.

## Backend CORS Configuration

The backend might need to allow requests from `file://` origin for mobile apps.

Check backend CORS settings allow:
- `http://localhost` 
- `file://`
- `capacitor://localhost`

## Alternative Solution: Native Google Sign-In

If web-based Google Sign-In doesn't work, install native plugin:

```powershell
cd "D:\Work Repos\AI\yaqeenpay\Frontend"
npm install @codetrix-studio/capacitor-google-auth
npx cap sync
```

Then update OAuth implementation to use native plugin.

## Current APK Details

- **File**: `YaqeenPay-production.apk`
- **Built**: October 26, 2025 8:17 PM
- **API**: `http://techtorio.online/api`
- **Google Client ID**: Included (Web client)
- **Debug Logging**: Enabled

## Next Steps

1. **Install and test**:
   ```powershell
   adb install -r "D:\Work Repos\AI\yaqeenpay\Frontend\YaqeenPay-production.apk"
   ```

2. **Connect Chrome DevTools**:
   - chrome://inspect
   - Check console logs

3. **Report findings**:
   - Is Google Client ID "Present" or "Missing"?
   - What error appears for password login?
   - What's the full error message in console?

4. **Get SHA-1** (for Android OAuth):
   ```powershell
   cd android
   .\gradlew signingReport
   ```
   Share the SHA1 value

With this information, we can determine if you need a separate Android OAuth client or if there's a different issue.
