'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Notifications, Email, ErrorOutline } from '@mui/icons-material';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Paper,
  Skeleton,
  Chip,
  Divider
} from '@mui/material';

interface Notification {
  id: string;
  channel: 'push' | 'email';
  title: string;
  body: string;
  createdAt: string; // ISO string date
  isRead: boolean;
  referenceUrl?: string;
}

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/notifications/history');
        if (!response.ok) {
          throw new Error('No se pudo cargar el historial.');
        }
        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <Box>
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={70} sx={{ mb: 2, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'error.light' }}>
        <ErrorOutline color="error" />
        <Typography color="error.dark">Error: {error}</Typography>
      </Paper>
    );
  }

  if (notifications.length === 0) {
    return <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>No hay notificaciones para mostrar.</Typography>;
  }

  return (
    <Paper elevation={2}>
      <List sx={{ p: 0 }}>
        {notifications.map((notification, index) => (
          <React.Fragment key={notification.id}>
            <ListItem sx={{ bgcolor: notification.isRead ? 'transparent' : 'action.hover' }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: notification.channel === 'push' ? 'primary.main' : 'success.main' }}>
                  {notification.channel === 'push' ? <Notifications /> : <Email />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={notification.title}
                secondary={notification.body}
              />
              <Box sx={{ textAlign: 'right', ml: 2, minWidth: '120px' }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                </Typography>
                {!notification.isRead && (
                  <Chip label="Nuevo" size="small" color="primary" sx={{ mt: 0.5 }} />
                )}
              </Box>
            </ListItem>
            {index < notifications.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default NotificationHistory;
