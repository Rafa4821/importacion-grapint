'use client';

import React, { useState, useEffect } from 'react';
import PushNotificationManager from '@/components/notifications/PushNotificationManager';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import ManualReportGenerator from '@/components/notifications/ManualReportGenerator';
import NotificationHistory from '@/components/notifications/NotificationHistory';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Provider, OrderStatus } from '@/types';

type Tab = 'history' | 'settings' | 'reports';

const orderStatuses: OrderStatus[] = [
  'Gestionado',
  'En respuesta de proveedor',
  'Primer pago',
  'Invoice recibido por proveedor',
  'AWB/ADS recibido',
  'Enviado a Aduana',
  'Recibido en local',
  'Recibido en bodega Miami',
  'En tránsito',
  'Pagado'
];

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('reports');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      try {
        const providersSnapshot = await getDocs(collection(db, 'providers'));
        const providersList = providersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Provider));
        setProviders(providersList);
      } catch (error) {
        console.error("Failed to fetch providers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Centro de Notificaciones</h1>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('history')} className={`${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Historial</button>
          <button onClick={() => setActiveTab('settings')} className={`${activeTab === 'settings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Configuración</button>
          <button onClick={() => setActiveTab('reports')} className={`${activeTab === 'reports' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Reportes</button>
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
        {activeTab === 'reports' && (
          isLoading ? <p>Cargando datos del formulario...</p> : 
          <ManualReportGenerator 
            providers={providers} 
            orderStatuses={orderStatuses} 
            defaultEmail={process.env.NEXT_PUBLIC_DEFAULT_RECIPIENT_EMAIL || 'tu-email@ejemplo.com'} 
          />
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
