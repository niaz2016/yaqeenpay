import React from 'react';
import { Box, Tooltip, Typography, Stack, IconButton } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import type { WalletTransaction } from '../../types/wallet';

type Props = {
  rows: WalletTransaction[];
  rowCount: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh?: () => void;
  overrideCurrentFrozen?: number; // externally supplied current frozen amount (seller authoritative)
};

const columns: GridColDef[] = [
  {
    field: 'date',
    headerName: 'Date & Time',
    width: 160,
    renderCell: (p: any) => {
      const row = p.row || {};
      // Try multiple possible field names for date - backend uses 'date' field
      const raw = row.date ?? row.createdAt ?? row.timestamp ?? p.value;
      const dt = typeof raw === 'string' ? new Date(raw) : raw instanceof Date ? raw : null;
      
      if (dt && !isNaN(dt.getTime())) {
        return (
          <Box>
            <Box sx={{ fontSize: '0.85rem', fontWeight: 'medium' }}>
              {dt.toLocaleDateString()}
            </Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Box>
          </Box>
        );
      }
      return <Box sx={{ color: 'text.disabled' }}>—</Box>;
    },
  },
  {
    field: 'type',
    headerName: 'Type',
    width: 120,
    renderCell: (p: any) => {
      const row = p.row || {};
      const type = p.value || row.type;
      const description = row.description || '';
      
      // Determine transaction category based on type and description
      const getTransactionStyle = () => {
        const desc = description.toLowerCase();
        
        // Handle "Payment received for order" explicitly as Credit (seller receiving payment)
        if (desc.includes('payment received for order')) {
          return {
            bg: 'rgba(46, 125, 50, 0.08)',
            color: '#2e7d32',
            text: 'Credit',
            icon: '+'
          };
        }
        
        // Check for confirmed delivery: if it's a credit (release of funds to seller), show as Credit (green),
        // otherwise if it's a debit (platform fee / deduction) show deducted red.
        if (desc.includes('payment completed for order') || desc.includes('payment completed')) {
          if (type === 'Credit' || type === 'credit') {
            return {
              bg: 'rgba(46, 125, 50, 0.08)',
              color: '#2e7d32',
              text: 'Credit',
              icon: '+'
            };
          }
          return {
            bg: 'rgba(211, 47, 47, 0.08)',
            color: '#d32f2f',
            text: 'Deducted',
            icon: '−'
          };
        }
        
        // Check for frozen amounts (when money is frozen for an order)
        // Only match "Payment for order" but NOT "Payment received for order"
        if (((desc.includes('payment for order') && !desc.includes('payment received for order')) || 
             desc.includes('payment for orde') || desc.includes('order 0199') || 
             desc.includes('freeze'))) {
          return {
            bg: 'rgba(237, 108, 2, 0.08)',
            color: '#ed6c02',
            text: 'Frozen',
            icon: '🔒'
          };
        }
        
        // Regular credit transactions
        if (type === 'Credit' || type === 'credit') {
          return {
            bg: 'rgba(46, 125, 50, 0.08)',
            color: '#2e7d32',
            text: 'Credit',
            icon: '+'
          };
        }
        
        // Regular debit transactions
        return {
          bg: 'rgba(117, 117, 117, 0.08)',
          color: '#757575',
          text: 'Debit',
          icon: '-'
        };
      };
      
      const style = getTransactionStyle();
      
      return (
        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'bold',
            backgroundColor: style.bg,
            color: style.color,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            minWidth: '80px',
            justifyContent: 'center'
          }}
        >
          <span>{style.icon}</span>
          {style.text}
        </Box>
      );
    },
  },
  {
    field: 'description',
    headerName: 'Description',
    flex: 1,
    minWidth: 200,
    renderCell: (p: any) => {
      const row = p.row || {};
      const description = row.description || 'Transaction';
      
      // Determine if this is a special transaction type
      const getDescriptionStyle = () => {
        const desc = description.toLowerCase();
        
        // Handle "Payment received for order" explicitly (seller receiving payment)
        if (desc.includes('payment received for order')) {
          return {
            color: '#2e7d32',
            icon: '💰',
            label: 'Payment Received'
          };
        }
        
        // Check for confirmed delivery first (higher priority)
        if (desc.includes('payment completed for order') || desc.includes('payment completed')) {
          if (row.type === 'Credit') {
            return {
              color: '#2e7d32',
              icon: '✅',
              label: 'Escrow Released'
            };
          }
          return {
            color: '#d32f2f',
            icon: '✅',
            label: 'Payment Processed'
          };
        }
        
        // Check for frozen amounts  
        // Only match "Payment for order" but NOT "Payment received for order"
        if (((desc.includes('payment for order') && !desc.includes('payment received for order')) || 
             desc.includes('payment for orde') || desc.includes('order 0199') || 
             desc.includes('freeze'))) {
          return {
            color: '#ed6c02',
            icon: '🔒',
            label: 'Frozen (Escrow)'
          };
        }
        
        if (row.type === 'Credit') {
          return {
            color: '#2e7d32',
            icon: '💰',
            label: 'Credits Added'
          };
        }
        
        return {
          color: '#616161',
          icon: '💳',
          label: 'Transaction'
        };
      };
      
      const style = getDescriptionStyle();
      
      return (
        <Tooltip title={description} arrow placement="top">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: '14px' }}>{style.icon}</span>
            <Box>
              <Box sx={{ 
                fontWeight: 'medium', 
                fontSize: '0.9rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: style.color
              }}>
                {description.length > 40 ? `${description.substring(0, 40)}...` : description}
              </Box>
              <Box sx={{ 
                fontSize: '0.75rem',
                color: 'text.secondary',
                fontStyle: 'italic'
              }}>
                {style.label}
              </Box>
            </Box>
          </Box>
        </Tooltip>
      );
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (p: any) => {
      const status = p.value || p.row?.status || 'Completed';
      
      const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
          case 'completed': return { bg: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32' };
          case 'pending': return { bg: 'rgba(237, 108, 2, 0.12)', color: '#ed6c02' };
          case 'failed': return { bg: 'rgba(211, 47, 47, 0.12)', color: '#d32f2f' };
          default: return { bg: 'rgba(158, 158, 158, 0.12)', color: '#757575' };
        }
      };
      
      const colors = getStatusColor(status);
      
      return (
        <Box
          sx={{
            px: 1,
            py: 0.3,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'medium',
            backgroundColor: colors.bg,
            color: colors.color,
            textAlign: 'center',
            textTransform: 'capitalize'
          }}
        >
          {status}
        </Box>
      );
    },
  },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 140,
    renderCell: (p: any) => {
      const row = p.row || {};
      const description = row.description || '';
      
      // Get amount - backend sends it as 'amount' field
      let amount = row.amount;
      if (typeof amount === 'string') {
        amount = parseFloat(amount);
      }
      if (typeof amount !== 'number' || isNaN(amount)) {
        amount = 0;
      }
      
      // Determine color based on transaction type and description
      const getAmountStyle = () => {
        const desc = description.toLowerCase();
        
        // Handle "Payment received for order" explicitly as Credit (seller receiving payment)
        if (desc.includes('payment received for order')) {
          return {
            color: '#2e7d32',
            sign: '+',
            bg: 'rgba(46, 125, 50, 0.08)'
          };
        }
        
        // Check for confirmed delivery first (higher priority)
        if (desc.includes('payment completed for order') || desc.includes('payment completed')) {
          if (row.type === 'Credit') {
            return {
              color: '#2e7d32',
              sign: '+',
              bg: 'rgba(46, 125, 50, 0.08)'
            };
          }
          return {
            color: '#d32f2f',
            sign: '-',
            bg: 'rgba(211, 47, 47, 0.08)'
          };
        }
        
        // Check for frozen amounts (when money is frozen for an order)
        // Only match "Payment for order" but NOT "Payment received for order"
        if (((desc.includes('payment for order') && !desc.includes('payment received for order')) || 
             desc.includes('payment for orde') || desc.includes('order 0199') || 
             desc.includes('freeze'))) {
          return {
            color: '#ed6c02',
            sign: '🔒',
            bg: 'rgba(237, 108, 2, 0.08)'
          };
        }
        
        // Regular credit transactions
        if (row.type === 'Credit') {
          return {
            color: '#2e7d32',
            sign: '+',
            bg: 'rgba(46, 125, 50, 0.08)'
          };
        }
        
        // Regular debit transactions
        return {
          color: '#757575',
          sign: '-',
          bg: 'rgba(117, 117, 117, 0.08)'
        };
      };
      
      const style = getAmountStyle();
      
      return (
        <Box 
          sx={{ 
            color: style.color,
            backgroundColor: style.bg,
            fontWeight: 'bold',
            fontSize: '0.9rem',
            textAlign: 'right',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            display: 'inline-block',
            minWidth: '100px'
          }}
        >
          {style.sign}{Math.abs(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })} Wallet Credits
        </Box>
      );
    },
  },
  // {
  //   field: 'proof',
  //   headerName: 'Proof',
  //   width: 100,
  //   sortable: false,
  //   filterable: false,
  //   renderCell: (p: any) => {
  //     const row = p.row || {};
  //     const url = row.proofUrl || (row.attachments && row.attachments[0]?.url) || '';
  //     if (!url) return null;
  //     return (
  //       <Tooltip title="Open proof in new tab">
  //         <img
  //           src={url}
  //           alt={row.proofFilename || 'proof'}
  //           style={{ width: 48, height: 48, objectFit: 'cover', cursor: 'pointer', borderRadius: 4 }}
  //           onClick={() => window.open(url, '_blank')}
  //         />
  //       </Tooltip>
  //     );
  //   },
  // },
  {
    field: 'transactionReference',
    headerName: 'Reference',
    width: 160,
    renderCell: (p: any) => {
      const row = p.row || {};
      const ref = row.transactionReference || row.reference || row.ref || row.externalReference;
      
      if (!ref) return <Box sx={{ color: 'text.disabled' }}>—</Box>;
      
      return (
        <Tooltip title={`Click to copy: ${ref}`}>
          <Box
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => {
              navigator.clipboard.writeText(ref);
              // You could add a toast notification here
            }}
          >
            {ref.length > 12 ? `${ref.substring(0, 12)}...` : ref}
          </Box>
        </Tooltip>
      );
    },
  },
];

const TransactionTable: React.FC<Props> = ({ rows, rowCount, page, pageSize, loading, onPageChange, onPageSizeChange, onRefresh, overrideCurrentFrozen }) => {
  
  // Calculate summary stats
  const calculateStats = () => {
    const stats = {
      totalCredits: 0,
      totalDebits: 0,
      frozenAmounts: 0,          // cumulative frozen events
      processedPayments: 0,      // cumulative processed (released/deducted)
      currentFrozen: 0           // derived: still frozen = frozenAmounts - processedPayments
    };
    
    rows.forEach(row => {
      const amountRaw = typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount;
      const amount = (typeof amountRaw === 'number' && !isNaN(amountRaw)) ? amountRaw : 0;
      const description = row.description || '';
      const desc = description.toLowerCase();

      const isProcessed = desc.includes('payment completed for order') || desc.includes('payment completed');
      const isFrozen = ((desc.includes('payment for order') && !desc.includes('payment received for order')) || 
                       desc.includes('payment for orde') || desc.includes('order 0199') || 
                       desc.includes('freeze'));
      const isPaymentReceived = desc.includes('payment received for order');

      if (isProcessed) {
        // Only treat as processed deduction if not a credit release
        if (row.type !== 'Credit') {
          stats.processedPayments += amount;
        }
        // If it's a credit release, add to credits bucket
        if (row.type === 'Credit') {
          stats.totalCredits += amount;
        }
      } else if (isPaymentReceived) {
        // "Payment received for order" transactions count as processed payments for sellers
        stats.processedPayments += amount;
        stats.totalCredits += amount; // Also count as credits since they're positive for seller
      } else if (isFrozen) {
        stats.frozenAmounts += amount;
      } else if (row.type === 'Credit') {
        stats.totalCredits += amount;
      } else {
        stats.totalDebits += amount;
      }
    });
    
    // Derive current frozen = frozen - processed (never below zero)
    stats.currentFrozen = Math.max(0, stats.frozenAmounts - stats.processedPayments);
    return stats;
  };
  
  const stats = calculateStats();
  const currentFrozenDisplay = typeof overrideCurrentFrozen === 'number' && !isNaN(overrideCurrentFrozen)
    ? Math.max(0, overrideCurrentFrozen)
    : stats.currentFrozen;
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header with stats and refresh */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          {/* Transaction Stats */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Box sx={{ 
              px: 1.5, py: 0.75, borderRadius: 2, 
              backgroundColor: 'rgba(46, 125, 50, 0.08)', 
              border: '1px solid rgba(46, 125, 50, 0.2)' 
            }}>
              <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                💰 Credits: {stats.totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Wallet Credits
              </Typography>
            </Box>
            
            <Box sx={{ 
              px: 1.5, py: 0.75, borderRadius: 2, 
              backgroundColor: 'rgba(237, 108, 2, 0.08)', 
              border: '1px solid rgba(237, 108, 2, 0.2)' 
            }}>
              <Typography variant="caption" sx={{ color: '#ed6c02', fontWeight: 600 }}>
                🔒 Frozen: {currentFrozenDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Wallet Credits
              </Typography>
            </Box>
            
            <Box sx={{ 
              px: 1.5, py: 0.75, borderRadius: 2, 
              backgroundColor: 'rgba(211, 47, 47, 0.08)', 
              border: '1px solid rgba(211, 47, 47, 0.2)' 
            }}>
              <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                💸 Processed: {stats.processedPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Wallet Credits
              </Typography>
            </Box>
            
            {stats.totalDebits > 0 && (
              <Box sx={{ 
                px: 1.5, py: 0.75, borderRadius: 2, 
                backgroundColor: 'rgba(117, 117, 117, 0.08)', 
                border: '1px solid rgba(117, 117, 117, 0.2)' 
              }}>
                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>
                  💳 Debits: {stats.totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Wallet Credits
                </Typography>
              </Box>
            )}
        </Stack>
        
        {onRefresh && (
          <IconButton 
            onClick={onRefresh} 
            disabled={loading}
            title="Refresh transactions"
            size="small"
          >
            <Refresh />
          </IconButton>
        )}
      </Stack>
      
      <Box sx={{ height: 500, width: '100%' }}>
        <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pagination
        paginationMode="server"
        rowCount={rowCount}
        pageSizeOptions={[5, 10, 25, 50]}
        paginationModel={{ page: Math.max(0, (page ?? 1) - 1), pageSize }}
        onPaginationModelChange={(m) => {
          onPageChange((m.page ?? 0) + 1);
          if (m.pageSize && m.pageSize !== pageSize) onPageSizeChange(m.pageSize);
        }}
        loading={!!loading}
        disableRowSelectionOnClick
        sx={{
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            padding: '12px 16px',
          },
          '& .MuiDataGrid-row': {
            transition: 'all 0.15s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            },
            '&:nth-of-type(even)': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            },
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            fontWeight: 600,
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              color: '#424242',
            },
          },
          '& .MuiDataGrid-virtualScroller': {
            backgroundColor: '#ffffff',
          },
          '& .MuiDataGrid-footerContainer': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          },
        }}
        initialState={{
          sorting: {
            sortModel: [{ field: 'date', sort: 'desc' }],
          },
        }}
        localeText={{
          noRowsLabel: 'No transactions found',
        }}
      />
      </Box>
    </Box>
  );
};

export default TransactionTable;
