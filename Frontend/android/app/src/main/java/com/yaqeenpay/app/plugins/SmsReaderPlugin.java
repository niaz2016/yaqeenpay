package com.yaqeenpay.app.plugins;

import android.Manifest;
import android.content.ContentResolver;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Telephony;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import org.json.JSONException;

@CapacitorPlugin(
    name = "SmsReader",
    permissions = {
        @Permission(strings = {Manifest.permission.READ_SMS}, alias = "sms")
    }
)
public class SmsReaderPlugin extends Plugin {

    @PluginMethod
    public void checkPermission(PluginCall call) {
        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            requestPermissionForAlias("sms", call, "permissionCallback");
        }
    }

    @PluginMethod
    public void readSmsMessages(PluginCall call) {
        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("SMS permission not granted");
            return;
        }

        try {
            Integer maxResults = call.getInt("maxResults", 10);
            String box = call.getString("box", "inbox");
            Boolean readStatus = call.getBoolean("read");

            JSArray smsArray = readSms(maxResults, box, readStatus);
            
            JSObject ret = new JSObject();
            ret.put("messages", smsArray);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error reading SMS messages: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getRecentSmsMessages(PluginCall call) {
        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("SMS permission not granted");
            return;
        }

        try {
            Integer count = call.getInt("count", 10);
            JSArray smsArray = readSms(count, "inbox", null);
            
            JSObject ret = new JSObject();
            ret.put("messages", smsArray);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error reading recent SMS messages: " + e.getMessage());
        }
    }

    private JSArray readSms(int maxResults, String box, Boolean readStatus) throws JSONException {
        ContentResolver contentResolver = getContext().getContentResolver();
        Uri smsUri;

        switch (box.toLowerCase()) {
            case "sent":
                smsUri = Telephony.Sms.Sent.CONTENT_URI;
                break;
            case "draft":
                smsUri = Telephony.Sms.Draft.CONTENT_URI;
                break;
            case "outbox":
                smsUri = Telephony.Sms.Outbox.CONTENT_URI;
                break;
            default:
                smsUri = Telephony.Sms.Inbox.CONTENT_URI;
        }

        String[] projection = {
            Telephony.Sms._ID,
            Telephony.Sms.ADDRESS,
            Telephony.Sms.BODY,
            Telephony.Sms.DATE,
            Telephony.Sms.READ,
            Telephony.Sms.STATUS,
            Telephony.Sms.TYPE
        };

        String selection = null;
        String[] selectionArgs = null;

        if (readStatus != null) {
            selection = Telephony.Sms.READ + " = ?";
            selectionArgs = new String[]{readStatus ? "1" : "0"};
        }

        String sortOrder = Telephony.Sms.DATE + " DESC LIMIT " + maxResults;

        JSArray smsArray = new JSArray();

        try (Cursor cursor = contentResolver.query(smsUri, projection, selection, selectionArgs, sortOrder)) {
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    JSObject smsObject = new JSObject();
                    
                    smsObject.put("id", cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms._ID)));
                    smsObject.put("address", cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)));
                    smsObject.put("body", cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.BODY)));
                    smsObject.put("date", cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Sms.DATE)));
                    smsObject.put("read", cursor.getInt(cursor.getColumnIndexOrThrow(Telephony.Sms.READ)) == 1);
                    smsObject.put("status", cursor.getInt(cursor.getColumnIndexOrThrow(Telephony.Sms.STATUS)));
                    smsObject.put("type", cursor.getInt(cursor.getColumnIndexOrThrow(Telephony.Sms.TYPE)));
                    
                    smsArray.put(smsObject);
                }
            }
        }

        return smsArray;
    }

    private void permissionCallback(PluginCall call) {
        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            call.resolve(ret);
        }
    }
}