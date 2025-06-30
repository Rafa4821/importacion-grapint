'use client';

import React, { useState } from 'react';
import PushNotificationManager from '@/components/notifications/PushNotificationManager';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import NotificationHistory from '@/components/notifications/NotificationHistory';

type Tab = 'history' | 'settings';

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('history');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Centro de Notificaciones</h1>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('history')} className={`${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Historial</button>
          <button onClick={() => setActiveTab('settings')} className={`${activeTab === 'settings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Configuración</button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'history' && (
          <NotificationHistory />
        )}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-semibold">Configuración de Alertas</h2>
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium">Notificaciones Push del Navegador</h3>
              <p className="text-sm text-gray-600 mb-4">Activa las notificaciones en tu navegador para recibir alertas instantáneas.</p>
              <PushNotificationManager />
            </div>
            <NotificationSettings />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
