package com.techtorio.smswebhook;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * Starts the SignalR service when the device boots up.
 * This ensures the app stays connected even after device restarts.
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.i(TAG, "Boot completed - starting SignalR service");
            
            // Check if backend URL is configured before starting service
            ConfigurationManager config = new ConfigurationManager(context);
            String backendUrl = config.getBackendUrl();
            
            if (backendUrl != null && !backendUrl.isEmpty()) {
                Intent serviceIntent = new Intent(context, SignalRService.class);
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
                
                Log.i(TAG, "SignalR service started on boot");
            } else {
                Log.w(TAG, "Backend URL not configured - skipping service start");
            }
        }
    }
}
