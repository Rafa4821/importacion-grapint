'use client';

import React, { useState } from 'react';
import PushNotificationManager from '@/components/notifications/PushNotificationManager';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import NotificationHistory from '@/components/notifications/NotificationHistory';

type Tab = 'history' | 'settings';

import { Container, Typography, Box, Tabs, Tab, Paper } from '@mui/material';

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('history');

  const handleTabChange = (event: React.SyntheticEvent, newValue: Tab) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Centro de Notificaciones
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="pestañas de notificaciones">
          <Tab label="Historial" value="history" />
          <Tab label="Configuración" value="settings" />
        </Tabs>
      </Box>

      <Box>
        {activeTab === 'history' && <NotificationHistory />}
        {activeTab === 'settings' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Notificaciones Push del Navegador</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Activa las notificaciones en tu navegador para recibir alertas instantáneas.
              </Typography>
              <PushNotificationManager />
            </Paper>
            <NotificationSettings />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default NotificationsPage;
