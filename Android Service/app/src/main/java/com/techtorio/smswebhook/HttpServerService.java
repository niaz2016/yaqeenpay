package com.techtorio.smswebhook;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class HttpServerService extends Service {
    private static final String CHANNEL_ID = "otp_server_channel";
    private static final int NOTIF_ID = 2001;
    private static final int PORT = 8080;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private ExecutorService executor;
    private ServerSocket serverSocket;
    // Simple in-memory rate limits
    private final Map<String, Deque<Long>> perNumberTimestamps = new HashMap<>();
    private final Deque<Long> deviceTimestamps = new ArrayDeque<>();

    public static void start(Context context) {
        Intent i = new Intent(context, HttpServerService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(i);
        } else {
            context.startService(i);
        }
    }

    public static void stop(Context context) {
        context.stopService(new Intent(context, HttpServerService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        executor = Executors.newCachedThreadPool();
        createNotificationChannel();
        startForeground(NOTIF_ID, buildNotification());
        startServer();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopServer();
        if (executor != null) executor.shutdownNow();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "OTP Server", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Runs LAN-only OTP testing endpoint");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("OTP Sender - LAN endpoint")
                .setContentText("Listening on port 8080 for /send-otp (testing only)")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setOngoing(true)
                .build();
    }

    private void startServer() {
        if (running.get()) return;
        running.set(true);
        executor.execute(() -> {
            try {
                serverSocket = new ServerSocket(PORT);
                while (running.get()) {
                    Socket socket = serverSocket.accept();
                    executor.execute(() -> handleClient(socket));
                }
            } catch (IOException ignored) {
            } finally {
                stopSelf();
            }
        });
    }

    private void stopServer() {
        running.set(false);
        try {
            if (serverSocket != null) serverSocket.close();
        } catch (IOException ignored) { }
    }

    private void handleClient(Socket socket) {
        try (BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
             PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8)))) {

            String requestLine = in.readLine();
            if (requestLine == null || requestLine.isEmpty()) {
                sendResponse(out, 400, jsonError("invalid_request"));
                return;
            }
            String method;
            String pathWithQuery;
            String[] parts = requestLine.split(" ");
            method = parts[0];
            pathWithQuery = parts.length > 1 ? parts[1] : "/";

            Map<String, String> headers = new HashMap<>();
            String line;
            while ((line = in.readLine()) != null && !line.isEmpty()) {
                int idx = line.indexOf(':');
                if (idx > 0) {
                    String k = line.substring(0, idx).trim();
                    String v = line.substring(idx + 1).trim();
                    headers.put(k.toLowerCase(Locale.ROOT), v);
                }
            }

            if (!"GET".equalsIgnoreCase(method)) {
                sendResponse(out, 405, jsonError("method_not_allowed"));
                return;
            }

            if (!pathWithQuery.startsWith("/send-otp")) {
                sendResponse(out, 404, jsonError("not_found"));
                return;
            }

            ConfigurationManager cfg = new ConfigurationManager(this);
            if (!cfg.isLanEndpointEnabled()) {
                sendResponse(out, 403, jsonError("forbidden"));
                return;
            }

            String secret = cfg.getSecretKey();
            String headerSecret = headers.getOrDefault("x-webhook-secret", "");
            if (secret == null || secret.isEmpty() || !secret.equals(headerSecret)) {
                sendResponse(out, 401, jsonError("unauthorized"));
                return;
            }

            Map<String, String> query = parseQuery(pathWithQuery);
            String otp = getParamCaseInsensitive(query, "varOTP", "otp");
            String receiver = getParamCaseInsensitive(query, "receiver", "to");
            if (otp == null || otp.isEmpty() || receiver == null || receiver.isEmpty()) {
                sendResponse(out, 400, jsonError("invalid_parameter"));
                return;
            }

            if (cfg.isHmacRequired()) {
                String signature = headers.getOrDefault("x-signature", "");
                String canonical = "otp=" + otp + "&to=" + receiver;
                String expected = hmacSha256Hex(secret, canonical);
                if (signature == null || signature.isEmpty() || !signature.equalsIgnoreCase(expected)) {
                    sendResponse(out, 401, jsonError("unauthorized"));
                    return;
                }
            }

            String normalized = PhoneNormalizer.normalizePhone(receiver, cfg.getDefaultCountryCode());
            String template = cfg.getOtpTemplate();
            String message = template.replace("{varOTP}", otp);

            // Rate limits: 5 per 5 minutes per number, 60 per hour per device
            long now = System.currentTimeMillis();
            if (isRateLimited(normalized, now)) {
                sendResponse(out, 429, "{\"error\":\"rate_limited\"}");
                return;
            }

            boolean sent = SmsSender.send(this, normalized, message, cfg.getPreferredSimSlot());
            if (sent) {
                sendResponse(out, 200, "{\"status\":\"queued\"}");
            } else {
                sendResponse(out, 500, jsonError("internal_error"));
            }

        } catch (Exception ignored) {
        } finally {
            try {
                socket.close();
            } catch (IOException ignored) { }
        }
    }

    private synchronized boolean isRateLimited(String number, long now) {
        // Per-number
        Deque<Long> q = perNumberTimestamps.get(number);
        if (q == null) {
            q = new ArrayDeque<>();
            perNumberTimestamps.put(number, q);
        }
        prune(q, now - 5 * 60_000L);
        if (q.size() >= 5) return true;

        // Per-device
        prune(deviceTimestamps, now - 60 * 60_000L);
        if (deviceTimestamps.size() >= 60) return true;

        q.addLast(now);
        deviceTimestamps.addLast(now);
        return false;
    }

    private void prune(Deque<Long> q, long threshold) {
        while (!q.isEmpty() && q.peekFirst() < threshold) q.removeFirst();
    }

    private static Map<String, String> parseQuery(String pathWithQuery) throws Exception {
        Map<String, String> map = new HashMap<>();
        String[] split = pathWithQuery.split("\\?", 2);
        if (split.length < 2) return map;
        String qs = split[1];
        for (String pair : qs.split("&")) {
            int idx = pair.indexOf('=');
            if (idx > 0) {
                String k = URLDecoder.decode(pair.substring(0, idx), "UTF-8");
                String v = URLDecoder.decode(pair.substring(idx + 1), "UTF-8");
                map.put(k, v);
            }
        }
        return map;
    }

    private static String getParamCaseInsensitive(Map<String, String> q, String primary, String alt) {
        for (Map.Entry<String, String> e : q.entrySet()) {
            String k = e.getKey();
            if (k.equalsIgnoreCase(primary) || k.equalsIgnoreCase(alt)) {
                return e.getValue();
            }
        }
        return null;
    }

    private static String hmacSha256Hex(String secret, String data) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] out = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : out) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private static void sendResponse(PrintWriter out, int code, String body) {
        String statusText;
        switch (code) {
            case 200: statusText = "OK"; break;
            case 400: statusText = "Bad Request"; break;
            case 401: statusText = "Unauthorized"; break;
            case 403: statusText = "Forbidden"; break;
            case 404: statusText = "Not Found"; break;
            case 405: statusText = "Method Not Allowed"; break;
            default: statusText = "Internal Server Error"; break;
        }
        out.print("HTTP/1.1 " + code + " " + statusText + "\r\n");
        out.print("Content-Type: application/json; charset=utf-8\r\n");
        out.print("Connection: close\r\n");
        out.print("Content-Length: " + body.getBytes(StandardCharsets.UTF_8).length + "\r\n");
        out.print("\r\n");
        out.print(body);
        out.flush();
    }

    private static String jsonError(String code) {
        return "{\"error\":\"" + code + "\"}";
    }
}


