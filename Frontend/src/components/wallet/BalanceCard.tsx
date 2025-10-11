import React, { useState } from 'react';
import { Card, CardContent, Typography, Stack, IconButton, CircularProgress, Button } from '@mui/material';
import { Visibility, VisibilityOff, Refresh } from '@mui/icons-material';
import type { WalletSummary } from '../../types/wallet';
type Props = {
  summary: WalletSummary | null;
  onRefresh?: () => Promise<void> | void;
  refreshing?: boolean;
  onTopUp?: () => void;
};

const BalanceCard: React.FC<Props> = ({ summary, onRefresh, refreshing = false, onTopUp }) => {
  const [showBalance, setShowBalance] = useState(false); // Hidden by default

  const handleRefresh = async () => {
    if (onRefresh && !refreshing) {
      await onRefresh();
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ height: '100%' }}>
          <div>
            <Typography variant="overline" color="text.secondary">Wallet Balance</Typography>
            <Typography variant="h4">
              {summary
                ? showBalance
                  ? `${summary.currency} ${summary.balance.toFixed(2)}`
                  : '••••••'
                : '—'
              }
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Updated {summary ? (() => {
                try {
                  const date = new Date(summary.updatedAt);
                  // Check if date is valid and not a default/minimum date
                  if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
                    return 'Recently';
                  }
                  return date.toLocaleString();
                } catch {
                  return 'Recently';
                }
              })() : '—'}
            </Typography>
          </div>
          <Stack direction="row" spacing={1}>
              <IconButton
                onClick={handleRefresh}
                size="small"
                disabled={refreshing}
                title="Refresh balance"
              >
                {refreshing ? (
                  <CircularProgress size={20} />
                ) : (
                  <Refresh />
                )}
              </IconButton>
              <IconButton
                onClick={() => setShowBalance(!showBalance)}
                size="small"
                title={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <VisibilityOff /> : <Visibility />}
              </IconButton>
              <Button variant="contained" color="primary" onClick={onTopUp}>
                Top Up
              </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
