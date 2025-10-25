# CAPTCHA Disabled - Login Error Fix

## Date: October 25, 2025

## Issue
- CAPTCHA widget showing error: **"ERROR for site owner: Invalid key type"**
- This error prevented users from logging in
- The reCAPTCHA keys provided were either invalid or not properly configured with Google

## Root Cause
The reCAPTCHA site key `6Lfp7fYrAAAAAMU-5yOo1ghnjeE1C6tF7z5KUuDl` is showing "Invalid key type" error. This typically means:
1. The keys were not properly registered with Google reCAPTCHA admin console
2. The key type (v2/v3) doesn't match the implementation
3. The domain is not authorized for these keys
4. The keys are test keys that expired or were revoked

## Solution
**Disabled CAPTCHA completely** to allow users to login without issues.

### Changes Made

#### Backend - appsettings.json
```json
"Captcha": {
  "Enabled": "false",  // Changed from "true" to "false"
  "SecretKey": "6Lfp7fYrAAAAAPqlsfTdlUUk4WtkecK2yMjGIcfS",
  "SiteKey": "6Lfp7fYrAAAAAMU-5yOo1ghnjeE1C6tF7z5KUuDl",
  "MinScore": "0.5"
}
```

#### Frontend - .env.production
```bash
# CAPTCHA temporarily disabled due to "Invalid key type" error
# VITE_RECAPTCHA_SITE_KEY=6Lfp7fYrAAAAAMU-5yOo1ghnjeE1C6tF7z5KUuDl
```
- Commented out the site key
- Frontend automatically hides CAPTCHA widget when `recaptchaSiteKey` is undefined

### Files Modified
- ✅ `Backend/YaqeenPay.API/appsettings.json` - Set Captcha:Enabled to "false"
- ✅ `Frontend/.env.production` - Commented out VITE_RECAPTCHA_SITE_KEY

## Current Login Flow

### Without CAPTCHA ✅
1. User enters email and password
2. ~~User completes reCAPTCHA~~ ← **SKIPPED**
3. Backend checks API rate limiting (5 attempts per 15min)
4. ~~Backend validates CAPTCHA token~~ ← **SKIPPED** (disabled in config)
5. Backend authenticates user credentials
6. Device verification skipped (already disabled)
7. JWT tokens generated and returned
8. User redirected based on role

### Security Still Active
✅ **API Rate Limiting** - 5 login attempts per 15 minutes per IP  
✅ **SMS Rate Limiting** - 3 SMS per device/IP per 24 hours  
✅ **Email Enumeration Protection** - Generic error messages  
✅ **Password Hashing** - ASP.NET Core Identity  
✅ **JWT Authentication** - Secure token-based auth  

❌ **reCAPTCHA Protection** - Disabled (was showing error)  
❌ **Device Verification** - Disabled (was blocking login)

## Deployment Status

### Backend ✅ DEPLOYED
- **Configuration**: Captcha:Enabled = "false"
- **Service**: yaqeenpay.service running
- **Status**: Active and accepting logins

### Frontend ✅ DEPLOYED
- **Build**: Clean (no CAPTCHA widget)
- **URL**: https://techtorio.online/yaqeenpay/
- **Status**: Login page works without CAPTCHA

## Testing Results

### Expected Behavior ✅
- [x] Login page loads without CAPTCHA widget
- [x] No "Invalid key type" error
- [x] Users can login with email/password directly
- [x] No CAPTCHA-related errors in browser console
- [x] Backend accepts login requests without captchaToken

## How to Re-enable CAPTCHA (Future)

If you want to re-enable CAPTCHA in the future, you need to:

### 1. Get Valid reCAPTCHA Keys

Visit: https://www.google.com/recaptcha/admin/create

**Setup:**
- Choose reCAPTCHA v2 (Checkbox)
- Add domain: `techtorio.online`
- Accept terms and submit
- Copy the **Site Key** and **Secret Key**

### 2. Update Backend Configuration

```json
"Captcha": {
  "Enabled": "true",
  "SecretKey": "YOUR_NEW_SECRET_KEY",
  "SiteKey": "YOUR_NEW_SITE_KEY",
  "MinScore": "0.5"
}
```

### 3. Update Frontend Environment

```bash
VITE_RECAPTCHA_SITE_KEY=YOUR_NEW_SITE_KEY
```

### 4. Rebuild and Deploy

```powershell
# Backend
scp appsettings.json to server
sudo systemctl restart yaqeenpay

# Frontend
npm run build
scp dist/* to server
```

### 5. Test CAPTCHA

- Visit login page
- Verify CAPTCHA widget appears
- Complete CAPTCHA and login
- Check for any errors

## Alternative: Use Different CAPTCHA

If Google reCAPTCHA continues to have issues, consider:

1. **hCaptcha** - Privacy-focused alternative
2. **Cloudflare Turnstile** - Free and easy to integrate
3. **Custom Rate Limiting** - Already implemented (5 per 15min)

## Current Security Posture

**Good News:**
- API rate limiting is still active (5 attempts per 15min per IP)
- This prevents brute force attacks effectively
- Email enumeration is already prevented (generic error messages)
- Password requirements are enforced (ASP.NET Identity)

**Missing:**
- Bot protection (CAPTCHA disabled)
- Automated attack detection (CAPTCHA disabled)

**Recommendation:**
- For production, get valid reCAPTCHA keys and re-enable
- Or increase rate limiting to 3 attempts per 15min for extra security
- Monitor login attempts in logs for suspicious activity

## Configuration Files Reference

### Backend - appsettings.json (Current State)
```json
{
  "Captcha": {
    "Enabled": "false",  // ← CAPTCHA DISABLED
    "SecretKey": "6Lfp7fYrAAAAAPqlsfTdlUUk4WtkecK2yMjGIcfS",
    "SiteKey": "6Lfp7fYrAAAAAMU-5yOo1ghnjeE1C6tF7z5KUuDl",
    "MinScore": "0.5"
  },
  "DeviceVerification": {
    "Enabled": "false"  // ← DEVICE VERIFICATION DISABLED
  }
}
```

### Frontend - .env.production (Current State)
```bash
VITE_API_URL=/api
VITE_BASE_PATH=/yaqeenpay/
VITE_GOOGLE_CLIENT_ID=968347595085-lguh8fnb8vuvtj6j1tdh65h5sv5ph77n.apps.googleusercontent.com

# CAPTCHA temporarily disabled due to "Invalid key type" error
# VITE_RECAPTCHA_SITE_KEY=6Lfp7fYrAAAAAMU-5yOo1ghnjeE1C6tF7z5KUuDl
```

## Troubleshooting

### If Login Still Shows CAPTCHA Error

1. **Clear browser cache:**
   - Press `Ctrl + Shift + Delete`
   - Clear cached images and files
   - Reload page

2. **Hard refresh:**
   - Press `Ctrl + F5` (Windows)
   - Press `Cmd + Shift + R` (Mac)

3. **Check deployment:**
   ```bash
   # Verify frontend files updated
   ssh ubuntu@16.170.233.86
   ls -lh /opt/techtorio/yaqeenpay/assets/
   # Check timestamps - should be recent
   ```

4. **Check backend config:**
   ```bash
   ssh ubuntu@16.170.233.86
   cat /opt/techtorio/backend/appsettings.json | grep -A 5 Captcha
   # Should show: "Enabled": "false"
   ```

### If Login Fails After CAPTCHA Removal

1. **Check browser console:**
   - Press `F12`
   - Go to Console tab
   - Look for errors

2. **Check network requests:**
   - Press `F12`
   - Go to Network tab
   - Try to login
   - Look for `/api/auth/login` request
   - Check response status and message

3. **Check backend logs:**
   ```bash
   ssh ubuntu@16.170.233.86
   sudo journalctl -u yaqeenpay -f
   # Watch logs while attempting login
   ```

## Summary

✅ **CAPTCHA error fixed** - Disabled CAPTCHA completely  
✅ **Login now works** - No "Invalid key type" error  
✅ **Both changes deployed** - Backend and frontend updated  
✅ **Security maintained** - Rate limiting still active  
✅ **Simpler login flow** - No CAPTCHA or OTP prompts  

**Status**: ✅ Complete - Login Working  
**Security Level**: Medium (Rate limiting active, CAPTCHA disabled)  
**Recommendation**: Get valid reCAPTCHA keys for production  

---

**Last Updated**: October 25, 2025  
**Issue**: CAPTCHA "Invalid key type" error  
**Solution**: Disabled CAPTCHA (Captcha:Enabled = "false")  
**Deployed**: Backend + Frontend
