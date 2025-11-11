package com.techtorio.smswebhook;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class WebhookService {
    private static final String TAG = "WebhookService";
    private static final String CHANNEL_ID = "webhook_responses";

    public static void postSMS(Context context, String smsBody) {
        ConfigurationManager configManager = new ConfigurationManager(context);
        LogManager logManager = new LogManager(context);
        String webhookUrl = configManager.getWebhookUrl();
        String secretKey = configManager.getSecretKey();

        if (webhookUrl.isEmpty() || secretKey.isEmpty()) {
            Log.e(TAG, "Webhook URL or Secret Key not configured");
            logManager.addLog("WEBHOOK_ERROR", "Webhook not configured", "Missing URL or Secret Key");
            return;
        }

        // Create notification channel for Android 8.0+
        createNotificationChannel(context);

        new PostWebhookTask(context, logManager).execute(webhookUrl, secretKey, smsBody);
    }

    private static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Webhook Responses";
            String description = "Notifications for SMS webhook post responses";
            int importance = NotificationManager.IMPORTANCE_DEFAULT;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private static class PostWebhookTask extends AsyncTask<String, Void, String> {
        private final Context context;
        private final LogManager logManager;
        private int responseCode;
        private boolean isSuccess;

        PostWebhookTask(Context context, LogManager logManager) {
            this.context = context;
            this.logManager = logManager;
        }

        @Override
        protected String doInBackground(String... params) {
            String webhookUrl = params[0];
            String secretKey = params[1];
            String smsBody = params[2];
            HttpURLConnection connection = null;
            String response;

            try {
                URL url = new URL(webhookUrl);
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                connection.setRequestProperty("X-Webhook-Secret", secretKey);
                connection.setDoOutput(true);
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);

                // Create JSON body with "sms" key
                String jsonBody = "{\"sms\":\"" + escapeJsonString(smsBody) + "\"}";
                
                try (OutputStream os = connection.getOutputStream()) {
                    byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                responseCode = connection.getResponseCode();
                isSuccess = responseCode >= 200 && responseCode < 300;
                Log.d(TAG, "Webhook response code: " + responseCode);

                InputStream inputStream = (responseCode >= 200 && responseCode < 400) ? connection.getInputStream() : connection.getErrorStream();

                StringBuilder responseBuilder = new StringBuilder();
                if (inputStream != null) {
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            responseBuilder.append(line).append('\n');
                        }
                    }
                }
                response = "Response Code: " + responseCode + "\n\n" + responseBuilder.toString();

            } catch (IOException e) {
                Log.e(TAG, "Error posting to webhook: " + e.getMessage(), e);
                response = "Error: " + e.getMessage();
                isSuccess = false;
                responseCode = -1;
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
            return response;
        }

        @Override
        protected void onPostExecute(String result) {
            if (logManager != null && result != null) {
                if (isSuccess) {
                    logManager.addLog("WEBHOOK_SUCCESS", 
                        "Webhook call successful (Code: " + responseCode + ")", 
                        result);
                } else {
                    logManager.addLog("WEBHOOK_ERROR", 
                        "Webhook call failed (Code: " + responseCode + ")", 
                        result);
                }
            }

            if (context != null && result != null) {
                showResponseNotification(context, result);
            }
        }

        private void showResponseNotification(Context context, String response) {
            // Create an explicit intent for an Activity in your app
            Intent intent = new Intent(context, ResponseActivity.class);
            intent.putExtra(ResponseActivity.EXTRA_RESPONSE, response);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle("Webhook Response Received")
                    .setContentText("Tap to view the full response from the server.")
                    .setStyle(new NotificationCompat.BigTextStyle()
                            .bigText(response.length() > 100 ? response.substring(0, 100) + "..." : response))
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setContentIntent(pendingIntent)
                    .setAutoCancel(true);

            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);

            // notificationId is a unique int for each notification that you must define
            int notificationId = (int) System.currentTimeMillis();
            try {
                notificationManager.notify(notificationId, builder.build());
            } catch (SecurityException e) {
                Log.e(TAG, "Failed to show notification. Did you grant POST_NOTIFICATIONS permission?", e);
            }
        }

        private String escapeJsonString(String str) {
            if (str == null) {
                return "";
            }
            return str.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
        }
    }
}
