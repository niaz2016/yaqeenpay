# Test Google OAuth in APK

## Step 1: Install Latest APK

```powershell
adb install -r "D:\Work Repos\AI\techtorio\Frontend\TechTorio-production.apk"
```

## Step 2: Connect Chrome DevTools

1. Open **Chrome** on your PC
2. Navigate to `chrome://inspect`
3. Enable **"Discover USB devices"**
4. Your phone should appear - click **"inspect"**
5. This opens Chrome DevTools for your app

## Step 3: Check Console Logs

In the Console tab, you should see:

```
[LoginForm] Environment Check:
  API URL: http://techtorio.online/api
  Google Client ID: Present    <-- This should say "Present", not "Missing"
  Is Capacitor: true
```

**If it says "Present"**: The Google OAuth button should be visible!

**If it says "Missing"**: We need to rebuild with a different approach.

## Step 4: Visual Check

Look at the login screen:
- ✅ Email field
- ✅ Password field
- ✅ Login button
- ✅ **"Or continue with"** text
- ✅ **Google Sign-In button** (blue/white button)

## Step 5: Try Password Login

Before Google OAuth, test if password login works (after backend CORS fix):

1. Enter email and password
2. Click "Login"
3. Watch the console for errors

**Expected (after backend fix)**:
- No CORS errors
- Login succeeds or shows proper error message

**Current (before backend fix)**:
- CORS errors blocking requests
- Login fails

## Quick Fix if Google OAuth Still Missing

If console shows "Google Client ID: Missing", run this:

```powershell
cd "D:\Work Repos\AI\techtorio\Frontend"

# Create a test build info file
@"
VITE_GOOGLE_CLIENT_ID=600351246339-3bb6irmsm0c55agiqgunq8p05nscm2jt.apps.googleusercontent.com
"@ | Out-File -FilePath ".env.local" -Encoding utf8

# Rebuild
.\build-mobile-apk.ps1

# Remove .env.local after build
Remove-Item .env.local
```

The `.env.local` file has the highest priority and will ensure the Google Client ID is included.

## What To Report Back

Please share:
1. Screenshot of Console showing the "[LoginForm] Environment Check" output
2. Screenshot of login screen (to see if Google button is visible)
3. Any error messages in Console when trying to login

This will tell us exactly what's wrong!
