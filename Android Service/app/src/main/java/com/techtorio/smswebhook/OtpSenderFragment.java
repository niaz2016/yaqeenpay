package com.techtorio.smswebhook;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.text.method.ScrollingMovementMethod;
import android.widget.TextView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;

public class OtpSenderFragment extends Fragment {

    private EditText etBackendUrl;
    private EditText etOtpTemplate;
    private EditText etDefaultCountryCode;
    private EditText etOtpDevicePhone;
    private EditText etOtpTestReceiver;
    private EditText etSimSlot;
    private CheckBox cbEnableLanEndpoint;
    private CheckBox cbRequireHmac;
    private TextView tvSignalRLog;
    private SignalRClient.LogListener logListener;
    private ConfigurationManager configManager;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_otp_sender, container, false);
        configManager = new ConfigurationManager(requireContext());

        etBackendUrl = root.findViewById(R.id.etBackendUrl);
    etOtpDevicePhone = root.findViewById(R.id.etOtpDevicePhone);
        etOtpTemplate = root.findViewById(R.id.etOtpTemplate);
        etDefaultCountryCode = root.findViewById(R.id.etDefaultCountryCode);
        etOtpTestReceiver = root.findViewById(R.id.etOtpTestReceiver);
        etSimSlot = root.findViewById(R.id.etSimSlot);
        cbEnableLanEndpoint = root.findViewById(R.id.cbEnableLanEndpoint);
        cbRequireHmac = root.findViewById(R.id.cbRequireHmac);
        Button btnSave = root.findViewById(R.id.btnSaveOtpSettings);
        Button btnGetDeviceIp = root.findViewById(R.id.btnGetDeviceIp);
        Button btnShowEndpoint = root.findViewById(R.id.btnShowEndpoint);
        Button btnTest = root.findViewById(R.id.btnTestOtpSend);

        loadOtpConfiguration();

        btnSave.setOnClickListener(v -> saveOtpConfiguration());
        btnGetDeviceIp.setOnClickListener(v -> showDeviceIpAddress());
        btnShowEndpoint.setOnClickListener(v -> showEndpointAddress());
        btnTest.setOnClickListener(v -> testSendOtp());

        tvSignalRLog = root.findViewById(R.id.tvSignalRLog);
        if (tvSignalRLog != null) {
            tvSignalRLog.setMovementMethod(new ScrollingMovementMethod());
        }

        return root;
    }

    @Override
    public void onResume() {
        super.onResume();
        // Subscribe to SignalR logs
        logListener = message -> appendLog(message);
        SignalRClient.getInstance(requireContext()).addLogListener(logListener);
    }

    @Override
    public void onPause() {
        super.onPause();
        if (logListener != null) {
            SignalRClient.getInstance(requireContext()).removeLogListener(logListener);
            logListener = null;
        }
    }

    private void loadOtpConfiguration() {
        etBackendUrl.setText(configManager.getBackendUrl());
        etOtpDevicePhone.setText(configManager.getOtpDevicePhone());
        etOtpTemplate.setText(configManager.getOtpTemplate());
        etDefaultCountryCode.setText(configManager.getDefaultCountryCode());
        etOtpTestReceiver.setText(configManager.getOtpTestReceiver());
        Integer simSlot = configManager.getPreferredSimSlot();
        etSimSlot.setText(simSlot == null ? "" : String.valueOf(simSlot));
        cbEnableLanEndpoint.setChecked(configManager.isLanEndpointEnabled());
        cbRequireHmac.setChecked(configManager.isHmacRequired());
    }

    private void saveOtpConfiguration() {
        String backendUrl = etBackendUrl.getText().toString().trim();
        String template = etOtpTemplate.getText().toString().trim();
        String country = etDefaultCountryCode.getText().toString().trim();
        String otpTestReceiver = etOtpTestReceiver.getText().toString().trim();
        String simSlotStr = etSimSlot.getText().toString().trim();
        boolean enableLan = cbEnableLanEndpoint.isChecked();
        boolean requireHmac = cbRequireHmac.isChecked();

        Integer simSlot = null;
        if (!simSlotStr.isEmpty()) {
            try {
                int parsed = Integer.parseInt(simSlotStr);
                if (parsed < 0 || parsed > 1) {
                    Toast.makeText(requireContext(), "SIM slot must be 0 or 1", Toast.LENGTH_SHORT).show();
                    return;
                }
                simSlot = parsed;
            } catch (NumberFormatException ex) {
                Toast.makeText(requireContext(), "Invalid SIM slot", Toast.LENGTH_SHORT).show();
                return;
            }
        }

        if (template.isEmpty()) {
            template = "Your OTP is {varOTP}";
        }

        configManager.saveOtpConfiguration(backendUrl, template, country, otpTestReceiver, simSlot, enableLan, requireHmac);
    // save device phone separately
    String devicePhone = etOtpDevicePhone.getText().toString().trim();
    configManager.saveOtpDevicePhone(devicePhone);
        Toast.makeText(requireContext(), "OTP settings saved", Toast.LENGTH_SHORT).show();

        // Restart SignalR connection if backend URL was changed
        if (!backendUrl.isEmpty()) {
            SignalRClient.getInstance(requireContext()).stop();
            SignalRClient.getInstance(requireContext()).start();
        }

        if (enableLan) {
            HttpServerService.start(requireContext());
        } else {
            HttpServerService.stop(requireContext());
        }
    }

    private void testSendOtp() {
        if (!ensureSendSmsPermission()) {
            Toast.makeText(requireContext(), "SEND_SMS permission required", Toast.LENGTH_SHORT).show();
            return;
        }
        String testReceiver = configManager.getOtpTestReceiver();
        if (testReceiver == null || testReceiver.isEmpty()) {
            Toast.makeText(requireContext(), "Set a Test Receiver Phone in OTP settings", Toast.LENGTH_SHORT).show();
            return;
        }
        String otp = "123456";
        String template = configManager.getOtpTemplate();
        String message = template.replace("{varOTP}", otp);
        Integer simSlot = configManager.getPreferredSimSlot();
        String normalized = PhoneNormalizer.normalizePhone(testReceiver, configManager.getDefaultCountryCode());
        boolean ok = SmsSender.send(requireContext(), normalized, message, simSlot);
        Toast.makeText(requireContext(), ok ? "OTP sent" : "Failed to send OTP", Toast.LENGTH_SHORT).show();
    }

    private void appendLog(String line) {
        if (tvSignalRLog == null) return;
        requireActivity().runOnUiThread(() -> {
            tvSignalRLog.append(line + "\n");
            // scroll to bottom
            int scrollAmount = tvSignalRLog.getLayout() != null ? tvSignalRLog.getLayout().getLineTop(tvSignalRLog.getLineCount()) - tvSignalRLog.getHeight() : 0;
            if (scrollAmount > 0)
                tvSignalRLog.scrollTo(0, scrollAmount);
            else
                tvSignalRLog.scrollTo(0, 0);
        });
    }

    private boolean ensureSendSmsPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Context ctx = requireContext();
            if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.SEND_SMS}, 1010);
                return false;
            }
        }
        return true;
    }

    private void showDeviceIpAddress() {
        String ip = getLocalIpv4Address();
        String tailscaleIp = getTailscaleIpAddress();
        
        StringBuilder message = new StringBuilder();
        message.append("📱 Device IP Addresses:\n\n");
        
        if (ip != null && !ip.isEmpty()) {
            message.append("🌐 Local/LAN IP:\n");
            message.append(ip).append("\n\n");
            message.append("Backend Config:\n");
            message.append("\"BaseUrl\": \"http://").append(ip).append(":8080\"\n\n");
        } else {
            message.append("⚠️ No LAN IP found\n\n");
        }
        
        if (tailscaleIp != null && !tailscaleIp.isEmpty()) {
            message.append("🔐 Tailscale IP:\n");
            message.append(tailscaleIp).append("\n\n");
            message.append("Backend Config (Production):\n");
            message.append("\"BaseUrl\": \"http://").append(tailscaleIp).append(":8080\"\n");
        } else {
            message.append("ℹ️ Tailscale IP: Not detected\n(Install Tailscale for remote access)");
        }
        
        String ipToCopy = tailscaleIp != null && !tailscaleIp.isEmpty() ? tailscaleIp : ip;
        
        new androidx.appcompat.app.AlertDialog.Builder(requireContext())
                .setTitle("Device IP Address")
                .setMessage(message.toString())
                .setPositiveButton("Copy IP", (d, w) -> {
                    if (ipToCopy != null) {
                        copyToClipboard("Device IP", ipToCopy);
                    }
                })
                .setNeutralButton("Copy Config", (d, w) -> {
                    if (ipToCopy != null) {
                        String config = "\"AndroidSms\": {\n  \"BaseUrl\": \"http://" + ipToCopy + ":8080\",\n  \"SecretKey\": \"" + configManager.getSecretKey() + "\",\n  \"UseHmac\": true\n}";
                        copyToClipboard("Backend Config", config);
                    }
                })
                .setNegativeButton("Close", null)
                .show();
    }

    private void showEndpointAddress() {
        if (!configManager.isLanEndpointEnabled()) {
            Toast.makeText(requireContext(), "Enable LAN testing endpoint first", Toast.LENGTH_SHORT).show();
            return;
        }
        String ip = getLocalIpv4Address();
        if (ip == null || ip.isEmpty()) {
            Toast.makeText(requireContext(), "No LAN IPv4 address detected", Toast.LENGTH_SHORT).show();
            return;
        }
        String url = "http://" + ip + ":8080/send-otp?varOTP=123456&receiver=%2B11234567890";
        new androidx.appcompat.app.AlertDialog.Builder(requireContext())
                .setTitle("Endpoint Address")
                .setMessage("Use this URL from your backend (LAN only):\n\n" + url + "\n\nHeader:\nX-Webhook-Secret: " + configManager.getSecretKey())
                .setPositiveButton("Copy", (d, w) -> copyToClipboard("OTP Endpoint", url))
                .setNegativeButton("Close", null)
                .show();
    }

    private void copyToClipboard(String label, String text) {
        android.content.ClipboardManager clipboard = (android.content.ClipboardManager) requireContext().getSystemService(android.content.Context.CLIPBOARD_SERVICE);
        android.content.ClipData clip = android.content.ClipData.newPlainText(label, text);
        clipboard.setPrimaryClip(clip);
        Toast.makeText(requireContext(), "Copied to clipboard", Toast.LENGTH_SHORT).show();
    }

    private String getLocalIpv4Address() {
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InetAddress addr : Collections.list(ni.getInetAddresses())) {
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        String ip = addr.getHostAddress();
                        // Skip Tailscale IPs (they start with 100.)
                        if (ip != null && !ip.startsWith("100.")) {
                            return ip;
                        }
                    }
                }
            }
        } catch (Exception ignored) { }
        return null;
    }
    
    private String getTailscaleIpAddress() {
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InetAddress addr : Collections.list(ni.getInetAddresses())) {
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        String ip = addr.getHostAddress();
                        // Tailscale IPs start with 100.
                        if (ip != null && ip.startsWith("100.")) {
                            return ip;
                        }
                    }
                }
            }
        } catch (Exception ignored) { }
        return null;
    }
}
