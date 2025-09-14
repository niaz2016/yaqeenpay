import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Alert,
  LinearProgress,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import adminService from '../../services/adminServiceSelector';
import type { AdminUser, UserFilter, UserActionRequest } from '../../types/admin';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'changeRole'>('activate');
  const [newRole, setNewRole] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [filters, setFilters] = useState<UserFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getUsers(filters);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleFilterChange = (key: keyof UserFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleUserAction = async () => {
    if (!selectedUser) return;

    try {
      const request: UserActionRequest = {
        userId: selectedUser.id,
        action: actionType,
        newRole: actionType === 'changeRole' ? newRole : undefined,
        reason: actionReason
      };

      await adminService.performUserAction(request);
      await fetchUsers();
      setActionDialogOpen(false);
      setSelectedUser(null);
      setActionReason('');
      setNewRole('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform action');
    }
  };

  const openActionDialog = (user: AdminUser, action: typeof actionType) => {
    setSelectedUser(user);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const getStatusChip = (user: AdminUser) => {
    if (!user.isActive) {
      return <Chip label="Inactive" color="error" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  const getKycStatusChip = (status: string) => {
    const statusMap = {
      'Pending': { color: 'warning' as const, label: 'Pending' },
      'Approved': { color: 'success' as const, label: 'Approved' },
      'Rejected': { color: 'error' as const, label: 'Rejected' },
      'NotSubmitted': { color: 'default' as const, label: 'Not Submitted' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.NotSubmitted;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getRoleChips = (roles: string[]) => {
    return roles.map(role => (
      <Chip
        key={role}
        label={role}
        color={role === 'Admin' ? 'secondary' : role === 'Seller' ? 'primary' : 'default'}
        size="small"
        sx={{ mr: 0.5 }}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && users.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            User Management
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        {showFilters && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filters
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
                <TextField
                  label="Search"
                  placeholder="Search by name or email"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    endAdornment: <SearchIcon color="action" />
                  }}
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={filters.role || ''}
                    label="Role"
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Seller">Seller</MenuItem>
                    <MenuItem value="Buyer">Buyer</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>KYC Status</InputLabel>
                  <Select
                    value={filters.kycStatus || ''}
                    label="KYC Status"
                    onChange={(e) => handleFilterChange('kycStatus', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                    <MenuItem value="NotSubmitted">Not Submitted</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.isActive ?? true}
                      onChange={(e) => handleFilterChange('isActive', e.target.checked)}
                    />
                  }
                  label="Active Only"
                />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="From Date"
                  type="date"
                  size="small"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="To Date"
                  type="date"
                  size="small"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>KYC Status</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Registration Date</TableCell>
                  <TableCell>Profile Complete</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {getRoleChips(user.roles)}
                      </TableCell>
                      <TableCell>
                        {getKycStatusChip(user.kycStatus)}
                      </TableCell>
                      <TableCell>
                        {getStatusChip(user)}
                      </TableCell>
                      <TableCell>
                        {formatDate(user.registrationDate)}
                      </TableCell>
                      <TableCell>
                        {user.profileCompleteness}%
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openActionDialog(user, 'changeRole')}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {user.isActive ? (
                            <Tooltip title="Deactivate User">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openActionDialog(user, 'deactivate')}
                              >
                                <BlockIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Activate User">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => openActionDialog(user, 'activate')}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={users.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Card>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)}>
          <DialogTitle>
            {actionType === 'activate' && 'Activate User'}
            {actionType === 'deactivate' && 'Deactivate User'}
            {actionType === 'changeRole' && 'Change User Role'}
          </DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  User: {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                </Typography>
                
                {actionType === 'changeRole' && (
                  <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                    <InputLabel>New Role</InputLabel>
                    <Select
                      value={newRole}
                      label="New Role"
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <MenuItem value="Admin">Admin</MenuItem>
                      <MenuItem value="Seller">Seller</MenuItem>
                      <MenuItem value="Buyer">Buyer</MenuItem>
                    </Select>
                  </FormControl>
                )}
                
                <TextField
                  fullWidth
                  label="Reason"
                  multiline
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  required
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUserAction}
              variant="contained"
              disabled={!actionReason || (actionType === 'changeRole' && !newRole)}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default UserManagement;