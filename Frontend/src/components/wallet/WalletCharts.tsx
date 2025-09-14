import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import type { WalletAnalytics } from '../../types/wallet';

type Props = { analytics: WalletAnalytics | null };

function Sparkline({ points }: { points: number[] }) {
  const width = 400;
  const height = 80;
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 1);
  const range = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={d} fill="none" stroke="#1976d2" strokeWidth="2" />
    </svg>
  );
}

const WalletCharts: React.FC<Props> = ({ analytics }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Wallet Analytics (30d)</Typography>
        {analytics ? (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Credits: {analytics.totals.credits30d.toFixed(2)} | Debits: {analytics.totals.debits30d.toFixed(2)}
            </Typography>
            <Sparkline points={analytics.series.map(p => p.balance)} />
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">No data</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletCharts;
