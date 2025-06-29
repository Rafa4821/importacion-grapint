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

const PushNotificationManager: React.FC = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('PushNotificationManager: Componente montado.');

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('PushNotificationManager: ¡ERROR CRÍTICO! La clave VAPID pública no está definida. Verifica tu archivo .env.local y reinicia el servidor.');
      setIsLoading(false);
      return;
    }
    console.log('PushNotificationManager: La clave VAPID pública se ha cargado correctamente.');

    const initializePushManager = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('PushNotificationManager: Las notificaciones push no son soportadas por este navegador.');
        setIsLoading(false);
        return;
      }

      try {
        console.log('PushNotificationManager: Registrando el Service Worker...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PushNotificationManager: Service Worker registrado con éxito.', registration);

        console.log('PushNotificationManager: Esperando a que el Service Worker esté listo (ready)...');
        await navigator.serviceWorker.ready; // Esperamos a que esté activo
        console.log('PushNotificationManager: Service Worker está listo.');

        console.log('PushNotificationManager: Obteniendo suscripción existente...');
        const subscription = await registration.pushManager.getSubscription();
        console.log('PushNotificationManager: Suscripción encontrada:', subscription);

        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('PushNotificationManager: Error durante la inicialización:', error);
      } finally {
        console.log('PushNotificationManager: Inicialización finalizada.');
        setIsLoading(false);
      }
    };

    initializePushManager();
  }, []);

  const handleSubscriptionChange = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Las notificaciones push no son soportadas por este navegador.');
      return;
    }

    setIsLoading(true);
    const registration = await navigator.serviceWorker.register('/sw.js');
    const existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
      // Si ya está suscrito, cancelamos la suscripción
      await existingSubscription.unsubscribe();
      try {
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: existingSubscription.endpoint }),
        });
        console.log('Suscripción eliminada del backend.');
      } catch (error) {
        console.error('Error al eliminar la suscripción del backend:', error);
      }
      console.log('Suscripción cancelada.');
      setIsSubscribed(false);
    } else {
      // Si no está suscrito, pedimos permiso y creamos una nueva suscripción
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Permiso para notificaciones denegado.');
        setIsLoading(false);
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key no encontrada.');
        alert('Error de configuración: No se encontró la clave VAPID pública.');
        setIsLoading(false);
        return;
      }

      console.log('PushNotificationManager: Intentando suscribir con la clave pública:', vapidPublicKey);

      try {
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        console.log('PushNotificationManager: Suscripción creada en el navegador:', newSubscription);

        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSubscription),
        });

        console.log('Nueva suscripción guardada en el backend.');
        alert('¡Suscrito a las notificaciones con éxito!');
        setIsSubscribed(true);

      } catch (error) {
        console.error('PushNotificationManager: Falló la suscripción con el push service.', error);
        alert('Error al suscribirse. Por favor, revisa la consola para más detalles. Asegúrate de que las notificaciones no estén bloqueadas para este sitio en la configuración de tu navegador y que no haya extensiones interfiriendo.');
        setIsSubscribed(false);
      }
    }
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px' }}>
      <h4>Gestión de Notificaciones Push</h4>
      <p>Recibe alertas instantáneas en tu navegador sobre vencimientos.</p>
      <button onClick={handleSubscriptionChange} disabled={isLoading}>
        {isLoading ? 'Cargando...' : (isSubscribed ? 'Cancelar Suscripción' : 'Activar Notificaciones')}
      </button>
    </div>
  );
};

export default PushNotificationManager;
