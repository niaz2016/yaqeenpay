import React from 'react';
import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import type { WalletSummary } from '../../types/wallet';

type Props = {
  summary: WalletSummary | null;
};

const BalanceCard: React.FC<Props> = ({ summary }) => {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="overline" color="text.secondary">Wallet Balance</Typography>
            <Typography variant="h4">
              {summary ? `${summary.currency} ${summary.balance.toFixed(2)}` : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Updated {summary ? new Date(summary.updatedAt).toLocaleString() : '—'}
            </Typography>
          </div>
          <Chip label={summary?.status || '—'} color={summary?.status === 'Active' ? 'success' : 'default'} />
        </Stack>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
