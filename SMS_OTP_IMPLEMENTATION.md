# SMS OTP Implementation Summary

## Overview
Completed implementation of SMS OTP sending and resend functionality with countdown timer for device verification during login.

## Changes Made

### 1. Backend Changes

#### LoginCommand.cs
- **Injected ISmsSender**: Added SMS service to constructor for sending OTPs
- **Updated Metadata Structure**: Enhanced notification metadata to include:
  - `attempts`: Track OTP resend attempts (starts at 0)
  - `lastSentAt`: Timestamp for cooldown enforcement
- **SMS Integration**: Implemented actual SMS sending with error handling:
  ```csharp
  try
  {
      await _smsSender.SendOtpAsync(
          user.PhoneNumber, 
          otp, 
          cancellationToken: cancellationToken
      );
  }
  catch (Exception ex)
  {
      _logger.LogError(ex, "Failed to send OTP via SMS to {PhoneNumber}", user.PhoneNumber);
  }
  ```

#### ResendOtpCommand.cs (NEW)
- **Created Complete Handler**: New command for OTP resend with:
  - **60-Second Cooldown**: Users must wait 60 seconds between resend attempts
  - **Max 3 Attempts**: Limit resends to 3 attempts per OTP session
  - **Expiry Check**: Validates OTP hasn't expired (10-minute window)
  - **Device Validation**: Ensures request is for the correct device
  - **Metadata Tracking**: Updates attempts and lastSentAt timestamp
  - **Response Data**: Returns `remainingAttempts` and `nextAllowedAt` timestamp

**Key Constants**:
```csharp
private const int MaxOtpAttempts = 3;
private const int ResendCooldownSeconds = 60;
```

#### VerifyDeviceCommand.cs
- **Improved JSON Parsing**: Changed metadata deserialization to use `JsonElement` for type safety
- **Better Error Handling**: More robust extraction of metadata fields

#### AuthController.cs
- **Added Resend Endpoint**: New POST endpoint at `/auth/resend-otp`
- **MediatR Integration**: Routes to ResendOtpCommand through MediatR

### 2. Frontend Changes

#### authService.ts
- **New Method**: `resendDeviceOtp(notificationId: string, deviceId: string)`
- **Returns**: Object with `success`, `message`, `remainingAttempts`, and `nextAllowedAt`
- **API Call**: POST to `/auth/resend-otp`

#### LoginForm.tsx
- **Added State Variables**:
  - `countdown`: Tracks remaining seconds (starts at 60)
  - `remainingAttempts`: Tracks remaining resend attempts (starts at 3)

- **Countdown Timer**: useEffect hook that:
  - Decrements countdown every second
  - Cleans up interval on unmount
  - Stops at 0

- **Resend Handler**: `handleResendOtp()` function that:
  - Checks if countdown is still active
  - Calls resend API
  - Updates remaining attempts from response
  - Resets countdown to 60 seconds
  - Shows success/error messages

- **Enhanced OTP Dialog**:
  - Shows remaining attempts counter
  - Displays countdown timer when active
  - Shows "Resend OTP" button when countdown reaches 0
  - Disables resend button if no attempts remaining
  - Auto-initializes countdown and attempts when dialog opens

## UI/UX Features

### OTP Verification Dialog
1. **Top Section**: Alert with message and instructions
2. **OTP Input**: 6-digit numeric input field
3. **Bottom Section**:
   - **Left**: "Remaining attempts: X" counter
   - **Right**: Either countdown message or resend button
     - During cooldown: "Resend OTP in Xs"
     - After cooldown: Clickable "Resend OTP" button
4. **Actions**: Cancel and Verify buttons

### Visual Feedback
- Countdown display updates every second
- Resend button automatically appears when cooldown ends
- Button disabled when no attempts remain
- Success/error alerts for resend operations

## Technical Details

### SMS Service Integration
- **Provider**: MacroDroid SMS sender (already implemented)
- **Method**: `SendOtpAsync(phoneNumber, otp, cancellationToken)`
- **Registration**: Registered in DI container as scoped service
- **Error Handling**: Logs failures but doesn't block login flow

### Metadata Structure
```json
{
  "otp": "123456",
  "deviceId": "guid-here",
  "expiry": "2025-01-14T10:30:00Z",
  "attempts": 0,
  "lastSentAt": "2025-01-14T10:20:00Z"
}
```

### Security Features
- **Time-based Cooldown**: Prevents spam by enforcing 60-second wait
- **Attempt Limiting**: Max 3 resend attempts per OTP session
- **Expiry Window**: OTP valid for 10 minutes only
- **Device Matching**: Validates request is for correct device
- **Timestamp Validation**: Server-side enforcement of cooldown period

### API Endpoints

#### POST /auth/login
- Returns `deviceVerificationRequired: true` for new devices
- Includes `notificationId` and `deviceId` for verification
- Sends initial OTP via SMS

#### POST /auth/resend-otp
**Request**:
```json
{
  "notificationId": "guid",
  "deviceId": "guid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "data": {
    "remainingAttempts": 2,
    "nextAllowedAt": "2025-01-14T10:21:00Z"
  }
}
```

#### POST /auth/verify-device
- Validates OTP and completes device verification
- Returns JWT token on success

## Build Status
- ✅ Backend builds successfully (no compilation errors)
- ✅ Frontend builds successfully (no TypeScript errors)
- ✅ All lint warnings resolved

## Testing Checklist
- [ ] Login from new device triggers SMS
- [ ] OTP received via MacroDroid
- [ ] OTP verification works
- [ ] Countdown timer displays correctly
- [ ] Resend button appears after 60 seconds
- [ ] Resend sends new OTP via SMS
- [ ] Remaining attempts counter updates
- [ ] Max 3 attempts enforced
- [ ] Cooldown period enforced
- [ ] Error messages display correctly

## Next Steps
1. Run database migration to create UserDevices table (if not done)
2. Test SMS sending with MacroDroid integration
3. End-to-end testing of device verification flow
4. Monitor SMS delivery rates and error logs

## Files Modified
1. `Backend/YaqeenPay.Application/Features/Auth/Commands/Login/LoginCommand.cs`
2. `Backend/YaqeenPay.Application/Features/Auth/Commands/ResendOtp/ResendOtpCommand.cs` (NEW)
3. `Backend/YaqeenPay.Application/Features/Auth/Commands/VerifyDevice/VerifyDeviceCommand.cs`
4. `Backend/YaqeenPay.API/Controllers/AuthController.cs`
5. `Frontend/src/services/authService.ts`
6. `Frontend/src/components/auth/LoginForm.tsx`

## Configuration Notes
- SMS service uses existing MacroDroid configuration
- No additional environment variables needed
- ISmsSender already registered in DI container (line 277 of DependencyInjection.cs)
- Cooldown and attempt limits are configurable via constants in ResendOtpCommand

## Performance Considerations
- Countdown timer uses single useEffect with proper cleanup
- SMS sending is async and doesn't block response
- Metadata updates are efficient (single database update)
- Frontend re-renders minimized with proper state management
