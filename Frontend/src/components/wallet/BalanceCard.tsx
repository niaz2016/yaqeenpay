import React, { useState } from 'react';
import { Card, CardContent, Typography, Stack, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import type { WalletSummary } from '../../types/wallet';

type Props = {
  summary: WalletSummary | null;
};

const BalanceCard: React.FC<Props> = ({ summary }) => {
  const [showBalance, setShowBalance] = useState(false); // Hidden by default
  
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
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
              Updated {summary ? new Date(summary.updatedAt).toLocaleString() : '—'}
            </Typography>
          </div>
          <IconButton 
            onClick={() => setShowBalance(!showBalance)}
            size="small"
          >
            {showBalance ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
