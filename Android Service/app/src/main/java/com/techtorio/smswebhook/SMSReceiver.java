package com.techtorio.smswebhook;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

public class SMSReceiver extends BroadcastReceiver {
    private static final String TAG = "SMSReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            return;
        }

        ConfigurationManager configManager = new ConfigurationManager(context);
        LogManager logManager = new LogManager(context);

        if (!configManager.isConfigured()) {
            Log.d(TAG, "Service not configured, ignoring SMS");
            return;
        }

    java.util.List<String> targetPhoneNumbers = configManager.getPhoneNumbers();
    java.util.List<String> keywords = configManager.getKeywords();

        Bundle bundle = intent.getExtras();
        if (bundle == null) {
            return;
        }

        Object[] pdus = (Object[]) bundle.get("pdus");
        if (pdus == null) {
            return;
        }

        for (Object pdu : pdus) {
            SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
            String senderNumber = smsMessage.getDisplayOriginatingAddress();
            String messageBody = smsMessage.getMessageBody();

            if (messageBody == null) { // A message body is required for keyword matching
                continue;
            }
            
            Log.d(TAG, "Received SMS from: " + senderNumber);
            Log.d(TAG, "Message: " + messageBody);

            // Log all received SMS
            logManager.addLog("SMS_RECEIVED",
                "SMS from " + senderNumber,
                "Message: " + messageBody);

            // Check phone number match (if no configured phone numbers -> match all)
            boolean phoneMatches = false;
            if (targetPhoneNumbers == null || targetPhoneNumbers.isEmpty()) {
                phoneMatches = true;
            } else {
                String normalizedSender = normalizePhoneNumber(senderNumber);
                for (String targetPhoneNumber : targetPhoneNumbers) {
                    String normalizedTarget = normalizePhoneNumber(targetPhoneNumber);
                    Log.d(TAG, "Comparing numbers - Sender: " + normalizedSender + ", Target: " + normalizedTarget);

                    if (normalizedSender == null || normalizedTarget == null) continue;

                    String senderDigits = normalizedSender.replace("+", "").trim();
                    String targetDigits = normalizedTarget.replace("+", "").trim();

                    // Exact or normalized match
                    if (senderDigits.equals(targetDigits) || normalizedSender.equals(normalizedTarget)) {
                        phoneMatches = true;
                        break;
                    }

                    // Ends-with matches to handle country code differences
                    if (senderDigits.endsWith(targetDigits) || targetDigits.endsWith(senderDigits) ||
                        normalizedSender.endsWith(normalizedTarget) || normalizedTarget.endsWith(normalizedSender)) {
                        phoneMatches = true;
                        break;
                    }

                    // Match last N digits where N is the shorter length
                    if (senderDigits.length() > 0 && targetDigits.length() > 0) {
                        int minLength = Math.min(senderDigits.length(), targetDigits.length());
                        String senderEnd = senderDigits.substring(Math.max(0, senderDigits.length() - minLength));
                        String targetEnd = targetDigits.substring(Math.max(0, targetDigits.length() - minLength));
                        if (senderEnd.equals(targetEnd)) {
                            phoneMatches = true;
                            break;
                        }
                    }
                }

                if (!phoneMatches) {
                    Log.d(TAG, "Phone number does not match any configured number. Sender: " + normalizedSender);
                }
            }

            if (phoneMatches) {
                Log.d(TAG, "Phone number matches (or not required)! Checking keyword(s)...");

                String trimmedMessage = messageBody.trim();

                boolean keywordMatches = false;
                // If no keywords configured, match all messages from the allowed numbers
                if (keywords == null || keywords.isEmpty()) {
                    keywordMatches = true;
                } else {
                    for (String kw : keywords) {
                        String tkw = kw.trim();
                        if (tkw.isEmpty()) continue;
                        if (trimmedMessage.toLowerCase().contains(tkw.toLowerCase())) {
                            keywordMatches = true;
                            break;
                        }
                    }
                }

                if (keywordMatches) {
                    Log.d(TAG, "SMS matches criteria, posting to webhook");
                    logManager.addLog("SMS_MATCHED",
                        "SMS matched criteria from " + senderNumber,
                        "Keywords: '" + String.join(",", keywords == null ? new java.util.ArrayList<>() : keywords) + "'\nMessage: " + messageBody);
                    WebhookService.postSMS(context, messageBody);
                } else {
                    Log.d(TAG, "Keyword(s) do not match. Message: '" + trimmedMessage + "', Keywords: '" + String.join(",", keywords == null ? new java.util.ArrayList<>() : keywords) + "'");
                }
            }
        }
    }

    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return null;
        }
        // Remove all non-digit characters except +
        return phoneNumber.replaceAll("[^0-9+]", "");
    }
}
