import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import type { WalletAnalytics } from '../../types/wallet';

type Props = { analytics: WalletAnalytics | null };

function Sparkline({ points, color = '#1976d2' }: { points: number[]; color?: string }) {
  if (!points.length) return null;
  const width = 400; // logical width; will scale via viewBox
  const height = 72;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const same = max === min;
  const range = same ? 1 : (max - min);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const path = points.map((p, i) => {
    const x = i * step;
    const y = height - ((same ? 0.5 : (p - min) / range) * height);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const area = points.map((p, i) => {
    const x = i * step;
    const y = height - ((same ? 0.5 : (p - min) / range) * height);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ') + ` L ${width},${height} L 0,${height} Z`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="walletSparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#walletSparkFill)" stroke="none" />
      <path d={path} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const WalletCharts: React.FC<Props> = ({ analytics }) => {
  // Normalize the series to ensure continuous running balance
  const normalized = useMemo(() => {
    if (!analytics?.series?.length) return [] as number[];
    // Sort by date just in case
    const sorted = [...analytics.series].sort((a,b) => a.date.localeCompare(b.date));
    // Some backends might deliver day snapshots with balance already final; if not monotonic we keep as provided.
    // We'll smooth single-point dips caused by isolated debit-credit same day anomalies if needed.
    return sorted.map(p => p.balance);
  }, [analytics]);

  const credits = analytics?.totals.credits30d ?? 0;
  const debits = analytics?.totals.debits30d ?? 0;

  return (
    <Card sx={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.05rem', sm: '1.15rem' } }}>Wallet Analytics (30d)</Typography>
        {analytics ? (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
              Credits: {credits.toFixed(2)} | Debits: {debits.toFixed(2)}
            </Typography>
            <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0, flex: 1, display: 'flex', alignItems: 'center' }}>
              <Sparkline points={normalized} />
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">No data</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletCharts;
