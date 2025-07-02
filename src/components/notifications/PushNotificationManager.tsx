'use client';

import React, { useState, useEffect } from 'react';

// Función para convertir la VAPID key de base64 a un formato que el navegador entienda
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

import { Button, Box, CircularProgress, Alert } from '@mui/material';

const PushNotificationManager: React.FC = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }
    if (!vapidPublicKey) {
      setError('La clave VAPID pública no está configurada.');
      setIsLoading(false);
      return;
    }

    const initializePushManager = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        setNotificationPermission(Notification.permission);
      } catch (err) {
        setError('Error al inicializar el gestor de notificaciones.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    initializePushManager();
  }, []);

  const handleSubscriptionChange = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        await existingSubscription.unsubscribe();
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existingSubscription.endpoint }),
        });
        setIsSubscribed(false);
      } else {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission !== 'granted') {
          setError('El permiso para recibir notificaciones fue denegado.');
          setIsLoading(false);
          return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSubscription),
        });
        setIsSubscribed(true);
      }
    } catch (err) {
      setError('Ocurrió un error al gestionar la suscripción.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return <Alert severity="warning">Las notificaciones push no son soportadas por este navegador.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notificationPermission === 'denied' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Has bloqueado las notificaciones. Para activarlas, debes cambiar los permisos en la configuración de tu navegador para este sitio.
        </Alert>
      )}
      {notificationPermission === 'default' && !isSubscribed && (
         <Alert severity="info" sx={{ mb: 2 }}>
          Para recibir alertas, activa las notificaciones cuando tu navegador te lo solicite.
        </Alert>
      )}

      <Button
        variant="contained"
        color={isSubscribed ? 'error' : 'primary'}
        onClick={handleSubscriptionChange}
        disabled={isLoading || notificationPermission === 'denied'}
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {isLoading ? 'Procesando...' : (isSubscribed ? 'Cancelar Suscripción' : 'Activar Notificaciones')}
      </Button>
    </Box>
  );
};

export default PushNotificationManager;
