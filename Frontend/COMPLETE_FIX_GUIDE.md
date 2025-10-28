# APK Login Issues - Complete Fix Guide

## 🔍 Issues Identified

1. **CORS Errors** - Backend blocking mobile app requests (shown in your screenshot)
2. **Google OAuth Not Visible** - OAuth button missing in APK but works on web
3. **Password Login Failing** - Due to CORS blocking API requests

## 📋 Summary of What We've Done

### ✅ Backend CORS Fix
- **Updated**: `Backend/YaqeenPay.API/Program.cs`
- **Changes**: Added support for Capacitor origins (`capacitor://localhost`, `file://`, etc.)
- **Status**: Built successfully, needs deployment

### ✅ Debug Logging Added to Frontend
- **Updated**: `Frontend/src/components/auth/LoginForm.tsx`
- **Added**: Console logs to check if Google Client ID is loaded
- **Purpose**: Help diagnose why OAuth button isn't showing

### ✅ APK Built with Debugging
- **File**: `YaqeenPay-production.apk` (8.49 MB, 8:17 PM)
- **Changes**: Debug logging, HTTP API, permission fixes
- **Ready**: Yes, ready to install

### ✅ Android OAuth Setup Info
- **SHA-1**: `76:BB:54:34:92:52:64:27:1F:D8:D6:2D:C9:19:DA:19:9E:1E:72:11`
- **Package**: `com.yaqeenpay.app`
- **Web Client ID**: `968347595085-lguh8fnb8vuvtj6j1tdh65h5sv5ph77n.apps.googleusercontent.com`

## 🚨 Critical Steps You Need to Take

### Step 1: Deploy Backend CORS Fix ⚠️ REQUIRED

The backend MUST be updated to allow mobile app requests. Currently it's blocking them (CORS errors).

**SSH into your server and run:**

```bash
# SSH into server
ssh -i "C:\Users\Precision\Downloads\firstKey.pem" ubuntu@16.170.233.86

# Stop the backend service
sudo systemctl stop yaqeenpay-backend

# Exit SSH
exit
```

**Then from your PC:**

```powershell
# Deploy the updated backend files
cd "D:\Work Repos\AI\yaqeenpay\Backend"
scp -i "C:\Users\Precision\Downloads\firstKey.pem" YaqeenPay.API/bin/Release/net8.0/YaqeenPay.API.dll ubuntu@16.170.233.86:/opt/techtorio/backend/
scp -i "C:\Users\Precision\Downloads\firstKey.pem" YaqeenPay.API/bin/Release/net8.0/YaqeenPay.Application.dll ubuntu@16.170.233.86:/opt/techtorio/backend/
scp -i "C:\Users\Precision\Downloads\firstKey.pem" YaqeenPay.API/bin/Release/net8.0/YaqeenPay.Infrastructure.dll ubuntu@16.170.233.86:/opt/techtorio/backend/
scp -i "C:\Users\Precision\Downloads\firstKey.pem" YaqeenPay.API/bin/Release/net8.0/YaqeenPay.Domain.dll ubuntu@16.170.233.86:/opt/techtorio/backend/
```

**Start the service:**

```bash
# SSH back in
ssh -i "C:\Users\Precision\Downloads\firstKey.pem" ubuntu@16.170.233.86

# Start the service
sudo systemctl start yaqeenpay-backend

# Check status
sudo systemctl status yaqeenpay-backend

# Exit
exit
```

### Step 2: Test Current APK with Chrome DevTools

**Install APK:**
```powershell
adb install -r "D:\Work Repos\AI\yaqeenpay\Frontend\YaqeenPay-production.apk"
```

**Check Console Logs:**
1. Open Chrome on PC
2. Go to `chrome://inspect`
3. Find your device, click "inspect"
4. Open Console tab
5. Look for:
   ```
   [LoginForm] Environment Check:
     API URL: http://techtorio.online/api
     Google Client ID: Present  <-- Should say "Present"
     Is Capacitor: true
   ```

### Step 3: Fix Google OAuth if Still Missing

**If console shows "Google Client ID: Missing"**, the environment variable wasn't included in the build.

**Solution:** Rebuild APK ensuring .env.mobile is properly loaded:

```powershell
cd "D:\Work Repos\AI\yaqeenpay\Frontend"

# Verify .env.mobile has Google Client ID
Get-Content .env.mobile | Select-String "GOOGLE"

# Should show:
# VITE_GOOGLE_CLIENT_ID=968347595085-lguh8fnb8vuvtj6j1tdh65h5sv5ph77n.apps.googleusercontent.com

# If missing, add it:
Add-Content .env.mobile "`nVITE_GOOGLE_CLIENT_ID=968347595085-lguh8fnb8vuvtj6j1tdh65h5sv5ph77n.apps.googleusercontent.com"

# Rebuild APK
.\build-mobile-apk.ps1
```

### Step 4: Create Android OAuth Client (Optional)

For better security and to ensure OAuth works reliably, create an Android-specific OAuth client:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Choose **"Android"**
4. Fill in:
   - **Name**: YaqeenPay Android
   - **Package name**: `com.yaqeenpay.app`
   - **SHA-1**: `76:BB:54:34:92:52:64:27:1F:D8:D6:2D:C9:19:DA:19:9E:1E:72:11`
5. Click "Create"
6. Copy the new Client ID
7. Update `.env.mobile` with the new Android Client ID
8. Rebuild APK

## 🎯 Priority Order

1. **FIRST**: Deploy backend CORS fix (without this, nothing works)
2. **SECOND**: Test current APK and check console logs
3. **THIRD**: Fix Google OAuth if needed (rebuild or create Android client)

## 📝 Expected Behavior After Fixes

### After Backend Deployment:
- ✅ Password login should work
- ✅ No more CORS errors in console
- ✅ API requests succeed

### After OAuth Fix:
- ✅ Google Sign-In button visible
- ✅ Can click and see Google account picker
- ✅ Can login with Google account

## 🔍 Troubleshooting

### If password login still fails after backend deployment:
- Check backend logs: `ssh ubuntu@16.170.233.86 "sudo journalctl -u yaqeenpay-backend -n 50"`
- Check API health: Open Chrome DevTools console and run:
  ```javascript
  fetch('http://techtorio.online/api/health').then(r => r.json()).then(console.log)
  ```

### If Google OAuth button still doesn't show:
1. Check console for "[LoginForm] Google Client ID: Missing"
2. Verify .env.mobile has VITE_GOOGLE_CLIENT_ID
3. Rebuild APK with: `.\build-mobile-apk.ps1`

### If Google OAuth button shows but doesn't work:
1. Create Android OAuth client (see Step 4)
2. Update .env.mobile with Android Client ID
3. Rebuild APK

## 📞 Next Steps

**What you should do NOW:**

1. Deploy the backend CORS fix (Step 1 above) - **CRITICAL**
2. Test the current APK and share console logs
3. Tell me what the console shows for Google Client ID

Once we see the console logs, we'll know exactly what needs to be fixed!
