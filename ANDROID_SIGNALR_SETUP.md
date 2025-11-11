# Android SignalR OTP Setup Guide

## Quick Setup Steps

### 1. Configure Backend URL in Android App

Open the Android app and go to the **"Receive SMS"** tab (first tab):

1. In the **Webhook URL** field, enter your backend URL:
   - For local testing: `http://YOUR_COMPUTER_IP:5137` (find your IP using `ipconfig` in PowerShell)
   - For Docker: `http://YOUR_COMPUTER_IP:5137`
   - For production: `https://your-backend-domain.com`

2. The SignalR client will automatically append `/hubs/device` to this URL

3. Click **Save** to store the configuration

### 2. Set Your Phone Number

In the same tab:

1. Enter your phone number in **Phone Number** field (e.g., `+923001234567`)
2. Click **Save**

This phone number will be used to register your device with the backend.

### 3. Restart the App

After saving the configuration:

1. Close the app completely
2. Reopen it

The SignalR client will automatically connect on app startup and register your device.

### 4. Verify Connection

Check the Android Logcat for SignalR connection logs:

```
SignalRClient: SignalR connected and RegisterDevice invoked
```

Or check the backend logs:

```bash
docker logs techtorio-backend --tail 50
```

Look for logs showing device registration.

### 5. Test OTP Flow

1. Go to your profile in the web/mobile app
2. Click "Verify Phone Number"
3. Request OTP

**Expected Flow:**
- Backend creates OTP
- OutboxDispatcher processes the SMS message
- CompositeSmsSender checks if device is connected via SignalR
- If connected: Pushes OTP to Android device via SignalR
- Android app receives the OTP and sends SMS using SmsManager
- If not connected: Falls back to direct HTTP call to Android endpoint

## Troubleshooting

### No SMS Received

1. **Check Android app logs** for:
   ```
   SignalRClient: SignalR connected and RegisterDevice invoked
   OTP sent from device
   ```

2. **Check backend logs** for:
   ```bash
   docker logs techtorio-backend --tail 100 | findstr "OTP"
   docker logs techtorio-backend --tail 100 | findstr "SignalR"
   ```

3. **Verify phone number format:**
   - Backend normalizes to: `923XXXXXXXXX` (12 digits, starts with 92)
   - Android app should have the same number saved

4. **Check OutboxDispatcher is enabled:**
   - In `appsettings.Development.json`: `"OutboxDispatcher": { "Enabled": true }`

5. **Verify SEND_SMS permission:**
   - Android app needs SMS permission granted

### SignalR Not Connecting

1. **Check backend URL is correct:**
   - Must be reachable from Android device
   - If using Docker, use your computer's IP (not `localhost`)
   - Port must match backend port (default: 5137 for HTTP)

2. **Check CORS settings:**
   - Backend allows all origins in development mode

3. **Check network:**
   - Phone and computer must be on same network (for local testing)
   - Firewall may block connections

## Configuration Files

### Backend

**appsettings.Development.json:**
```json
{
  "OutboxDispatcher": {
    "Enabled": true,
    "IntervalSeconds": 5,
    "BatchSize": 25
  },
  "AndroidSms": {
    "BaseUrl": "http://localhost:8080",
    "SecretKey": "...",
    "UseHmac": true,
    "TimeoutSeconds": 10,
    "OtpParamName": "varOTP",
    "ReceiverParamName": "receiver"
  }
}
```

### Android App

The app stores configuration in SharedPreferences:
- **Webhook URL** → Used for SignalR connection (appends `/hubs/device`)
- **Phone Number** → Used for device registration
- **Secret Key** → Used for HMAC (fallback HTTP endpoint)

## Architecture

```
Backend (ASP.NET Core)
  │
  ├─ ProfileController
  │    └─ POST /api/profile/verify-phone/request
  │         └─ Enqueues SMS in Outbox
  │
  ├─ OutboxDispatcherService (Background)
  │    └─ Processes outbox every 5 seconds
  │         └─ Calls ISmsSender.SendOtpAsync
  │
  ├─ CompositeSmsSender (ISmsSender)
  │    ├─ Checks DeviceRegistry for connected device
  │    ├─ If found: Uses SignalRDevicePushService
  │    │    └─ Sends "ReceiveOtp" message via SignalR
  │    └─ If not found: Falls back to AndroidSmsSender (HTTP)
  │
  └─ DeviceHub (SignalR)
       └─ /hubs/device
            ├─ RegisterDevice(deviceId, phoneNumber)
            └─ Sends: ReceiveOtp { phone, otp, template }

Android App
  │
  ├─ SignalRClient
  │    ├─ Connects to /hubs/device on app start
  │    ├─ Calls RegisterDevice with ANDROID_ID + phone number
  │    └─ Listens for "ReceiveOtp" messages
  │         └─ Calls SmsSender.send()
  │
  └─ HttpServerService (Fallback)
       └─ HTTP endpoint on port 8080
            └─ GET /send-otp?varOTP=123456&receiver=+923001234567
```

## Next Steps (Optional)

1. **Move to Foreground Service**: Keep SignalR connection alive when app is backgrounded
2. **Add Authentication**: Secure the SignalR hub with JWT tokens
3. **Persist Device Registration**: Store device mappings in database
4. **Production Deployment**: Use HTTPS (wss://) for SignalR connections

## Support

If OTP still doesn't send:
1. Share backend logs: `docker logs techtorio-backend --tail 200 > backend-logs.txt`
2. Share Android Logcat: Filter by "SignalRClient" and "SmsSender"
3. Check database outbox messages: Query `OutboxMessages` table
