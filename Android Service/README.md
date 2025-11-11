# SMS Webhook Service

A powerful Android service that monitors incoming SMS messages from a specified phone number, checks for specific keywords/phrases, and posts matching messages to a webhook URL with comprehensive logging and activity tracking. It also includes a feature to send OTP messages.

## Features

- **SMS Monitoring**: Monitor SMS from a specific phone number
- **Keyword Filtering**: Filter SMS by keyword or phrase (case-insensitive)
- **Webhook Integration**: Post matching SMS to webhook URL with custom header
- **OTP Sender**: Manually send OTP messages to any phone number.
- **Activity Logging**: Comprehensive log viewer showing all SMS activity and webhook responses
- **Real-time Stats**: View statistics on SMS received, matched, and webhook success/error rates
- **Response Viewer**: See detailed webhook responses with status codes
- **Notifications**: Get notified when webhook responses are received
- **User-friendly UI**: Clean, modern interface with easy navigation and tabs for each feature.
- **Secure Authentication**: X-Webhook-Secret header for webhook security

## Setup

1. Open the project in Android Studio
2. Sync Gradle files
3. Build and install on your Android device (API 26+)

## Usage

The application has two main features, each in its own tab.

### SMS Webhook

1. Launch the app and go to the "SMS Webhook" tab.
2. Grant SMS permissions when prompted.
3. Configure the following:
   - **Phone Number**: The phone number to monitor (e.g., +1234567890)
   - **Keyword/Phrase**: The text to search for in SMS messages
   - **Webhook URL**: The endpoint where SMS will be posted
   - **Secret Key**: The value for X-Webhook-Secret header
4. Click "Save Configuration"
5. The service will automatically monitor incoming SMS and post matching messages.
6. View activity logs by clicking "View Logs" button.
7. Check statistics on the main screen showing SMS and webhook activity.
8. Tap webhook response notifications to see detailed server responses.

### OTP Sender

1.  Navigate to the "OTP Sender" tab.
2.  Grant SMS permissions if you haven't already.
3.  Enter the recipient's phone number.
4.  Enter the OTP message you want to send.
5.  Click "Send SMS".

## How It Works

### SMS Webhook
- The app registers a BroadcastReceiver that listens for incoming SMS
- When an SMS is received from the configured phone number and contains the keyword/phrase, it posts the SMS body to the webhook URL
- The POST request includes:
  - **Body**: JSON format with `{"sms": "message text"}`
  - **Header**: `X-Webhook-Secret: [your secret key]`
  - **Content-Type**: `application/json; charset=UTF-8`

### OTP Sender
- The app uses the device's `SmsManager` to send an SMS directly from the device.

## Permissions

- `RECEIVE_SMS`: To receive SMS broadcasts
- `READ_SMS`: To read SMS content
- `SEND_SMS`: To send OTP messages.
- `INTERNET`: To post to webhook URL

## Activity Logs

The app maintains a comprehensive log of all activities:
- **SMS_RECEIVED**: All incoming SMS messages (from any number)
- **SMS_MATCHED**: SMS that matched your criteria (from configured number + keyword)
- **WEBHOOK_SUCCESS**: Successful webhook calls (HTTP 200-299)
- **WEBHOOK_ERROR**: Failed webhook calls or errors

Logs are displayed in a color-coded list with timestamps and can be:
- Viewed in real-time (auto-refreshes every 2 seconds)
- Cleared via the menu or button
- Scrolled to see full message details

## Statistics

The main screen displays real-time statistics:
- Total SMS received
- SMS matched (that triggered webhook)
- Webhook success count
- Webhook error count

## Notes

- The service runs automatically in the background once configured
- Phone number matching is flexible and handles different formats
- Keyword matching is case-insensitive
- Configuration is stored locally using SharedPreferences
- Logs are stored locally (last 500 entries)
- Webhook responses are shown via notifications and can be viewed in detail
- The log viewer auto-refreshes when active
