# Google OAuth Setup for Android App

## Problem
Google OAuth configured for web (techtorio.online) doesn't work in Android apps because:
1. Different client types (Web vs Android)
2. Android requires package name and SHA-1 fingerprint
3. Web OAuth redirect URIs don't work in mobile apps

## Solution: Create Android OAuth Client

### Step 1: Get Your App's SHA-1 Fingerprint

For **debug builds** (development):
```powershell
cd "D:\Work Repos\AI\techtorio\Frontend\android"
.\gradlew signingReport
```

Look for the **debug** keystore SHA-1. Example output:
```
Variant: debug
Config: debug
Store: C:\Users\YourName\.android\debug.keystore
Alias: AndroidDebugKey
MD5: XX:XX:XX...
SHA1: AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD
SHA-256: ...
```

Copy the **SHA1** value.

### Step 2: Create Android OAuth Client in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project
3. Click **"Create Credentials"** → **"OAuth client ID"**
4. Select **"Android"** as application type
5. Fill in:
   - **Name**: TechTorio Android App
   - **Package name**: `com.techtorio.app`
   - **SHA-1 certificate fingerprint**: [Paste the SHA-1 from Step 1]
6. Click **"Create"**

### Step 3: Copy the Client ID

After creation, you'll see a Client ID like:
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

**IMPORTANT**: For Android apps, you might also need to keep the Web client ID. Some implementations use the Web client ID even in mobile apps.

### Step 4: Update .env.mobile

Open `Frontend/.env.mobile` and update:

```bash
# Google OAuth - Use WEB client ID for mobile Google Sign-In
# The Android client ID is used for backend verification
VITE_GOOGLE_CLIENT_ID=600351246339-3bb6irmsm0c55agiqgunq8p05nscm2jt.apps.googleusercontent.com

# Or try the new Android client ID if web doesn't work:
# VITE_GOOGLE_CLIENT_ID=[Your new Android Client ID]
```

### Step 5: Rebuild APK

```powershell
cd "D:\Work Repos\AI\techtorio\Frontend"
.\build-mobile-apk.ps1
```

## Alternative: Capacitor Google Auth Plugin

If the web-based Google Sign-In doesn't work in mobile, consider using:
- `@codetrix-studio/capacitor-google-auth` plugin

This provides native Google Sign-In for Android/iOS.

## Testing

1. Install the APK
2. Open Chrome DevTools (chrome://inspect)
3. Select your device
4. Look at console logs for:
   - `[LoginForm] Environment Check`
   - `[LoginForm] Google Client ID: Present/Missing`

## Current Status

- **Web Client ID**: `600351246339-3bb6irmsm0c55agiqgunq8p05nscm2jt.apps.googleusercontent.com`
- **Package Name**: `com.techtorio.app`
- **SHA-1**: Not yet obtained (run `gradlew signingReport`)

## Next Steps

1. Run `gradlew signingReport` to get SHA-1
2. Create Android OAuth client with SHA-1
3. Try keeping the Web client ID first (it often works)
4. If not, use the new Android client ID
5. Rebuild and test
