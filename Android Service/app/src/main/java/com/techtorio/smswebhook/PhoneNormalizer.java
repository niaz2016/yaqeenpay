package com.techtorio.smswebhook;

public class PhoneNormalizer {
    public static String normalizePhone(String input, String defaultCountryCode) {
        if (input == null) return "";
        String trimmed = input.trim();
        // Already E.164
        if (trimmed.startsWith("+")) {
            return trimmed.replaceAll("[^+0-9]", "");
        }
        String digits = trimmed.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return "";
        if (defaultCountryCode != null && defaultCountryCode.startsWith("+")) {
            return defaultCountryCode + digits;
        }
        return "+" + digits;
    }
}


