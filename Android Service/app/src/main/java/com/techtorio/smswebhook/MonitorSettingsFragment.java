package com.techtorio.smswebhook;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import java.util.List;

public class MonitorSettingsFragment extends Fragment {
    private static final int SMS_PERMISSION_REQUEST_CODE = 100;

    private EditText etPhoneNumber;
    private EditText etKeyword;
    private EditText etWebhookUrl;
    private EditText etSecretKey;
    private TextView tvStatus;
    private ConfigurationManager configManager;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_monitor_settings, container, false);
        configManager = new ConfigurationManager(requireContext());

        etPhoneNumber = root.findViewById(R.id.etPhoneNumber);
        etKeyword = root.findViewById(R.id.etKeyword);
        etWebhookUrl = root.findViewById(R.id.etWebhookUrl);
        etSecretKey = root.findViewById(R.id.etSecretKey);
        Button btnSave = root.findViewById(R.id.btnSave);
        Button btnTestWebhook = root.findViewById(R.id.btnTestWebhook);
        Button btnViewLogs = root.findViewById(R.id.btnViewLogs);
        Button btnClearLogs = root.findViewById(R.id.btnClearLogs);
        tvStatus = root.findViewById(R.id.tvStatus);

        loadConfiguration();
        updateStatus();
        updateStats();

        btnSave.setOnClickListener(v -> saveConfiguration());
        btnViewLogs.setOnClickListener(v -> {
            Intent intent = new Intent(requireContext(), LogActivity.class);
            startActivity(intent);
        });
        btnClearLogs.setOnClickListener(v -> showClearLogsDialog());
        btnTestWebhook.setOnClickListener(v -> showTestWebhookDialog());

        requestSMSPermissions();
        return root;
    }

    private void loadConfiguration() {
        etPhoneNumber.setText(configManager.getPhoneNumber());
        etKeyword.setText(configManager.getKeyword());
        etWebhookUrl.setText(configManager.getWebhookUrl());
        etSecretKey.setText(configManager.getSecretKey());
    }

    private void saveConfiguration() {
        String phoneNumber = etPhoneNumber.getText().toString().trim();
        String keyword = etKeyword.getText().toString().trim();
        String webhookUrl = etWebhookUrl.getText().toString().trim();
        String secretKey = etSecretKey.getText().toString().trim();

        if (phoneNumber.isEmpty() || keyword.isEmpty() || webhookUrl.isEmpty() || secretKey.isEmpty()) {
            Toast.makeText(requireContext(), "Please fill in all fields", Toast.LENGTH_SHORT).show();
            return;
        }

        configManager.saveConfiguration(phoneNumber, keyword, webhookUrl, secretKey);
        updateStatus();
        updateStats();
        Toast.makeText(requireContext(), R.string.config_saved, Toast.LENGTH_SHORT).show();
    }

    private void updateStatus() {
        if (configManager.isConfigured()) {
            tvStatus.setText("Configured");
            tvStatus.setTextColor(ContextCompat.getColor(requireContext(), android.R.color.holo_green_dark));
        } else {
            tvStatus.setText(R.string.not_configured);
            tvStatus.setTextColor(ContextCompat.getColor(requireContext(), android.R.color.holo_red_dark));
        }
    }

    private void requestSMSPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.RECEIVE_SMS)
                    != PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.READ_SMS)
                    != PackageManager.PERMISSION_GRANTED) {

                requestPermissions(new String[]{
                        Manifest.permission.RECEIVE_SMS,
                        Manifest.permission.READ_SMS
                }, SMS_PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        updateStatus();
        updateStats();
    }

    private void updateStats() {
        LogManager logManager = new LogManager(requireContext());
        List<LogManager.LogEntry> logs = logManager.getAllLogs();

        int smsReceived = 0;
        int smsMatched = 0;
        int webhookSuccess = 0;
        int webhookError = 0;

        for (LogManager.LogEntry entry : logs) {
            switch (entry.type) {
                case "SMS_RECEIVED":
                    smsReceived++;
                    break;
                case "SMS_MATCHED":
                    smsMatched++;
                    break;
                case "WEBHOOK_SUCCESS":
                    webhookSuccess++;
                    break;
                case "WEBHOOK_ERROR":
                    webhookError++;
                    break;
            }
        }

        String statusText = configManager.isConfigured() ? "Configured" : "Not Configured";
        if (configManager.isConfigured()) {
            statusText += "\n\nStats:\n";
            statusText += "SMS Received: " + smsReceived + "\n";
            statusText += "SMS Matched: " + smsMatched + "\n";
            statusText += "Webhook Success: " + webhookSuccess + "\n";
            statusText += "Webhook Errors: " + webhookError;
        }

        tvStatus.setText(statusText);
    }

    private void showTestWebhookDialog() {
        if (!configManager.isConfigured()) {
            Toast.makeText(requireContext(), "Please configure webhook settings first", Toast.LENGTH_SHORT).show();
            return;
        }

        final EditText input = new EditText(requireContext());
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE);
        input.setHint("Enter test SMS message");
        input.setMinLines(3);
        input.setMaxLines(5);
        input.setText("Test SMS message");

        LinearLayout layout = new LinearLayout(requireContext());
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(50, 40, 50, 10);
        layout.addView(input);

        new AlertDialog.Builder(requireContext())
                .setTitle("Test Webhook")
                .setMessage("Enter a custom SMS message to test the webhook:")
                .setView(layout)
                .setPositiveButton("Send", (dialog, which) -> {
                    String testMessage = input.getText().toString().trim();
                    if (testMessage.isEmpty()) {
                        Toast.makeText(requireContext(), "Please enter a test message", Toast.LENGTH_SHORT).show();
                        return;
                    }

                    LogManager logManager = new LogManager(requireContext());
                    logManager.addLog("SMS_MATCHED",
                            "Test webhook call",
                            "Test Message: " + testMessage);

                    WebhookService.postSMS(requireContext(), testMessage);
                    Toast.makeText(requireContext(), "Test message sent to webhook", Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void showClearLogsDialog() {
        new AlertDialog.Builder(requireContext())
                .setTitle("Clear Logs")
                .setMessage("Are you sure you want to clear all activity logs?")
                .setPositiveButton("Clear", (dialog, which) -> {
                    LogManager logManager = new LogManager(requireContext());
                    logManager.clearLogs();
                    updateStats();
                    Toast.makeText(requireContext(), "Logs cleared", Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}


