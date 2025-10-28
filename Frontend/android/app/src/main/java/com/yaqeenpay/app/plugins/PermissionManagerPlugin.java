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
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        }, alias = "all")
    }
)
public class PermissionManagerPlugin extends Plugin {

    // Only location permissions for now
    private static final String[] LOCATION_PERMISSIONS = {
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    };

    @PluginMethod
    public void checkAllPermissions(PluginCall call) {
        JSObject permissions = new JSObject();
        
        // Only check location permissions for now
        permissions.put("location", checkPermissionGroup(LOCATION_PERMISSIONS));

        JSObject result = new JSObject();
        result.put("permissions", permissions);
        call.resolve(result);
    }

    @PluginMethod
    public void requestAllPermissions(PluginCall call) {
        // Only request location permissions for now
        String[] permissionsArray = LOCATION_PERMISSIONS;
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