package com.techtorio.smswebhook;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.widget.Toast;

import com.microsoft.signalr.HubConnection;
import com.microsoft.signalr.HubConnectionBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.Map;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CompletableFuture;

public class SignalRClient {
    private static final String TAG = "SignalRClient";
    private static SignalRClient instance;
    private final Context context;
    private HubConnection hubConnection;
    private boolean started = false;
    // Simple log listeners for UI to subscribe and display logs
    public interface LogListener { void onLog(String message); }
    private final List<LogListener> listeners = new CopyOnWriteArrayList<>();

    public void addLogListener(LogListener l) { if (l != null) listeners.add(l); }
    public void removeLogListener(LogListener l) { if (l != null) listeners.remove(l); }
    private void notifyLog(String msg) {
        try {
            for (LogListener l : listeners) {
                try { l.onLog(msg); } catch (Exception ex) { /* swallow listener errors */ }
            }
        } catch (Exception ignore) {}
    }

    private SignalRClient(Context ctx) {
        this.context = ctx.getApplicationContext();
    }

    public static synchronized SignalRClient getInstance(Context ctx) {
        if (instance == null) instance = new SignalRClient(ctx);
        return instance;
    }

    private void showToast(String message) {
        new Handler(Looper.getMainLooper()).post(() -> {
            Toast.makeText(context, message, Toast.LENGTH_LONG).show();
        });
    }

    public synchronized void start() {
        if (started) {
            Log.i(TAG, "SignalR already started, skipping");
            return;
        }

        ConfigurationManager cfg = new ConfigurationManager(context);
        String hubUrl = cfg.getSignalRHubUrl();
        if (hubUrl == null || hubUrl.isEmpty()) {
            Log.w(TAG, "No hub URL configured; skipping SignalR connect. Configure Webhook URL in settings.");
            notifyLog("WARN: No hub URL configured; skipping SignalR connect.");
            showToast("SignalR: No backend URL configured");
            return;
        }

    final String finalHubUrl = hubUrl;
    Log.i(TAG, "Starting SignalR connection to: " + finalHubUrl);
    notifyLog("Starting SignalR connection to: " + finalHubUrl);

        try {
            hubConnection = HubConnectionBuilder.create(hubUrl).build();

            // Register handler for incoming OTPs
            hubConnection.on("ReceiveOtp", (payload) -> {
                try {
                    Log.i(TAG, "ReceiveOtp message received - payload type: " + (payload == null ? "null" : payload.getClass().getName()));
                    Log.d(TAG, "ReceiveOtp payload content: " + (payload == null ? "null" : payload.toString()));
                    notifyLog("ReceiveOtp received: " + (payload == null ? "null" : payload.toString()));
                    
                    String phone = null;
                    String otp = null;
                    String template = null;

                    // If SignalR delivered a Map-like object, extract keys directly
                    if (payload instanceof Map) {
                        Map<String, Object> map = (Map<String, Object>) payload;
                        Object p = map.get("phone");
                        Object o = map.get("otp");
                        Object t = map.get("template");
                        if (p != null) phone = p.toString();
                        if (o != null) otp = o.toString();
                        if (t != null) template = t.toString();
                    } else if (payload instanceof String) {
                        // Try parse JSON string
                        String raw = (String) payload;
                        try {
                            JsonElement el = JsonParser.parseString(raw);
                            if (el.isJsonObject()) {
                                JsonObject obj = el.getAsJsonObject();
                                if (obj.has("phone")) phone = obj.get("phone").getAsString();
                                if (obj.has("otp")) otp = obj.get("otp").getAsString();
                                if (obj.has("template")) template = obj.get("template").getAsString();
                            }
                        } catch (Exception e) {
                            // fall through - will be logged below
                        }
                    } else if (payload != null) {
                        // Try JSON parsing of payload.toString() as last resort
                        String raw = payload.toString();
                        try {
                            JsonElement el = JsonParser.parseString(raw);
                            if (el.isJsonObject()) {
                                JsonObject obj = el.getAsJsonObject();
                                if (obj.has("phone")) phone = obj.get("phone").getAsString();
                                if (obj.has("otp")) otp = obj.get("otp").getAsString();
                                if (obj.has("template")) template = obj.get("template").getAsString();
                            }
                        } catch (Exception e) {
                            // ignore
                        }
                    }

                    if (otp != null && phone != null) {
                        final String finalPhone = phone.replaceAll("[{}]", "");
                        final String finalOtp = otp.replaceAll("[{}]", "");
                        final String finalTemplate = template == null || template.isEmpty() ? "Your OTP is {varOTP}" : template;
                        String message = finalTemplate.replace("{varOTP}", finalOtp);

                        Log.i(TAG, "Processing OTP - Phone: " + finalPhone + ", OTP: " + finalOtp + ", Message: " + message);
                        notifyLog("Processing OTP for " + finalPhone + ": " + finalOtp);

                        Handler mainHandler = new Handler(Looper.getMainLooper());
                        mainHandler.post(() -> {
                            boolean ok = SmsSender.send(context, finalPhone, message, new ConfigurationManager(context).getPreferredSimSlot());
                            String resultMsg = ok ? "OTP sent from device to " + finalPhone : "Failed to send OTP to " + finalPhone;
                            Log.i(TAG, resultMsg);
                            notifyLog(resultMsg);
                            Toast.makeText(context, resultMsg, Toast.LENGTH_SHORT).show();
                        });
                    } else {
                        String errorMsg = "Received malformed ReceiveOtp payload - phone: " + phone + ", otp: " + otp;
                        Log.w(TAG, errorMsg);
                        notifyLog("WARN: " + errorMsg);
                        Handler mainHandler = new Handler(Looper.getMainLooper());
                        mainHandler.post(() -> {
                            Toast.makeText(context, "Invalid OTP payload", Toast.LENGTH_SHORT).show();
                        });
                    }
                } catch (Exception ex) {
                    Log.e(TAG, "Error handling ReceiveOtp", ex);
                    notifyLog("ERROR handling ReceiveOtp: " + ex.getMessage());
                }
            }, Object.class);

            hubConnection.onClosed(error -> {
                String msg = "SignalR connection closed: " + (error != null ? error.getMessage() : "none");
                Log.i(TAG, msg);
                notifyLog(msg);
                started = false;
                Handler mainHandler = new Handler(Looper.getMainLooper());
                mainHandler.post(() -> {
                    Toast.makeText(context, "SignalR disconnected", Toast.LENGTH_SHORT).show();
                });
            });

            // Start connection asynchronously
            CompletableFuture.runAsync(() -> {
                try {
                    Log.i(TAG, "Attempting SignalR connection...");
                    notifyLog("Attempting SignalR connection...");
                    hubConnection.start().blockingAwait();
                    
                    // After connect, invoke RegisterDevice with device id and phone number
                    String deviceId = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
                    ConfigurationManager cfgInner = new ConfigurationManager(context);
                    // Use OTP-specific device phone if configured; fall back to general phone number for compatibility
                    String phoneNumber = cfgInner.getOtpDevicePhone();
                    if (phoneNumber == null || phoneNumber.isEmpty()) phoneNumber = cfgInner.getPhoneNumber();
                    if (deviceId == null || deviceId.isEmpty()) deviceId = java.util.UUID.randomUUID().toString();
                    if (phoneNumber == null) phoneNumber = "";
                    
                    Log.i(TAG, "SignalR connected. Registering device - ID: " + deviceId + ", Phone: " + phoneNumber);
                    notifyLog("SignalR connected. Registering device - ID: " + deviceId + ", Phone: " + phoneNumber);
                    hubConnection.send("RegisterDevice", deviceId, phoneNumber);
                    started = true;
                    
                    Handler mainHandler = new Handler(Looper.getMainLooper());
                    mainHandler.post(() -> {
                        Toast.makeText(context, "SignalR connected ✓", Toast.LENGTH_SHORT).show();
                    });
                    
                    Log.i(TAG, "SignalR connected and RegisterDevice invoked for device: " + deviceId + ", phone: " + phoneNumber);
                    notifyLog("SignalR connected and RegisterDevice invoked for device: " + deviceId + ", phone: " + phoneNumber);
                } catch (Exception ex) {
                    Log.e(TAG, "SignalR start failed - URL: " + finalHubUrl, ex);
                    notifyLog("SignalR start failed: " + ex.getMessage());
                    started = false;
                    Handler mainHandler = new Handler(Looper.getMainLooper());
                    mainHandler.post(() -> {
                        Toast.makeText(context, "SignalR failed: " + ex.getMessage(), Toast.LENGTH_LONG).show();
                    });
                }
            });

        } catch (Exception ex) {
            Log.e(TAG, "Failed to create SignalR hub connection", ex);
        }
    }

    public synchronized void stop() {
        if (!started || hubConnection == null) return;
        try {
            hubConnection.stop();
        } catch (Exception ex) {
            Log.w(TAG, "Error stopping SignalR connection", ex);
        }
        started = false;
    }

    public boolean isStarted() { return started; }
}
