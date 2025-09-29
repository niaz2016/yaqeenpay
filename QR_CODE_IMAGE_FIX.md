# QR Code Image Fix

## Problem
The QR code image was not showing in the popup dialog when users clicked "Top Up" on the wallet page.

## Root Cause
1. The QR image file `pay-qr.jpg` was only in the frontend's `public` directory
2. The backend QR service was returning a relative path `/images/pay-qr.jpg` instead of a full URL
3. The frontend couldn't access the image from the backend's static files

## Solution Applied

### 1. Copied QR Image to Backend
- Copied `pay-qr.jpg` from `Frontend/public/` to `Backend/YaqeenPay.API/wwwroot/images/`
- Backend now serves this image via static files middleware

### 2. Updated QR Service to Return Full URL
**File:** `Backend/YaqeenPay.Application/Features/Wallets/Services/QrCodeService.cs`
- Modified `GenerateQrImageAsync` to accept optional `baseUrl` parameter
- Now builds full URL: `{baseUrl}/images/pay-qr.jpg`
- Falls back to configuration or localhost if baseUrl not provided

### 3. Updated WalletTopupService Interface
**File:** `Backend/YaqeenPay.Application/Features/Wallets/Services/WalletTopupService.cs`
- Modified `CreateTopupRequestAsync` to accept optional `baseUrl` parameter
- Passes baseUrl to QR service

### 4. Updated Controller to Pass Base URL
**File:** `Backend/YaqeenPay.API/Controllers/WalletsController.cs`
- Modified `CreateQrTopup` endpoint to extract base URL from current request
- Passes `{Request.Scheme}://{Request.Host}` to service

### 5. Added Frontend Debugging
**File:** `Frontend/src/components/wallet/TopUpForm.tsx`
- Added console logging to track QR response
- Added error handling for image loading
- Added fallback display showing the QR URL for debugging

## Files Modified

### Backend
- ✅ `YaqeenPay.Application/Features/Wallets/Services/QrCodeService.cs`
- ✅ `YaqeenPay.Application/Features/Wallets/Services/WalletTopupService.cs`  
- ✅ `YaqeenPay.API/Controllers/WalletsController.cs`
- ✅ `YaqeenPay.API/wwwroot/images/pay-qr.jpg` (copied from frontend)

### Frontend
- ✅ `Frontend/src/components/wallet/TopUpForm.tsx`

## Testing Instructions

### 1. Restart the Application
Since the API is currently running and preventing rebuild, you need to:
1. Stop the current API process
2. Rebuild the solution: `dotnet build`
3. Start the API again

### 2. Test the QR Flow
1. Navigate to the wallet page
2. Click "Top Up" 
3. Select "JazzCash (QR)" as payment method
4. Enter an amount (e.g., 100)
5. Click "Generate QR"
6. The dialog should now show:
   - The QR code image clearly
   - Current balance
   - Amount to be paid
   - Expiry time

### 3. Debug Information
The browser console will now show:
- `QR Topup Response: {object}` - Full API response
- `QR Image loaded successfully: {url}` - When image loads
- `QR Image failed to load: {url}` - If image fails to load

### 4. Verify URL Structure
The QR image URL should look like:
- `https://localhost:7001/images/pay-qr.jpg` (development)
- `https://yourdomain.com/images/pay-qr.jpg` (production)

## Expected Behavior After Fix

1. **QR Dialog Opens:** Shows the payment dialog with QR code
2. **Image Displays:** The pay-qr.jpg image is clearly visible (250x250px)
3. **Full Information:** Shows amount, balance, expiry time, and transaction reference
4. **Error Handling:** If image fails to load, console shows error and URL for debugging

## Additional Notes

- The QR image is currently static (`pay-qr.jpg`)
- For production, you may want to implement dynamic QR generation
- The image is served from the backend's static files middleware
- CORS is configured to allow frontend access to backend resources

## Fallback Plan
If the image still doesn't show after these changes:
1. Check browser Network tab for 404 errors on image request
2. Verify the image file exists at `Backend/YaqeenPay.API/wwwroot/images/pay-qr.jpg`
3. Ensure static files middleware is working: `app.UseStaticFiles()` in Program.cs
4. Check console logs for the actual QR URL being returned