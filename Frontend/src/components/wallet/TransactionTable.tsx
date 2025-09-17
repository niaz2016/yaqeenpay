import React from 'react';
import { Box, Tooltip } from '@mui/material';
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
};

const columns: GridColDef[] = [
  {
    field: 'date',
    headerName: 'Date',
    flex: 1,
    valueFormatter: (p: any) => {
      const raw = p.value ?? p.row?.date;
      const dt = typeof raw === 'string' ? new Date(raw) : raw instanceof Date ? raw : null;
      return dt && !isNaN(dt.getTime()) ? dt.toLocaleString() : '';
    },
  },
  { field: 'type', headerName: 'Type', width: 120 },
  { field: 'description', headerName: 'Description', flex: 1 },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 160,
    valueFormatter: (p: any) => {
      const val = p.value ?? p.row?.amount;
      const num = typeof val === 'string' ? Number(val) : typeof val === 'number' ? val : 0;
      const curr = p.row?.currency ?? p.row?.currencyCode ?? '';
      return `${curr ? curr + ' ' : ''}${num.toFixed(2)}`;
    },
  },
  {
    field: 'proof',
    headerName: 'Proof',
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: (p: any) => {
      const row = p.row || {};
      const url = row.proofUrl || (row.attachments && row.attachments[0]?.url) || '';
      if (!url) return null;
      return (
        <Tooltip title="Open proof in new tab">
          <img
            src={url}
            alt={row.proofFilename || 'proof'}
            style={{ width: 48, height: 48, objectFit: 'cover', cursor: 'pointer', borderRadius: 4 }}
            onClick={() => window.open(url, '_blank')}
          />
        </Tooltip>
      );
    },
  },
  { field: 'transactionReference', headerName: 'Ref', flex: 1 },
];

const TransactionTable: React.FC<Props> = ({ rows, rowCount, page, pageSize, loading, onPageChange, onPageSizeChange }) => {
  return (
    <Box sx={{ height: 420, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pagination
        paginationMode="server"
        rowCount={rowCount}
        pageSizeOptions={[5, 10, 25]}
        paginationModel={{ page: Math.max(0, (page ?? 1) - 1), pageSize }}
        onPaginationModelChange={(m) => {
          onPageChange((m.page ?? 0) + 1);
          if (m.pageSize && m.pageSize !== pageSize) onPageSizeChange(m.pageSize);
        }}
        loading={!!loading}
        disableRowSelectionOnClick
      />
    </Box>
  );
};

export default TransactionTable;
