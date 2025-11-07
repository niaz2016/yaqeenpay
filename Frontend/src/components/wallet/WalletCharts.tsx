import React, { useMemo, useState } from 'react';
import { Card, CardContent, Typography, Box, Select, MenuItem, FormControl } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WalletAnalytics } from '../../types/wallet';

type TimePeriod = '1' | '7' | '30' | '365';

type Props = { 
  analytics: WalletAnalytics | null;
  onPeriodChange: (days: number) => void;
};

const WalletCharts: React.FC<Props> = ({ analytics, onPeriodChange }) => {
  const [period, setPeriod] = useState<TimePeriod>('30');

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
    onPeriodChange(parseInt(newPeriod));
  };

  // Format data for recharts
  const chartData = useMemo(() => {
    if (!analytics?.series?.length) return [];
    
    // Sort by date to ensure chronological order
    const sorted = [...analytics.series].sort((a, b) => a.date.localeCompare(b.date));
    
    return sorted.map(point => ({
      date: point.date,
      timestamp: new Date(point.date).getTime(),
      balance: point.balance,
      displayDate: point.date,
    }));
  }, [analytics]);

  // Format x-axis based on period
  const formatXAxis = (value: string) => {
    const date = new Date(value);
    
    if (period === '1') {
      // For 1 day (24 hours), show time
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (period === '7') {
      // For 1 week, show short date (e.g., "Nov 5")
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period === '30') {
      // For 1 month, show date (e.g., "11/5")
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    } else {
      // For 1 year, show month (e.g., "Nov")
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
  };

  const formatTooltip = (value: number) => {
    return value.toFixed(2);
  };

  const formatTooltipLabel = (label: string) => {
    const date = new Date(label);
    if (period === '1') {
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const credits = analytics?.totals.credits30d ?? 0;
  const debits = analytics?.totals.debits30d ?? 0;

  return (
    <Card sx={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1.05rem', sm: '1.15rem' } }}>
            Wallet Analytics
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value as TimePeriod)}
              sx={{ fontSize: '0.875rem' }}
            >
              <MenuItem value="1">24 Hours</MenuItem>
              <MenuItem value="7">7 Days</MenuItem>
              <MenuItem value="30">30 Days</MenuItem>
              <MenuItem value="365">1 Year</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {analytics && chartData.length > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
              Credits: {credits.toFixed(2)} | Debits: {debits.toFixed(2)}
            </Typography>
            <Box sx={{ width: '100%', flex: 1, minHeight: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxis}
                    stroke="#666"
                    style={{ fontSize: '0.75rem' }}
                    interval={period === '365' ? 30 : period === '30' ? 5 : period === '7' ? 1 : 2}
                  />
                  <YAxis 
                    stroke="#666"
                    style={{ fontSize: '0.75rem' }}
                    tickFormatter={(value) => value.toFixed(0)}
                  />
                  <Tooltip 
                    formatter={formatTooltip}
                    labelFormatter={formatTooltipLabel}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#1976d2" 
                    strokeWidth={2}
                    dot={{ fill: '#1976d2', r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Balance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">No data for selected period</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletCharts;
