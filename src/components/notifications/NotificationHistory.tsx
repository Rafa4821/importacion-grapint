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
  Divider,
} from '@mui/material';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';

interface Notification {
  id: string;
  channel: 'push' | 'email' | 'inApp';
  title: string;
  body: string;
  createdAt: Timestamp; // Changed from string to Timestamp
  isRead: boolean;
  referenceUrl?: string;
}

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notifs = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Notification)
        );
        setNotifications(notifs);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching notification history:', err);
        setError('No se pudo cargar el historial de notificaciones.');
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <Box>
        {[...Array(5)].map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={70}
            sx={{ mb: 2, borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'error.light',
        }}
      >
        <ErrorOutline color="error" />
        <Typography color="error.dark">Error: {error}</Typography>
      </Paper>
    );
  }

  if (notifications.length === 0) {
    return (
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
        No hay notificaciones para mostrar.
      </Typography>
    );
  }

  return (
    <Paper elevation={2}>
      <List sx={{ p: 0 }}>
        {notifications.map((notification, index) => (
          <React.Fragment key={notification.id}>
            <ListItem
              sx={{ bgcolor: notification.isRead ? 'transparent' : 'action.hover' }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor:
                      notification.channel === 'email'
                        ? 'success.main'
                        : 'primary.main',
                  }}
                >
                  {notification.channel === 'email' ? <Email /> : <Notifications />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={notification.title}
                secondary={notification.body}
                primaryTypographyProps={{ sx: { wordBreak: 'break-word' } }}
                secondaryTypographyProps={{ sx: { wordBreak: 'break-word' } }}
              />
              <Box sx={{ textAlign: 'right', ml: 2, minWidth: '120px' }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(notification.createdAt.toDate(), {
                    addSuffix: true,
                    locale: es,
                  })}
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
