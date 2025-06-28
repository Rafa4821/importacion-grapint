// Este es nuestro Service Worker.
// Se ejecutará en segundo plano en el navegador del usuario.

// Escucha el evento 'push' que nuestro servidor enviará.
self.addEventListener('push', (event) => {
  // Extraemos los datos de la notificación que vienen en el evento push.
  const data = event.data.json();
  
  const title = data.title || 'Nueva Notificación';
  const options = {
    body: data.body || 'Tienes una nueva alerta.',
    icon: '/icon-192x192.png', // Opcional: un ícono para la notificación
    badge: '/badge-72x72.png', // Opcional: un ícono más pequeño
    data: {
      url: data.url || '/'
    }
  };

  // Le decimos al navegador que muestre la notificación.
  // waitUntil asegura que el service worker no se termine antes de que la notificación se muestre.
  event.waitUntil(self.registration.showNotification(title, options));
});

// Escucha el evento 'notificationclick' para cuando el usuario hace clic en la notificación.
self.addEventListener('notificationclick', (event) => {
  // Cierra la notificación.
  event.notification.close();

  // Abre la URL que le pasamos en los datos de la notificación o la página principal.
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
