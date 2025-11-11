package com.techtorio.smswebhook;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * Foreground service that maintains a persistent SignalR connection to the backend.
 * This ensures the device stays connected to receive OTP messages even when the app is closed.
 */
public class SignalRService extends Service implements SignalRClient.LogListener {
    private static final String TAG = "SignalRService";
    private static final int NOTIFICATION_ID = 1001;
    private static final String CHANNEL_ID = "signalr_service_channel";
    
    private SignalRClient signalRClient;
    private String lastStatus = "Starting...";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "SignalR Service created");
        
        // Create notification channel for Android O and above
        createNotificationChannel();
        
        // Start as foreground service with notification
        startForeground(NOTIFICATION_ID, buildNotification("Connecting to backend..."));
        
        // Initialize SignalR client
        signalRClient = SignalRClient.getInstance(this);
        signalRClient.addLogListener(this);
        
        // Start SignalR connection
        signalRClient.start();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "SignalR Service started");
        
        // Ensure SignalR is connected
        if (signalRClient != null && !signalRClient.isStarted()) {
            signalRClient.start();
        }
        
        // Return START_STICKY so service restarts if killed by system
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.i(TAG, "SignalR Service destroyed");
        
        if (signalRClient != null) {
            signalRClient.removeLogListener(this);
            signalRClient.stop();
        }
        
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        // We don't provide binding
        return null;
    }

    @Override
    public void onLog(String message) {
        // Update notification when SignalR status changes
        if (message.contains("connected")) {
            lastStatus = "Connected ✓";
            updateNotification("Connected to backend");
        } else if (message.contains("failed") || message.contains("ERROR")) {
            lastStatus = "Connection failed";
            updateNotification("Connection error - retrying...");
        } else if (message.contains("disconnect") || message.contains("closed")) {
            lastStatus = "Disconnected";
            updateNotification("Disconnected - reconnecting...");
        } else if (message.contains("ReceiveOtp")) {
            updateNotification("Processing OTP...");
        } else if (message.contains("SMS sent")) {
            updateNotification("Connected - Last: SMS sent");
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "SignalR Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps the app connected to receive OTP messages");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification(String contentText) {
        // Intent to open app when notification is tapped
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("TechTorio SMS Gateway")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }

    private void updateNotification(String contentText) {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification(contentText));
        }
    }
}
