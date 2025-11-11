package com.techtorio.smswebhook;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class LogManager {
    private static final String PREFS_NAME = "SMSWebhookLogs";
    private static final String KEY_LOGS = "logs";
    private static final int MAX_LOGS = 500; // Keep last 500 logs

    private SharedPreferences prefs;
    private SimpleDateFormat dateFormat;

    public LogManager(Context context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
    }

    public void addLog(String type, String message, String details) {
        try {
            JSONObject logEntry = new JSONObject();
            logEntry.put("timestamp", System.currentTimeMillis());
            logEntry.put("time", dateFormat.format(new Date()));
            logEntry.put("type", type); // SMS_RECEIVED, SMS_MATCHED, WEBHOOK_SUCCESS, WEBHOOK_ERROR
            logEntry.put("message", message);
            logEntry.put("details", details != null ? details : "");

            JSONArray logs = getLogsArray();
            logs.put(logEntry);

            // Keep only last MAX_LOGS entries
            if (logs.length() > MAX_LOGS) {
                JSONArray newLogs = new JSONArray();
                for (int i = logs.length() - MAX_LOGS; i < logs.length(); i++) {
                    newLogs.put(logs.get(i));
                }
                logs = newLogs;
            }

            SharedPreferences.Editor editor = prefs.edit();
            editor.putString(KEY_LOGS, logs.toString());
            editor.apply();
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public List<LogEntry> getAllLogs() {
        List<LogEntry> logList = new ArrayList<>();
        try {
            JSONArray logs = getLogsArray();
            for (int i = logs.length() - 1; i >= 0; i--) { // Reverse order (newest first)
                JSONObject logObj = logs.getJSONObject(i);
                LogEntry entry = new LogEntry(
                    logObj.getLong("timestamp"),
                    logObj.getString("time"),
                    logObj.getString("type"),
                    logObj.getString("message"),
                    logObj.getString("details")
                );
                logList.add(entry);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return logList;
    }

    public void clearLogs() {
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(KEY_LOGS, new JSONArray().toString());
        editor.apply();
    }

    private JSONArray getLogsArray() {
        String logsJson = prefs.getString(KEY_LOGS, "[]");
        try {
            return new JSONArray(logsJson);
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    public static class LogEntry {
        public long timestamp;
        public String time;
        public String type;
        public String message;
        public String details;

        public LogEntry(long timestamp, String time, String type, String message, String details) {
            this.timestamp = timestamp;
            this.time = time;
            this.type = type;
            this.message = message;
            this.details = details;
        }
    }
}

