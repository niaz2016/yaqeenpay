package com.techtorio.smswebhook;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager2.widget.ViewPager2;

import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        ViewPager2 viewPager = findViewById(R.id.viewPager);
        TabLayout tabLayout = findViewById(R.id.tabLayout);

        viewPager.setAdapter(new MainPagerAdapter(this));

        new TabLayoutMediator(tabLayout, viewPager, (tab, position) -> {
            if (position == 0) {
                tab.setText("Receive SMS");
            } else {
                tab.setText("OTP Sender");
            }
        }).attach();

        // Start the persistent SignalR foreground service
        startSignalRService();
        
        // Check battery optimization and prompt user to disable it
        checkBatteryOptimization();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Don't stop the service here - we want it to continue running in background
        // User can manually stop it from notification or system settings
    }

    private void startSignalRService() {
        try {
            Intent serviceIntent = new Intent(this, SignalRService.class);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
            
            Toast.makeText(this, "SignalR service started", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(this, "Failed to start service: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void checkBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            String packageName = getPackageName();
            
            if (pm != null && !pm.isIgnoringBatteryOptimizations(packageName)) {
                // Show dialog to explain why battery optimization should be disabled
                new AlertDialog.Builder(this)
                    .setTitle("Battery Optimization")
                    .setMessage("For the app to receive OTP messages reliably in the background, " +
                               "please disable battery optimization for TechTorio.\n\n" +
                               "This ensures the SignalR connection stays active even when the screen is off.")
                    .setPositiveButton("Open Settings", (dialog, which) -> {
                        try {
                            Intent intent = new Intent();
                            intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                            intent.setData(Uri.parse("package:" + packageName));
                            startActivity(intent);
                        } catch (Exception e) {
                            // Fallback to general battery optimization settings
                            try {
                                Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                                startActivity(intent);
                            } catch (Exception ex) {
                                Toast.makeText(this, "Please disable battery optimization manually in system settings", Toast.LENGTH_LONG).show();
                            }
                        }
                    })
                    .setNegativeButton("Not Now", null)
                    .show();
            }
        }
    }
}
