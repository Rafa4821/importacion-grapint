'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Mail } from 'lucide-react';

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
    return <p>Cargando historial...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (notifications.length === 0) {
    return <p>No hay notificaciones para mostrar.</p>;
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div key={notification.id} className={`p-4 border rounded-lg flex items-start space-x-4 ${notification.isRead ? 'bg-gray-50' : 'bg-white'}`}>
          <div className="flex-shrink-0">
            {notification.channel === 'push' ? 
              <Bell className="w-6 h-6 text-blue-500" /> : 
              <Mail className="w-6 h-6 text-green-500" />
            }
          </div>
          <div className="flex-grow">
            <h3 className="font-semibold">{notification.title}</h3>
            <p className="text-sm text-gray-700">{notification.body}</p>
            <p className="text-xs text-gray-500 mt-2">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
            </p>
          </div>
          {!notification.isRead && (
            <div className="flex-shrink-0">
              <span className="w-3 h-3 bg-blue-500 rounded-full block" title="No leído"></span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationHistory;
