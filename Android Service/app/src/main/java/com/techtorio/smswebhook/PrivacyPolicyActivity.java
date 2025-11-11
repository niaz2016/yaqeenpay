package com.techtorio.smswebhook;

import android.os.Bundle;
import android.text.Html;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class PrivacyPolicyActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_privacy_policy);

        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle("Privacy Policy");
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        TextView tvPrivacyPolicy = findViewById(R.id.tvPrivacyPolicy);

        String policyText = "<h2>Privacy Policy</h2>" +
            "<p>This Privacy Policy explains how your information is collected, used, and disclosed by the SMS Webhook Service application.</p>" +
            "<h3>Information We Collect</h3>" +
            "<p>This app's core function is to monitor your SMS messages. When you grant the necessary permissions (RECEIVE_SMS and READ_SMS), the app will have access to your incoming SMS messages.</p>" +
            "<h3>How We Use Information</h3>" +
            "<p>The app uses the access to your SMS messages solely for the purpose you configure:</p>" +
            "<ul>" +
            "<li>To identify messages from a specific phone number.</li>" +
            "<li>To check if those messages contain a specific keyword or phrase.</li>" +
            "<li>To transmit the body of matching SMS messages to a webhook URL that you provide.</li>" +
            "</ul>" +
            "<h3>Information We Share</h3>" +
            "<p><b>Your data is not shared with any third party other than the webhook URL you explicitly configure.</b> The app operates entirely on your device. We, the developers of this application, do not have access to your SMS messages, your configuration, or any of your data.</p>" +
            "<p>The only data that leaves your device is the SMS message body, which is sent directly to the webhook endpoint you set up. The security and privacy of the data at that endpoint are your responsibility.</p>" +
            "<h3>Data Storage</h3>" +
            "<p>The app stores the following information locally on your device using Android's SharedPreferences:</p>" +
            "<ul>" +
            "<li>The phone number, keyword, webhook URL, and secret key you configure.</li>" +
            "<li>A local log of app activities (e.g., SMS received, SMS matched, webhook success/failure). This log is for your personal use and can be cleared at any time.</li>" +
            "</ul>" +
            "<p>This information is stored only on your device and is not transmitted to us or any other third party.</p>" +
            "<h3>Permissions</h3>" +
            "<p>The app requires the following Android permissions to function:</p>" +
            "<ul>" +
            "<li><b>RECEIVE_SMS &amp; READ_SMS:</b> To monitor and read incoming text messages to match them against your configuration.</li>" +
            "<li><b>INTERNET:</b> To send the matching SMS data to your configured webhook URL.</li>" +
            "<li><b>POST_NOTIFICATIONS:</b> To show you a notification when a webhook response is received.</li>" +
            "</ul>" +
            "<h3>Contact Us</h3>" +
            "<p>As this is a personal-use application, formal support is not provided. All data handling is under your control.</p>";

        tvPrivacyPolicy.setText(Html.fromHtml(policyText, Html.FROM_HTML_MODE_LEGACY));
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
