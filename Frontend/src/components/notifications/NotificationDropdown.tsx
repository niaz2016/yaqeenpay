// src/components/notifications/NotificationDropdown.tsx
import React, { useState, useCallback } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
  List,
  ListItem,
  Avatar,
  Button,
  Chip,
  Stack,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../context/NotificationContext';
import type { Notification, NotificationType } from '../../types/notification';

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
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'success';
    default: return 'default';
  }
};

// Robust unread detection helper accommodates different backend representations
const isNotificationUnread = (n: Notification): boolean => {
  if (!n) return false;
  const status = (n.status ?? '').toString().toLowerCase();
  if (status === 'unread') return true;
  if (status === 'read' || status === 'archived') return false;
  // Some legacy payloads might expose a boolean 'read'
  if ((n as any).read !== undefined) {
    const val = (n as any).read;
    if (typeof val === 'boolean') return !val;
  }
  // Fallback: if no readAt timestamp present treat as unread
  if (!n.readAt) return true;
  return false;
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(notification.id);
    handleMenuClose();
  };

  const handleItemClick = (event: React.MouseEvent) => {
    // Don't expand if clicking on action buttons
    if ((event.target as HTMLElement).closest('.notification-actions')) {
      return;
    }
    
    setExpanded(!expanded);
    onClick?.(notification);
  };

  const handleMarkAsReadClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const unread = isNotificationUnread(notification);

  return (
    <>
      <ListItem
        component="div"
        onClick={handleItemClick}
        sx={{
          cursor: 'pointer',
          bgcolor: unread 
            ? 'rgba(25, 118, 210, 0.15)' // More prominent blue background
            : 'transparent',
          borderLeft: unread ? '6px solid' : '3px solid transparent',
          borderLeftColor: unread ? 'primary.main' : 'transparent',
          opacity: unread ? 1 : 0.65,
          boxShadow: unread 
            ? '0 2px 4px rgba(25, 118, 210, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)' 
            : 'none',
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            bgcolor: unread 
              ? 'rgba(25, 118, 210, 0.22)' 
              : 'action.selected',
            opacity: 1,
            transform: 'translateY(-1px)',
            boxShadow: unread 
              ? '0 3px 6px rgba(25, 118, 210, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)' 
              : '0 1px 3px rgba(0,0,0,0.1)',
          },
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        {/* Main notification content */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 1 }}>
          <Avatar
            sx={{
              bgcolor: unread 
                ? `${getTypeColor(notification.type)}.main` 
                : `${getTypeColor(notification.type)}.light`,
              color: unread 
                ? 'white' 
                : `${getTypeColor(notification.type)}.dark`,
              width: 40,
              height: 40,
              boxShadow: unread 
                ? '0 2px 8px rgba(25, 118, 210, 0.3)' 
                : 'none',
            }}
          >
            {getTypeIcon(notification.type)}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Title row */}
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
                  fontSize: '0.7rem',
                  fontWeight: unread ? 600 : 400,
                }}
              />
            </Box>

            {/* Message preview - expands to show full content when clicked */}
            <Typography
              variant="body2"
              color={unread ? 'text.primary' : 'text.secondary'}
              sx={{
                display: expanded ? 'block' : '-webkit-box',
                WebkitLineClamp: expanded ? 'unset' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: expanded ? 'visible' : 'hidden',
                mb: 0.5,
                fontWeight: unread ? 500 : 400,
                whiteSpace: expanded ? 'pre-wrap' : 'normal',
                wordBreak: 'break-word',
              }}
            >
              {notification.message}
            </Typography>
            
            {/* Additional details when expanded */}
            {expanded && (
              <Box sx={{ mt: 1, pl: 1, borderLeft: 2, borderColor: 'primary.main', bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 1, p: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {notification.readAt && ` • Read: ${formatDistanceToNow(new Date(notification.readAt), { addSuffix: true })}`}
                </Typography>
                
                {/* Actions if any */}
                {notification.actions && notification.actions.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {notification.actions.map((action) => (
                      <Button
                        key={action.id}
                        size="small"
                        variant={action.variant || 'outlined'}
                        color={action.color || 'primary'}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.action?.();
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Box>
                )}
                
                {/* Redirect URL if any */}
                {notification.redirectUrl && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = notification.redirectUrl!;
                    }}
                  >
                    View Details →
                  </Button>
                )}
              </Box>
            )}

            {/* Metadata row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
              <Typography variant="caption" color="text.disabled">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" color="primary.main" sx={{ fontStyle: 'italic' }}>
                  {notification.actions && notification.actions.length > 0 && 
                    ` • ${notification.actions.length} action${notification.actions.length > 1 ? 's' : ''} available`
                  }
                </Typography>
                {expanded ? (
                  <ExpandLessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                )}
              </Box>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box className="notification-actions" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
            {/* Mark as read button for all notifications */}
            {unread && (
              <Tooltip title="Mark as read">
                <IconButton
                  size="small"
                  onClick={handleMarkAsReadClick}
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {/* Options menu */}
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </ListItem>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {notification.status === 'unread' && (
          <MenuItem onClick={handleMarkAsRead}>
            <DoneAllIcon sx={{ mr: 1, fontSize: 'small' }} />
            Mark as read
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 'small' }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

interface NotificationDropdownProps {
  maxHeight?: number;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ maxHeight = 500 }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const {
    notifications,
    stats,
    loading,
    error,
    fetchNewNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Debug logging
  console.log('[NotificationDropdown] Render:', { 
    statsUnread: stats.unread, 
    statsTotal: stats.total,
    showButton: stats.unread > 0,
    notificationsCount: notifications.length 
  });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = useCallback(() => {
    // Only import new notifications to avoid reloading UI state
    fetchNewNotifications({ limit: 20 });
  }, [fetchNewNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [markAllAsRead]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsRead([notificationId]);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [markAsRead]);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [deleteNotification]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    // Handle actions if available
    if (notification.actions && notification.actions.length > 0) {
      const primaryAction = notification.actions[0];
      if (primaryAction.url) {
        window.location.href = primaryAction.url;
      } else if (primaryAction.action) {
        primaryAction.action();
      }
    }
    // Don't close the dropdown when clicking on notifications
  }, []);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          size="large"
          sx={{ mr: 1 }}
        >
          <Badge 
            badgeContent={stats.unread} 
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                animation: stats.unread > 0 ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' },
                  '100%': { transform: 'scale(1)' },
                },
              },
            }}
          >
            <NotificationsIcon 
              sx={{ 
                color: stats.unread > 0 ? 'primary.main' : 'inherit',
                fontSize: stats.unread > 0 ? '1.4rem' : '1.2rem',
                transition: 'all 0.2s ease-in-out',
              }} 
            />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: maxHeight,
            mt: 1,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" component="div">
              Notifications
            </Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={handleRefresh} disabled={loading}>
                  {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton size="small">
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {stats.unread} unread of {stats.total} total
            </Typography>
            {stats.unread > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                startIcon={<DoneAllIcon />}
                sx={{ minWidth: 'auto' }}
              >
                Mark all read
              </Button>
            )}
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ maxHeight: maxHeight - 120, overflowY: 'auto' }}>
          {error && (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">
                {error}
              </Alert>
            </Box>
          )}
          
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDeleteNotification}
                    onClick={handleNotificationClick}
                  />
                  {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {/* notifications.length > 0 && (
          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
            <Button size="small" fullWidth>
              View All Notifications
            </Button>
          </Box>
        ) */}
      </Menu>
    </>
  );
};

export default NotificationDropdown;