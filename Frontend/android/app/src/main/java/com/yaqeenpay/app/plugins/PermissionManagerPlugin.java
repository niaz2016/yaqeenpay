package com.yaqeenpay.app.plugins;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.Settings;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(
    name = "PermissionManager",
    permissions = {
        @Permission(strings = {
            Manifest.permission.READ_SMS,
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.SEND_SMS,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.WRITE_CONTACTS,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.POST_NOTIFICATIONS
        }, alias = "all")
    }
)
public class PermissionManagerPlugin extends Plugin {

    private static final String[] SMS_PERMISSIONS = {
        Manifest.permission.READ_SMS,
        Manifest.permission.RECEIVE_SMS,
        Manifest.permission.SEND_SMS
    };

    private static final String[] LOCATION_PERMISSIONS = {
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    };

    private static final String[] CONTACT_PERMISSIONS = {
        Manifest.permission.READ_CONTACTS,
        Manifest.permission.WRITE_CONTACTS
    };

    private static final String[] PHONE_PERMISSIONS = {
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.CALL_PHONE
    };

    private static final String[] STORAGE_PERMISSIONS = {
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE
    };

    private static final String[] CAMERA_PERMISSIONS = {
        Manifest.permission.CAMERA
    };

    private static final String[] NOTIFICATION_PERMISSIONS = {
        Manifest.permission.POST_NOTIFICATIONS
    };

    private static final String[] MICROPHONE_PERMISSIONS = {
        Manifest.permission.RECORD_AUDIO
    };

    @PluginMethod
    public void checkAllPermissions(PluginCall call) {
        JSObject permissions = new JSObject();
        
        permissions.put("sms", checkPermissionGroup(SMS_PERMISSIONS));
        permissions.put("location", checkPermissionGroup(LOCATION_PERMISSIONS));
        permissions.put("contacts", checkPermissionGroup(CONTACT_PERMISSIONS));
        permissions.put("phone", checkPermissionGroup(PHONE_PERMISSIONS));
        permissions.put("storage", checkPermissionGroup(STORAGE_PERMISSIONS));
        permissions.put("camera", checkPermissionGroup(CAMERA_PERMISSIONS));
        permissions.put("notifications", checkPermissionGroup(NOTIFICATION_PERMISSIONS));
        permissions.put("microphone", checkPermissionGroup(MICROPHONE_PERMISSIONS));

        JSObject result = new JSObject();
        result.put("permissions", permissions);
        call.resolve(result);
    }

    @PluginMethod
    public void requestAllPermissions(PluginCall call) {
        List<String> allPermissions = new ArrayList<>();
        
        // Add all permissions to request
        for (String permission : SMS_PERMISSIONS) {
            allPermissions.add(permission);
        }
        for (String permission : LOCATION_PERMISSIONS) {
            allPermissions.add(permission);
        }
        for (String permission : CONTACT_PERMISSIONS) {
            allPermissions.add(permission);
        }
        for (String permission : PHONE_PERMISSIONS) {
            allPermissions.add(permission);
        }
        for (String permission : STORAGE_PERMISSIONS) {
            allPermissions.add(permission);
        }
        for (String permission : CAMERA_PERMISSIONS) {
            allPermissions.add(permission);
        }
        for (String permission : NOTIFICATION_PERMISSIONS) {
            allPermissions.add(permission);
        }
        for (String permission : MICROPHONE_PERMISSIONS) {
            allPermissions.add(permission);
        }

        String[] permissionsArray = allPermissions.toArray(new String[0]);
        requestPermissionForAliases(permissionsArray, call, "allPermissionsCallback");
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        String permission = call.getString("permission");
        if (permission == null) {
            call.reject("Permission name is required");
            return;
        }

        if (ContextCompat.checkSelfPermission(getContext(), permission) == PackageManager.PERMISSION_GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
        } else {
            requestPermissionForAlias(permission, call, "singlePermissionCallback");
        }
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        Uri uri = Uri.fromParts("package", getContext().getPackageName(), null);
        intent.setData(uri);
        
        try {
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open app settings: " + e.getMessage());
        }
    }

    private JSObject checkPermissionGroup(String[] permissions) {
        JSObject status = new JSObject();
        
        boolean allGranted = true;
        boolean anyDenied = false;
        boolean anyAsked = false;
        
        for (String permission : permissions) {
            int permissionStatus = ContextCompat.checkSelfPermission(getContext(), permission);
            if (permissionStatus != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                // If permission was denied and rationale should be shown, mark as denied
                if (ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), permission)) {
                    anyDenied = true;
                }
                anyAsked = true;
            }
        }
        
        // If permissions were not granted but also not explicitly denied,
        // they might just not have been asked yet
        if (!allGranted && !anyDenied) {
            anyAsked = false; // Haven't been asked yet
        }
        
        status.put("granted", allGranted);
        status.put("denied", anyDenied);
        status.put("asked", allGranted || anyDenied || anyAsked);
        
        return status;
    }

    private void allPermissionsCallback(PluginCall call) {
        // After requesting all permissions, check their status
        checkAllPermissions(call);
    }

    private void singlePermissionCallback(PluginCall call) {
        String permission = call.getString("permission");
        boolean granted = ContextCompat.checkSelfPermission(getContext(), permission) == PackageManager.PERMISSION_GRANTED;
        
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }
}