package com.techtorio.smswebhook;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class ResponseActivity extends AppCompatActivity {

    public static final String EXTRA_RESPONSE = "com.techtorio.smswebhook.EXTRA_RESPONSE";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_response);

        TextView responseTextView = findViewById(R.id.response_text);
        Button btnClose = findViewById(R.id.btnClose);
        
        String response = getIntent().getStringExtra(EXTRA_RESPONSE);

        if (response != null) {
            responseTextView.setText(response);
        } else {
            responseTextView.setText("No response data received.");
        }

        btnClose.setOnClickListener(v -> finish());
    }
}
