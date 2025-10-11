// src/pages/notifications/NotificationsPage.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Checkbox,
  Toolbar,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  Tooltip,
  FormControl,
  Select,
  InputLabel,

} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  ShoppingCart,
  Payment,
  VerifiedUser,
  Security,
  AccountBalanceWallet,
  Store,
  SystemUpdate,
  LocalOffer,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../context/NotificationContext';
import type { Notification, NotificationType, NotificationPriority } from '../../types/notification';

// Helper replicating dropdown logic for consistent unread detection
const isNotificationUnread = (n: Notification): boolean => {
  if (!n) return false;
  const status = (n.status ?? '').toString().toLowerCase();
  if (status === 'unread') return true;
  if (status === 'read' || status === 'archived') return false;
  if ((n as any).read !== undefined && typeof (n as any).read === 'boolean') return !(n as any).read;
  if (!n.readAt) return true;
  return false;
};
import type { SelectChangeEvent } from '@mui/material';

// Type to icon mapping
const getTypeIcon = (type: NotificationType) => {
  const iconProps = { fontSize: 'small' as const };
  switch (type) {
    case 'order': return <ShoppingCart {...iconProps} />;
    case 'payment': return <Payment {...iconProps} />;
    case 'kyc': return <VerifiedUser {...iconProps} />;
    case 'security': return <Security {...iconProps} />;
    case 'wallet': return <AccountBalanceWallet {...iconProps} />;
    case 'seller': return <Store {...iconProps} />;
    case 'system': return <SystemUpdate {...iconProps} />;
    case 'promotion': return <LocalOffer {...iconProps} />;
    default: return <NotificationsIcon {...iconProps} />;
  }
};

// Type to color mapping
const getTypeColor = (type: NotificationType) => {
  switch (type) {
    case 'order': return 'primary';
    case 'payment': return 'success';
    case 'kyc': return 'warning';
    case 'security': return 'error';
    case 'wallet': return 'info';
    case 'seller': return 'secondary';
    case 'system': return 'default';
    case 'promotion': return 'secondary';
    default: return 'default';
  }
};

// Priority to color mapping
const getPriorityColor = (priority: NotificationPriority) => {
  switch (priority) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'success';
    default: return 'default';
  }
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

const NotificationsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all');
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);

  const {
    notifications,
    stats,
    loading,
    error,
    fetchNewNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultiple,
  } = useNotifications();

  // Filter notifications based on tab and filters
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by tab (status)
    if (tabValue === 1) {
      filtered = filtered.filter(n => n.status === 'unread');
    } else if (tabValue === 2) {
      filtered = filtered.filter(n => n.status === 'read');
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === filterPriority);
    }

    return filtered;
  }, [notifications, tabValue, filterType, filterPriority]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedIds([]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedIds(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleBulkMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBulkMenuAnchor(event.currentTarget);
  };

  const handleBulkMenuClose = () => {
    setBulkMenuAnchor(null);
  };

  const handleBulkMarkAsRead = useCallback(async () => {
    if (selectedIds.length > 0) {
      try {
        await markAsRead(selectedIds);
        setSelectedIds([]);
        handleBulkMenuClose();
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    }
  }, [selectedIds, markAsRead]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length > 0) {
      try {
        await deleteMultiple(selectedIds);
        setSelectedIds([]);
        handleBulkMenuClose();
      } catch (error) {
        console.error('Failed to delete notifications:', error);
      }
    }
  }, [selectedIds, deleteMultiple]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [markAllAsRead]);

  const handleRefresh = useCallback(() => {
    // Import recent new notifications only
    fetchNewNotifications({ limit: 50 });
  }, [fetchNewNotifications]);

  const handleNotificationAction = useCallback(async (notification: Notification, actionType: 'read' | 'delete') => {
    try {
      if (actionType === 'read') {
        await markAsRead([notification.id]);
      } else if (actionType === 'delete') {
        await deleteNotification(notification.id);
      }
    } catch (error) {
      console.error(`Failed to ${actionType} notification:`, error);
    }
  }, [markAsRead, deleteNotification]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notifications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your notifications and stay updated with important activities.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        {/* Header with stats and controls */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" component="div">
                All Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.unread} unread of {stats.total} total
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Filters */}
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                label="Type"
                onChange={(e: SelectChangeEvent) => setFilterType(e.target.value as NotificationType | 'all')}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="order">Orders</MenuItem>
                <MenuItem value="payment">Payments</MenuItem>
                <MenuItem value="kyc">KYC</MenuItem>
                <MenuItem value="security">Security</MenuItem>
                <MenuItem value="wallet">Wallet</MenuItem>
                <MenuItem value="seller">Seller</MenuItem>
                <MenuItem value="system">System</MenuItem>
                <MenuItem value="promotion">Promotions</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filterPriority}
                label="Priority"
                onChange={(e: SelectChangeEvent) => setFilterPriority(e.target.value as NotificationPriority | 'all')}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            {stats.unread > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={handleMarkAllAsRead}
              >
                Mark All Read
              </Button>
            )}
          </Stack>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                All
                <Chip label={stats.total} size="small" />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Unread
                <Chip label={stats.unread} size="small" color="error" />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Read
                <Chip label={stats.total - stats.unread} size="small" />
              </Box>
            } 
          />
        </Tabs>

        {/* Bulk actions toolbar */}
        {selectedIds.length > 0 && (
          <Toolbar
            sx={{
              bgcolor: 'action.selected',
              minHeight: '48px !important',
              px: 2,
            }}
          >
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {selectedIds.length} selected
            </Typography>
            <IconButton onClick={handleBulkMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={bulkMenuAnchor}
              open={Boolean(bulkMenuAnchor)}
              onClose={handleBulkMenuClose}
            >
              <MenuItem onClick={handleBulkMarkAsRead}>
                <DoneAllIcon sx={{ mr: 1 }} />
                Mark as Read
              </MenuItem>
              <MenuItem onClick={handleBulkDelete} sx={{ color: 'error.main' }}>
                <DeleteIcon sx={{ mr: 1 }} />
                Delete
              </MenuItem>
            </Menu>
          </Toolbar>
        )}

        {/* Notification list */}
        <TabPanel value={tabValue} index={0}>
          <NotificationList 
            notifications={filteredNotifications}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectNotification={handleSelectNotification}
            onNotificationAction={handleNotificationAction}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <NotificationList 
            notifications={filteredNotifications}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectNotification={handleSelectNotification}
            onNotificationAction={handleNotificationAction}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <NotificationList 
            notifications={filteredNotifications}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectNotification={handleSelectNotification}
            onNotificationAction={handleNotificationAction}
          />
        </TabPanel>
      </Paper>
    </Container>
  );
};

interface NotificationListProps {
  notifications: Notification[];
  selectedIds: string[];
  onSelectAll: () => void;
  onSelectNotification: (id: string) => void;
  onNotificationAction: (notification: Notification, action: 'read' | 'delete') => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  selectedIds,
  onSelectAll,
  onSelectNotification,
  onNotificationAction,
}) => {
  if (notifications.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No notifications
        </Typography>
        <Typography variant="body2" color="text.disabled">
          You're all caught up! New notifications will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {/* Select all row */}
      <ListItem sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Checkbox
          checked={selectedIds.length === notifications.length}
          indeterminate={selectedIds.length > 0 && selectedIds.length < notifications.length}
          onChange={onSelectAll}
        />
        <ListItemText 
          primary={
            <Typography variant="body2" color="text.secondary">
              Select all ({notifications.length})
            </Typography>
          }
        />
      </ListItem>

      {/* Notifications */}
      {notifications.map((notification, index) => {
        const unread = isNotificationUnread(notification);
        return (
        <ListItem
          key={notification.id}
          sx={{
            borderBottom: index < notifications.length - 1 ? 1 : 0,
            borderColor: 'divider',
            bgcolor: unread 
              ? 'rgba(25, 118, 210, 0.08)' // Subtle blue background for unread
              : 'transparent',
            borderLeft: unread ? '4px solid' : '4px solid transparent',
            borderLeftColor: unread ? 'primary.main' : 'transparent',
            boxShadow: unread 
              ? '0 1px 2px rgba(25, 118, 210, 0.15)' 
              : 'none',
            '&:hover': { 
              bgcolor: unread 
                ? 'rgba(25, 118, 210, 0.12)' 
                : 'action.selected' 
            },
          }}
        >
          <Checkbox
            checked={selectedIds.includes(notification.id)}
            onChange={() => onSelectNotification(notification.id)}
          />
          <ListItemAvatar>
            <Avatar
              sx={{
                bgcolor: unread 
                  ? `${getTypeColor(notification.type)}.main` 
                  : `${getTypeColor(notification.type)}.light`,
                color: unread 
                  ? 'white' 
                  : `${getTypeColor(notification.type)}.dark`,
                boxShadow: unread 
                  ? '0 2px 8px rgba(25, 118, 210, 0.3)' 
                  : 'none',
              }}
            >
              {getTypeIcon(notification.type)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {unread && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      flexShrink: 0,
                    }}
                  />
                )}
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: unread ? 600 : 400,
                    flex: 1,
                    color: unread ? 'primary.main' : 'text.primary',
                  }}
                >
                  {notification.title}
                </Typography>
                <Chip
                  label={notification.priority}
                  size="small"
                  color={getPriorityColor(notification.priority) as any}
                  sx={{ 
                    fontWeight: unread ? 600 : 400,
                  }}
                />
              </Box>
            }
            secondary={
              <Box>
                <Typography 
                  variant="body2" 
                  color={unread ? 'text.primary' : 'text.secondary'} 
                  sx={{ 
                    mb: 1,
                    fontWeight: unread ? 500 : 400,
                  }}
                >
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </Typography>
              </Box>
            }
          />
          <ListItemSecondaryAction>
            <Stack direction="row" spacing={1}>
              {unread && (
                <Tooltip title="Mark as read">
                  <IconButton
                    size="small"
                    onClick={() => onNotificationAction(notification, 'read')}
                  >
                    <DoneAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => onNotificationAction(notification, 'delete')}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </ListItemSecondaryAction>
        </ListItem>
      );})}
    </List>
  );
};

export default NotificationsPage;