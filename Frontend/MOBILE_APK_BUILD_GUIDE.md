# Mobile APK Build Guide - Fixing "Failed to Fetch" Errors

## Problem
When running the APK on a mobile device or WSA (Windows Subsystem for Android), you get immediate "Failed to fetch" errors because the app can't reach the backend server.

## Root Cause
The APK is built with hardcoded API URLs that point to localhost or local network IPs that aren't accessible from the device.

## Solution Steps

### Step 1: Check Your Network IP
Find your development machine's local network IP:

**Windows:**
```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.43.48
```

**Linux/Mac:**
```bash
ifconfig
# or
ip addr show
```

### Step 2: Ensure Backend is Running and Accessible

1. **Start your .NET backend** and note which port it's running on:
   ```
   https://localhost:7137  (HTTPS)
   http://localhost:5137   (HTTP - if configured)
   ```

2. **Make backend accessible on network** (not just localhost):
   - The backend must listen on `0.0.0.0` or your network IP, not just `127.0.0.1`
   - Check your backend's `launchSettings.json` or configuration
   - You may need to add firewall rules to allow incoming connections on port 7137/5137

3. **Test backend accessibility from network:**
   ```powershell
   # From your development machine
   curl http://192.168.43.48:7137/api/health
   
   # Or test from the mobile device browser
   # Open: http://192.168.43.48:7137/api/health
   ```

### Step 3: Update .env.production with Correct API URL

Edit `.env.production`:

```bash
# Use HTTP (not HTTPS) for local network testing since HTTPS requires valid certificates
VITE_API_URL=http://192.168.43.48:7137/api

# Replace 192.168.43.48 with YOUR machine's IP
# Replace 7137 with your backend's HTTP port
```

**Important Notes:**
- Use `http://` (not `https://`) for local network testing
- HTTPS won't work on local IPs without valid SSL certificates
- The IP must be your machine's actual network IP (not 127.0.0.1 or localhost)
- Both the device and your PC must be on the same WiFi network

### Step 4: Rebuild the App

```bash
# Clean previous build
npm run clean

# Build fresh with production env
npm run build

# Sync with Capacitor
npx cap sync

# Open in Android Studio and rebuild APK
npx cap open android
```

### Step 5: Verify Network Connectivity

Before installing the APK:

1. **Check both devices are on same WiFi**
2. **Test backend from mobile browser:**
   - Open phone's browser
   - Navigate to: `http://192.168.43.48:7137/api/health` (use your IP)
   - You should see a response (not connection error)

3. **Check Windows Firewall:**
   ```powershell
   # Allow inbound connections on backend port
   netsh advfirewall firewall add rule name="ASP.NET Core" dir=in action=allow protocol=TCP localport=7137
   ```

### Step 6: Install and Test APK

```bash
# Build APK in Android Studio
# Or via command line:
cd android
./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk

# Check logs if still failing
adb logcat | grep -i "yaqeenpay"
```

## Alternative: Using ngrok for Testing

If network configuration is complex, use ngrok to expose backend:

```bash
# Start ngrok (pointing to backend)
ngrok http https://localhost:7137

# Update .env.production with ngrok URL
VITE_API_URL=https://abc123.ngrok-free.app/api

# Rebuild app
npm run build
npx cap sync
```

## For Production Deployment (aisakro.online)

When deploying to your Oracle server:

```bash
# Update .env.production
VITE_API_URL=https://api.aisakro.online/api

# Or if backend is on same domain
VITE_API_URL=https://aisakro.online/api

# Rebuild for production
npm run build
npx cap sync
```

## Common Issues

### Issue 1: "Failed to fetch" immediately (no delay)
**Cause:** App can't resolve/reach the IP address
**Fix:** 
- Verify both devices on same network
- Check IP address is correct
- Test backend URL in mobile browser first

### Issue 2: "Network Error" or "Connection Refused"
**Cause:** Backend not listening on network interface
**Fix:**
- Update backend to listen on `0.0.0.0` not `127.0.0.1`
- Check firewall isn't blocking the port
- Verify backend is actually running

### Issue 3: "SSL/Certificate Error" 
**Cause:** Using HTTPS with self-signed cert on local IP
**Fix:**
- Use HTTP for local testing
- Or add certificate exception in app

### Issue 4: Works in browser but not in APK
**Cause:** Different build environment variables
**Fix:**
- Ensure .env.production is being used
- Clean build and rebuild: `npm run clean && npm run build`
- Verify with: `grep VITE_API_URL dist/index.html`

## Testing Checklist

- [ ] Backend is running and accessible
- [ ] Both devices on same WiFi network  
- [ ] Correct IP address in .env.production
- [ ] Backend accessible from mobile browser
- [ ] Windows Firewall allows backend port
- [ ] App rebuilt after .env changes
- [ ] Fresh APK installed on device

## Debug Commands

```bash
# Check what API URL was baked into the build
grep -r "VITE_API_URL" dist/

# Test from command line
curl http://192.168.43.48:7137/api/health

# Check Android logs
adb logcat | grep -E "yaqeenpay|http|fetch|network"

# List all Android devices
adb devices
```

## Quick Fix Summary

1. Find your IP: `ipconfig` (Windows)
2. Update `.env.production`: `VITE_API_URL=http://YOUR_IP:7137/api`
3. Rebuild: `npm run build && npx cap sync`
4. Test backend in phone browser first
5. Install fresh APK
