package com.techtorio.smswebhook;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class LogAdapter extends RecyclerView.Adapter<LogAdapter.LogViewHolder> {
    private List<LogManager.LogEntry> logEntries;

    public LogAdapter(List<LogManager.LogEntry> logEntries) {
        this.logEntries = logEntries;
    }

    @NonNull
    @Override
    public LogViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_log, parent, false);
        return new LogViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull LogViewHolder holder, int position) {
        LogManager.LogEntry entry = logEntries.get(position);
        holder.bind(entry);
    }

    @Override
    public int getItemCount() {
        return logEntries.size();
    }

    public void updateLogs(List<LogManager.LogEntry> newLogs) {
        this.logEntries = newLogs;
        notifyDataSetChanged();
    }

    static class LogViewHolder extends RecyclerView.ViewHolder {
        private TextView tvLogType;
        private TextView tvLogTime;
        private TextView tvLogMessage;
        private TextView tvLogDetails;

        public LogViewHolder(@NonNull View itemView) {
            super(itemView);
            tvLogType = itemView.findViewById(R.id.tvLogType);
            tvLogTime = itemView.findViewById(R.id.tvLogTime);
            tvLogMessage = itemView.findViewById(R.id.tvLogMessage);
            tvLogDetails = itemView.findViewById(R.id.tvLogDetails);
        }

        public void bind(LogManager.LogEntry entry) {
            tvLogType.setText(entry.type);
            tvLogTime.setText(entry.time);
            tvLogMessage.setText(entry.message);

            // Set color based on log type
            int color;
            switch (entry.type) {
                case "SMS_RECEIVED":
                    color = Color.parseColor("#2196F3");
                    break;
                case "SMS_MATCHED":
                    color = Color.parseColor("#4CAF50");
                    break;
                case "WEBHOOK_SUCCESS":
                    color = Color.parseColor("#8BC34A");
                    break;
                case "WEBHOOK_ERROR":
                    color = Color.parseColor("#F44336");
                    break;
                default:
                    color = Color.parseColor("#757575");
            }
            tvLogType.setBackgroundColor(color);
            tvLogType.setTextColor(Color.WHITE);

            // Show details if available
            if (entry.details != null && !entry.details.isEmpty()) {
                tvLogDetails.setText(entry.details);
                tvLogDetails.setVisibility(View.VISIBLE);
            } else {
                tvLogDetails.setVisibility(View.GONE);
            }
        }
    }
}

