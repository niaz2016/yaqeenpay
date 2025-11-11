package com.techtorio.smswebhook;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.ArrayList;
import java.util.List;

public class ConfigurationManager {
    private static final String PREFS_NAME = "SMSWebhookPrefs";
    private static final String KEY_PHONE_NUMBER = "phone_number";
    private static final String KEY_KEYWORD = "keyword";
    private static final String KEY_WEBHOOK_URL = "webhook_url";
    private static final String KEY_SECRET_KEY = "secret_key";

    // OTP sender settings
    private static final String KEY_OTP_TEMPLATE = "otp_template";
    private static final String KEY_DEFAULT_COUNTRY_CODE = "default_country_code";
    private static final String KEY_PREFERRED_SIM_SLOT = "preferred_sim_slot";
    private static final String KEY_ENABLE_LAN_ENDPOINT = "enable_lan_endpoint";
    private static final String KEY_REQUIRE_HMAC = "require_hmac";
    private static final String KEY_OTP_TEST_RECEIVER = "otp_test_receiver";
    private static final String KEY_BACKEND_URL = "backend_url";
    private static final String KEY_OTP_DEVICE_PHONE = "otp_device_phone";

    private SharedPreferences prefs;

    public ConfigurationManager(Context context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public void saveConfiguration(String phoneNumber, String keyword, String webhookUrl, String secretKey) {
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(KEY_PHONE_NUMBER, phoneNumber);
        editor.putString(KEY_KEYWORD, keyword);
        editor.putString(KEY_WEBHOOK_URL, webhookUrl);
        editor.putString(KEY_SECRET_KEY, secretKey);
        editor.apply();
    }

    public void saveOtpConfiguration(String backendUrl, String otpTemplate, String defaultCountryCode, String otpTestReceiver, Integer preferredSimSlot, boolean enableLanEndpoint, boolean requireHmac) {
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(KEY_BACKEND_URL, backendUrl == null ? "" : backendUrl);
        // keep device phone if caller included it in newer overloads
        editor.putString(KEY_OTP_TEMPLATE, otpTemplate);
        editor.putString(KEY_DEFAULT_COUNTRY_CODE, defaultCountryCode);
        editor.putString(KEY_OTP_TEST_RECEIVER, otpTestReceiver == null ? "" : otpTestReceiver);
        if (preferredSimSlot == null) {
            editor.remove(KEY_PREFERRED_SIM_SLOT);
        } else {
            editor.putInt(KEY_PREFERRED_SIM_SLOT, preferredSimSlot);
        }
        editor.putBoolean(KEY_ENABLE_LAN_ENDPOINT, enableLanEndpoint);
        editor.putBoolean(KEY_REQUIRE_HMAC, requireHmac);
        editor.apply();
    }

    public void saveOtpDevicePhone(String devicePhone) {
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(KEY_OTP_DEVICE_PHONE, devicePhone == null ? "" : devicePhone);
        editor.apply();
    }

    public String getPhoneNumber() {
        return prefs.getString(KEY_PHONE_NUMBER, "");
    }

    public String getKeyword() {
        return prefs.getString(KEY_KEYWORD, "");
    }

    public String getWebhookUrl() {
        return prefs.getString(KEY_WEBHOOK_URL, "");
    }

    public String getSecretKey() {
        return prefs.getString(KEY_SECRET_KEY, "");
    }

    public String getOtpTemplate() {
        String template = prefs.getString(KEY_OTP_TEMPLATE, null);
        return template == null || template.isEmpty() ? "Your OTP is {varOTP}" : template;
    }

    public String getDefaultCountryCode() {
        return prefs.getString(KEY_DEFAULT_COUNTRY_CODE, "");
    }

    public Integer getPreferredSimSlot() {
        if (!prefs.contains(KEY_PREFERRED_SIM_SLOT)) return null;
        return prefs.getInt(KEY_PREFERRED_SIM_SLOT, 0);
    }

    public boolean isLanEndpointEnabled() {
        return prefs.getBoolean(KEY_ENABLE_LAN_ENDPOINT, false);
    }

    public boolean isHmacRequired() {
        return prefs.getBoolean(KEY_REQUIRE_HMAC, false);
    }

    public String getOtpTestReceiver() {
        return prefs.getString(KEY_OTP_TEST_RECEIVER, "");
    }

    public String getOtpDevicePhone() {
        return prefs.getString(KEY_OTP_DEVICE_PHONE, "");
    }

    /**
     * Returns configured phone numbers as a list. Multiple numbers can be configured
     * separated by commas in the existing phone number setting (for backwards
     * compatibility). Trims whitespace and ignores empty entries.
     */
    public List<String> getPhoneNumbers() {
        String raw = getPhoneNumber();
        List<String> out = new ArrayList<>();
        if (raw == null || raw.trim().isEmpty()) return out;
        String[] parts = raw.split(",");
        for (String p : parts) {
            String t = p.trim();
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }

    /**
     * Returns configured keywords as a list. Multiple keywords can be separated
     * by commas. If empty list is returned, it means "no keyword filter".
     */
    public List<String> getKeywords() {
        String raw = getKeyword();
        List<String> out = new ArrayList<>();
        if (raw == null || raw.trim().isEmpty()) return out;
        String[] parts = raw.split(",");
        for (String p : parts) {
            String t = p.trim();
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }

    public boolean isConfigured() {
        String phone = getPhoneNumber();
        String keyword = getKeyword();
        String url = getWebhookUrl();
        String secret = getSecretKey();
        return !phone.isEmpty() && !keyword.isEmpty() && !url.isEmpty() && !secret.isEmpty();
    }

    public String getBackendUrl() {
        return prefs.getString(KEY_BACKEND_URL, "");
    }

    public String getSignalRHubUrl() {
        // Use backend URL if configured, otherwise fall back to webhook URL
        String baseUrl = getBackendUrl();
        if (baseUrl == null || baseUrl.isEmpty()) {
            baseUrl = getWebhookUrl();
        }
        if (baseUrl == null || baseUrl.isEmpty()) return "";
        
        // If already contains /hubs/, return as-is
        if (baseUrl.contains("/hubs/")) return baseUrl;

        // Append the hub path to whatever base the user provided. If the user
        if (baseUrl.endsWith("/")) return baseUrl + "hubs/device";
        return baseUrl + "/hubs/device";
    }
}
