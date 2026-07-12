import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, List, ListItem, ListItemText,
  ListItemIcon, IconButton, Button, Chip, CircularProgress, Divider,
} from '@mui/material';
import { Notifications, NotificationsNone, DoneAll, Circle } from '@mui/icons-material';
import { notificationApi } from '../../api/axios';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  INFO: 'info', SUCCESS: 'success', WARNING: 'warning', ERROR: 'error',
  ATTENDANCE: 'primary', FEE: 'secondary', HOMEWORK: 'default', LEAVE: 'warning',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationApi.getAll({ limit: 50 });
      const list = data.data || data;
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { toast.error('Failed'); }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed'); }
  };

  const timeAgo = (d) => {
    const diff = Date.now() - new Date(d);
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight={700}>Notifications</Typography>
          {unreadCount > 0 && <Chip label={`${unreadCount} unread`} size="small" color="primary" />}
        </Box>
        {unreadCount > 0 && (
          <Button startIcon={<DoneAll />} onClick={markAllRead}>Mark all read</Button>
        )}
      </Box>

      <Card>
        {loading ? <Box textAlign="center" py={6}><CircularProgress /></Box> : (
          <List disablePadding>
            {notifications.map((n, idx) => (
              <React.Fragment key={n.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ bgcolor: n.isRead ? 'transparent' : 'action.hover', px: 2, py: 1.5 }}
                  secondaryAction={
                    !n.isRead && (
                      <IconButton size="small" onClick={() => markRead(n.id)} title="Mark as read">
                        <Circle sx={{ fontSize: 10, color: 'primary.main' }} />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon sx={{ mt: 0.5, minWidth: 36 }}>
                    {n.isRead
                      ? <NotificationsNone fontSize="small" color="disabled" />
                      : <Notifications fontSize="small" color="primary" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={n.isRead ? 400 : 700}>{n.title}</Typography>
                        {n.type && (
                          <Chip label={n.type} size="small"
                            color={TYPE_COLORS[n.type] || 'default'} sx={{ height: 18, fontSize: 10 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">{n.message}</Typography>
                        <Typography variant="caption" color="text.disabled" display="block">
                          {timeAgo(n.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {idx < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            {!notifications.length && (
              <ListItem>
                <ListItemText>
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    No notifications
                  </Typography>
                </ListItemText>
              </ListItem>
            )}
          </List>
        )}
      </Card>
    </Box>
  );
};

export default NotificationsPage;
