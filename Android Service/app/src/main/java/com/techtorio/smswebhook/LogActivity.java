package com.techtorio.smswebhook;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class LogActivity extends AppCompatActivity {
    private RecyclerView recyclerViewLogs;
    private TextView tvEmptyLogs;
    private LogAdapter logAdapter;
    private LogManager logManager;
    private Handler refreshHandler;
    private static final int REFRESH_INTERVAL_MS = 2000; // 2 seconds
    private final Runnable refreshRunnable = new Runnable() {
        @Override
        public void run() {
            if (!isFinishing() && !isDestroyed()) {
                refreshLogs();
                refreshHandler.postDelayed(this, REFRESH_INTERVAL_MS);
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_log);

        logManager = new LogManager(this);
        refreshHandler = new Handler(Looper.getMainLooper());
        recyclerViewLogs = findViewById(R.id.recyclerViewLogs);
        tvEmptyLogs = findViewById(R.id.tvEmptyLogs);
        Button btnRefresh = findViewById(R.id.btnRefresh);

        recyclerViewLogs.setLayoutManager(new LinearLayoutManager(this));
        logAdapter = new LogAdapter(logManager.getAllLogs());
        recyclerViewLogs.setAdapter(logAdapter);

        btnRefresh.setOnClickListener(v -> refreshLogs());

        refreshLogs();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.log_menu, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.menu_clear_logs) {
            showClearLogsDialog();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshLogs();
        // Auto-refresh logs periodically
        refreshHandler.postDelayed(refreshRunnable, REFRESH_INTERVAL_MS);
    }

    @Override
    protected void onPause() {
        super.onPause();
        refreshHandler.removeCallbacks(refreshRunnable);
    }

    private void refreshLogs() {
        List<LogManager.LogEntry> logs = logManager.getAllLogs();
        logAdapter.updateLogs(logs);

        if (logs.isEmpty()) {
            tvEmptyLogs.setVisibility(View.VISIBLE);
            recyclerViewLogs.setVisibility(View.GONE);
        } else {
            tvEmptyLogs.setVisibility(View.GONE);
            recyclerViewLogs.setVisibility(View.VISIBLE);
        }
    }

    private void showClearLogsDialog() {
        new AlertDialog.Builder(this)
                .setTitle("Clear Logs")
                .setMessage("Are you sure you want to clear all logs?")
                .setPositiveButton("Clear", (dialog, which) -> {
                    logManager.clearLogs();
                    refreshLogs();
                    Toast.makeText(this, "Logs cleared", Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}

