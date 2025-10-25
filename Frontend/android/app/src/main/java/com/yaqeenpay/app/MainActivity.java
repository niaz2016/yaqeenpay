package com.yaqeenpay.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.yaqeenpay.app.plugins.SmsReaderPlugin;
import com.yaqeenpay.app.plugins.PermissionManagerPlugin;

public class MainActivity extends BridgeActivity {
    
    private static final int PERMISSION_REQUEST_CODE = 1000;
    
    // Critical permissions that should be requested on startup
    private static final String[] CRITICAL_PERMISSIONS = {
        Manifest.permission.CAMERA,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.READ_SMS,
        Manifest.permission.POST_NOTIFICATIONS
    };
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register custom plugins
        registerPlugin(SmsReaderPlugin.class);
        registerPlugin(PermissionManagerPlugin.class);
        
        // Request critical permissions on startup
        requestCriticalPermissions();
    }
    
    private void requestCriticalPermissions() {
        // Check which permissions are not granted
        java.util.List<String> permissionsToRequest = new java.util.ArrayList<>();
        
        for (String permission : CRITICAL_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission);
            }
        }
        
        // Request missing permissions
        if (!permissionsToRequest.isEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toArray(new String[0]),
                PERMISSION_REQUEST_CODE
            );
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            // Log permission results
            for (int i = 0; i < permissions.length; i++) {
                boolean granted = grantResults[i] == PackageManager.PERMISSION_GRANTED;
                android.util.Log.d("YaqeenPay", "Permission " + permissions[i] + " granted: " + granted);
            }
        }
    }
}
