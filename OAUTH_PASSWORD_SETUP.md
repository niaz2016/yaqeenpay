# OAuth User Password Setup Feature

## Overview

Users who register via Google OAuth don't have a password initially. This feature allows them to set a password later, enabling traditional email/password login alongside OAuth.

## Implementation Summary

### Backend Changes

#### 1. Profile Response Enhancement
**File**: `Backend/YaqeenPay.Application/Features/UserManagement/Common/UserProfileDto.cs`
- Added `HasPassword` property to indicate if user has a password set
- Returns `true` if `PasswordHash` is not null/empty, `false` otherwise

**File**: `Backend/YaqeenPay.Application/Features/UserManagement/Queries/GetUserProfile/GetUserProfileQueryHandler.cs`
- Updated to include `HasPassword = !string.IsNullOrEmpty(user.PasswordHash)` in profile response

#### 2. Identity Service
**File**: `Backend/YaqeenPay.Application/Common/Interfaces/IIdentityService.cs`
- Added new method: `Task<IdentityResult> SetPasswordAsync(Guid userId, string newPassword);`

**File**: `Backend/YaqeenPay.Infrastructure/Identity/IdentityService.cs`
- Implemented `SetPasswordAsync` using `UserManager.AddPasswordAsync()`
- This method is specifically for users who don't have a password yet

#### 3. Password Change Command
**File**: `Backend/YaqeenPay.Application/Features/UserManagement/Commands/ChangePassword/ChangePasswordCommand.cs`
- Changed `CurrentPassword` from required to optional (`string?`)
- OAuth users setting password for first time don't need to provide current password

**File**: `Backend/YaqeenPay.Application/Features/UserManagement/Commands/ChangePassword/ChangePasswordCommandHandler.cs`
- Added logic to detect if user has password
- Routes to `SetPasswordAsync` if no password exists
- Routes to `ChangePasswordAsync` if password exists and current password is provided
- Returns false if user has password but doesn't provide current password

### Frontend Changes

#### 1. Type Definitions
**File**: `Frontend/src/types/profile.ts`
- Added `hasPassword: boolean` to `ProfileDetails` interface
- Made `currentPassword` optional in `ChangePasswordRequest` interface

#### 2. Validation Schemas
**File**: `Frontend/src/utils/validationSchemas.ts`
- Added new `setPasswordSchema` for OAuth users (no current password field)
- Kept existing `changePasswordSchema` for users with passwords

#### 3. Profile Service
**File**: `Frontend/src/services/profileService.ts`
- Updated `getProfile()` to normalize `hasPassword` field from backend response
- Defaults to `true` if not provided (backward compatibility)

#### 4. UI Components

**File**: `Frontend/src/components/profile/ChangePassword.tsx`
- Fetches user profile on mount to check `hasPassword` flag
- Conditionally renders "Set Password" vs "Change Password" title
- Shows info alert for OAuth users explaining they can set a password
- Hides "Current Password" field when `hasPassword` is false
- Uses appropriate validation schema based on `hasPassword`
- Updates labels: "Password" vs "New Password", "Confirm Password" vs "Confirm New Password"
- Updates button text: "Set Password" vs "Change Password"

**File**: `Frontend/src/pages/settings/sections/SecuritySettings.tsx`
- Fetches user profile to check `hasPassword` flag
- Updated password change dialog:
  - Conditional title: "Set Password" vs "Change Password"
  - Info alert for OAuth users
  - Conditionally shows "Current Password" field
  - Adjusted field labels based on context
  - Updated button text dynamically
  - Modified validation to not require current password for OAuth users
- Updated success messages to distinguish between set and change

## User Flow

### For OAuth Users (No Password)

1. User logs in via Google OAuth
2. Navigates to Profile → Security or Settings → Security
3. Clicks "Change Password" (button shows "Set Password" if implemented in UI)
4. Sees dialog/form with:
   - Info message: "You registered using Google OAuth and don't have a password yet..."
   - Password field (no current password field)
   - Confirm Password field
5. Enters new password (8+ chars, with uppercase, lowercase, number, special char)
6. Clicks "Set Password"
7. Backend:
   - Detects user has no password (`PasswordHash` is null)
   - Calls `SetPasswordAsync` → `UserManager.AddPasswordAsync()`
   - Adds password to user account
8. User receives success message: "Password set successfully!"
9. Can now log in with email + password OR continue using Google OAuth

### For Regular Users (Has Password)

1. User registered with email/password
2. Navigates to password change section
3. Sees form with:
   - Current Password field
   - New Password field
   - Confirm New Password field
4. Enters all three fields
5. Clicks "Change Password"
6. Backend:
   - Detects user has password
   - Validates current password
   - Calls `ChangePasswordAsync` → `UserManager.ChangePasswordAsync()`
7. User receives success message: "Password changed successfully!"

## Security Considerations

1. **Current Password Validation**: Users with existing passwords MUST provide current password to change it
2. **OAuth Users**: Can set initial password without current password (they don't have one)
3. **Password Requirements**: 
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character
4. **One-Time Setup**: Once OAuth user sets password, they become a regular user and must provide current password for future changes

## Testing

### Test Case 1: OAuth User Sets Password
1. Register new user via Google OAuth
2. Check profile - `hasPassword` should be `false`
3. Navigate to password change section
4. Verify "Current Password" field is NOT shown
5. Enter new password and confirmation
6. Submit - should succeed without current password
7. Check profile again - `hasPassword` should now be `true`
8. Try logging in with email + new password - should work

### Test Case 2: Regular User Changes Password
1. Register user with email/password
2. Check profile - `hasPassword` should be `true`
3. Navigate to password change section
4. Verify "Current Password" field IS shown
5. Try submitting without current password - should fail
6. Enter correct current password + new password
7. Submit - should succeed
8. Try logging in with new password - should work

### Test Case 3: OAuth User After Setting Password
1. OAuth user who has set password (Test Case 1)
2. Navigate to password change section again
3. Verify "Current Password" field IS now shown
4. Must provide the password they set to change it again

## API Endpoints

### GET /api/profile
**Response**:
```json
{
  "id": "guid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "hasPassword": false,  // <-- New field
  ...
}
```

### POST /api/profile/change-password
**Request** (OAuth user setting password):
```json
{
  "newPassword": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Request** (Regular user changing password):
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password set successfully!" // or "Password changed successfully!"
}
```

## Database Impact

No database schema changes required. Uses existing `AspNetUsers.PasswordHash` column:
- OAuth users: `PasswordHash` is `NULL`
- Regular users: `PasswordHash` contains hashed password
- OAuth users after setting password: `PasswordHash` contains hashed password

## Deployment

All changes deployed in Docker images:
- Backend: Latest build includes password set/change logic
- Frontend: Latest build includes conditional UI

Run `.\quick-rebuild.ps1` to rebuild and deploy:
```powershell
cd "D:\Work Repos\AI\yaqeenpay"
.\quick-rebuild.ps1
```

## Future Enhancements

1. **Password Reset**: Add "Forgot Password" flow for users who set password
2. **Account Linking**: Allow OAuth users to link multiple OAuth providers
3. **Security Dashboard**: Show login methods available (OAuth + Password)
4. **Password Strength Indicator**: Visual feedback for password strength
5. **2FA**: Add two-factor authentication for enhanced security
