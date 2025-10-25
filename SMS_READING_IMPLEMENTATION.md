# SMS Reading Implementation for Android

## Overview

This implementation enables the YaqeenPay Android APK to read SMS messages received on the phone. This feature supports:

1. **Automatic OTP Detection**: Detects and auto-fills OTP codes from SMS during device verification
2. **Bank SMS Processing**: Automatically processes bank transfer notification SMS and credits user wallets
3. **Permission Management**: Handles Android SMS permissions properly

## Architecture

### Components

1. **SmsService** (`src/services/smsService.ts`)
   - TypeScript service for SMS operations
   - Handles permission requests
   - Provides SMS reading and filtering capabilities

2. **SmsReaderPlugin** (`android/app/src/main/java/.../SmsReaderPlugin.java`)
   - Native Android plugin for Capacitor
   - Reads SMS from device storage
   - Manages Android permissions

3. **SmsMonitor** (`src/components/SmsMonitor.tsx`)
   - React component for background SMS monitoring
   - Auto-detects OTP codes
   - Processes bank SMS notifications

## Features

### 1. Permission Management

The app properly requests and manages SMS read permissions:

```typescript
// Check if permissions are granted
const hasPermission = await smsService.hasReadPermission();

// Request permissions if needed
const granted = await smsService.requestReadPermission();
```

### 2. OTP Auto-Detection

When the OTP dialog is open, the SMS monitor:
- Monitors incoming SMS messages
- Detects OTP patterns (4-8 digit codes)
- Auto-fills the OTP field
- Auto-submits after 1 second delay

### 3. Bank SMS Processing

The app automatically:
- Detects bank SMS patterns (PKR amounts, bank names)
- Sends bank SMS to backend webhook
- Triggers automatic wallet credit processing

### 4. SMS Reading Capabilities

```typescript
// Read recent SMS messages
const messages = await smsService.getRecentSmsMessages(10);

// Filter for OTP messages
const otpMessages = smsService.filterOtpMessages(messages);

// Extract OTP code from message
const otp = smsService.extractOtpFromMessage(smsText);
```

## Android Permissions

Required permissions in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
```

## Usage

### In Login Component

```tsx
import { SmsMonitor } from '../SmsMonitor';

// Add to component
<SmsMonitor 
  isOtpPending={showOtpDialog}
  onOtpDetected={handleOtpDetected}
  enableBankSmsProcessing={true}
/>
```

### Manual SMS Reading

```typescript
import { smsService } from '../services/smsService';

// Read SMS messages
const messages = await smsService.readSmsMessages({
  maxResults: 20,
  box: 'inbox'
});

// Send bank SMS to backend
await smsService.sendSmsToBackend(smsText, userId);
```

## Backend Integration

Bank SMS messages are automatically sent to:
- **Endpoint**: `POST /api/webhooks/bank-sms`
- **Headers**: `X-Webhook-Secret: dev-secret`
- **Payload**: `{ "sms": "message text", "userId": "optional-guid" }`

## Security Considerations

1. **Permission Handling**: App properly requests runtime permissions
2. **Data Privacy**: SMS data is only processed locally and sent to your backend
3. **Webhook Security**: Uses secret header for webhook authentication
4. **Pattern Matching**: Only processes SMS matching specific patterns

## Testing

### Test OTP Detection

1. Send an OTP SMS to the device
2. Open login and trigger device verification
3. Verify OTP is auto-detected and filled

### Test Bank SMS Processing

1. Send a bank transfer notification SMS
2. Check backend logs for webhook call
3. Verify wallet balance is updated

## Supported SMS Patterns

### OTP Patterns
- 4-8 digit codes: `1234`, `123456`
- Code formats: `Code: 123456`, `OTP: 1234`
- Verification formats: `Verification: 123456`

### Bank SMS Patterns
- Amount patterns: `PKR 1,500.00 received`
- Bank names: `HBL`, `UBL`, `MCB`, `JazzCash`, `EasyPaisa`
- Transfer keywords: `received`, `credit`, `transfer`, `payment`

## Build Configuration

Ensure Capacitor is properly configured:

```bash
# Install dependencies
npm install @ionic-native/sms --legacy-peer-deps

# Sync Android project
npx cap sync android

# Build APK
npx cap build android
```

## Troubleshooting

### Permission Issues
- Ensure target SDK version supports runtime permissions
- Check if permissions are declared in AndroidManifest.xml
- Test permission flow on actual device (not emulator)

### SMS Not Detected
- Check if device has received SMS recently
- Verify SMS patterns match expected formats
- Check console logs for permission errors

### Backend Integration Issues
- Verify webhook endpoint is accessible
- Check X-Webhook-Secret header
- Monitor backend logs for processing errors

## Future Enhancements

1. **Real-time SMS Receiver**: Implement broadcast receiver for instant SMS detection
2. **Enhanced Pattern Matching**: Add support for more bank formats
3. **User Preferences**: Allow users to enable/disable auto-processing
4. **SMS History**: Show processed SMS history in app
5. **Multi-language Support**: Support SMS in different languages