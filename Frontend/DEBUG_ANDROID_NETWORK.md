# Debug Android Network Requests

## Method 1: Chrome DevTools (Remote Debugging) ⭐ RECOMMENDED

This is the easiest way to see exactly where requests are going and what's failing.

### Steps:

1. **Enable USB Debugging on your Android device:**
   - Settings → About Phone → Tap "Build Number" 7 times (enables Developer Options)
   - Settings → Developer Options → Enable "USB Debugging"

2. **Connect device to PC via USB**
   - Accept the "Allow USB Debugging" prompt on your phone

3. **Open Chrome on your PC:**
   - Navigate to: `chrome://inspect/#devices`
   - You should see your device listed

4. **Find your app and click "inspect":**
   - Under your device, you'll see "WebView in com.yaqeenpay.app"
   - Click the **"inspect"** link next to it

5. **Open the app on your device**

6. **Check the Network tab in DevTools:**
   - Click the "Network" tab in Chrome DevTools
   - You'll see ALL network requests in real-time
   - Look for the API URLs - you'll see EXACTLY where they're going
   - If they fail, you'll see the error (e.g., "net::ERR_CONNECTION_REFUSED")

### What to look for:
```
Request URL: http://192.168.137.148:7137/api/...
Status: (failed) net::ERR_CONNECTION_REFUSED
```

This will immediately show you if:
- ✅ The URL is correct
- ✅ The IP and port are what you expect
- ❌ Connection is being refused
- ❌ DNS can't resolve
- ❌ Timeout issues

---

## Method 2: Android Logcat

See console logs and network errors from your app.

### Using Android Studio:

1. **Open Android Studio**
2. **Click "Logcat" tab at the bottom**
3. **Filter by your package:**
   - In the search box, type: `package:com.yaqeenpay.app`
4. **Run your app**
5. **Look for network errors:**
   ```
   E/Capacitor: Failed to fetch
   E/Capacitor: java.net.ConnectException: Failed to connect to /192.168.137.148:7137
   ```

### Using ADB command line:

```bash
# Connect device
adb devices

# View all logs
adb logcat

# Filter for your app only
adb logcat | findstr "yaqeenpay"

# Filter for network errors
adb logcat | findstr "fetch"
adb logcat | findstr "http"
adb logcat | findstr "connection"

# Clear logs first, then run app
adb logcat -c
adb logcat | findstr "yaqeenpay"
```

---

## Method 3: Check Built APK Files

Verify what API URL was baked into your build.

```bash
# Extract APK (it's just a ZIP file)
cd android\app\build\outputs\apk\debug
mkdir extracted
cd extracted
tar -xf ..\app-debug.apk

# Search for the API URL in JavaScript files
findstr /s /i "192.168" assets\*
findstr /s /i "VITE_API_URL" assets\*
findstr /s /i "localhost" assets\*

# Look in index.html
type assets\index.html | findstr "api"
```

Or use a text editor to search `app-debug.apk` (it's a ZIP):
- Extract the APK
- Look in `assets/index.*.js` or `assets/index.html`
- Search for your API URL

---

## Method 4: Add Debug Logging to Your App

Add temporary logging to see exactly what URL is being used.

**Edit `src/services/api.ts`:**

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Add this debug log
console.log('🔧 API_BASE_URL configured as:', API_BASE_URL);
console.log('🔧 Environment:', import.meta.env.MODE);
console.log('🔧 All env vars:', import.meta.env);
```

Then:
1. Rebuild the app
2. Check Chrome DevTools Console (Method 1)
3. Or check Logcat (Method 2)

---

## Method 5: Network Proxy/Sniffer

Use a proxy to intercept all HTTP traffic.

### Using HTTP Toolkit (Free):

1. **Download:** https://httptoolkit.com/
2. **Install on your PC**
3. **Connect your Android device:**
   - Click "Android device via ADB"
   - Follow the prompts to install the certificate on your phone
4. **Launch your app**
5. **See ALL HTTP requests** in HTTP Toolkit, including:
   - Full URLs
   - Request/response headers
   - Request/response bodies
   - Timing information

---

## Quick Debug Checklist

Run through this checklist to debug network issues:

### 1. Verify API URL in build
```bash
# After building, check what's in the APK
cd dist
findstr /s "192.168" index.html
```

### 2. Check backend is running
```powershell
# From your PC
curl http://192.168.137.148:5137/api

# Or check what ports are listening
netstat -ano | findstr "5137"
```

### 3. Test from phone browser FIRST
Before testing the APK:
- Open your phone's Chrome browser
- Navigate to: `http://192.168.137.148:5137/api`
- If this doesn't work, the APK won't work either!

### 4. Verify both devices on same WiFi
- PC and phone must be on the SAME WiFi network
- If phone is on mobile data, it won't reach local IP

### 5. Check Windows Firewall
```powershell
# List firewall rules for port 5137
Get-NetFirewallRule | Where-Object {$_.Enabled -eq $true} | Get-NetFirewallPortFilter | Where-Object {$_.LocalPort -eq 5137}
```

---

## Common Issues and Solutions

### Issue: Request goes to wrong URL
**Check:** Chrome DevTools → Network tab
**Fix:** Rebuild with correct VITE_API_URL in .env.production

### Issue: "Connection Refused" immediately
**Check:** Backend isn't running or firewall blocking
**Fix:** 
```bash
# Verify backend is running
netstat -ano | findstr "5137"

# Test from phone browser first
# http://YOUR_IP:5137/api
```

### Issue: "DNS_PROBE_FINISHED_NXDOMAIN"
**Check:** Using a hostname that doesn't resolve
**Fix:** Use IP address instead of localhost/hostname

### Issue: Works in browser, not in APK
**Check:** Different build config
**Fix:** 
```bash
# Clean and rebuild
rm -rf dist android/app/build
npm run build
npx cap sync
```

### Issue: Timeout after 30 seconds
**Check:** Firewall blocking OR devices on different networks
**Fix:** 
- Verify same WiFi
- Test connectivity from phone browser
- Check Windows Firewall

---

## Real-Time Debug Command

Run this while testing your app to see live logs:

```bash
# Clear logs, then watch in real-time
adb logcat -c && adb logcat | findstr /i "fetch http error capacitor yaqeenpay"
```

This will show you immediately:
- What URLs are being called
- What errors occur
- Network failures

---

## Best Practice: Test Before Building APK

**Always do this BEFORE building APK:**

1. ✅ Test backend from PC: `curl http://192.168.137.148:5137/api`
2. ✅ Test from phone browser: `http://192.168.137.148:5137/api`
3. ✅ Verify .env.production has correct URL
4. ✅ Then build APK

This saves you from rebuilding multiple times!
