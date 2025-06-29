'use client';

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';

// Esta interfaz debe coincidir con la definida en la API
interface NotificationPreferences {
  alerts: {
    paymentDueSoon: { push: boolean; email: boolean; daysBefore: number };
    paymentOverdue: { push: boolean; email: boolean };
    orderStatusChanged: { push: boolean; email: boolean };
  };
}

const NotificationSettings = () => {
  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<NotificationPreferences>();

  useEffect(() => {
    // Cargar las preferencias del usuario al montar el componente
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences');
        if (!response.ok) throw new Error('Failed to fetch preferences');
        const data: NotificationPreferences = await response.json();
        reset(data); // Cargar los datos en el formulario
      } catch (error) {
        console.error(error);
        toast.error('Error al cargar la configuración.');
      }
    };
    fetchPreferences();
  }, [reset]);

  const onSubmit: SubmitHandler<NotificationPreferences> = async (data) => {
    const promise = fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async (response) => {
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Error al guardar');
      }
      return response.json();
    });

    toast.promise(promise, {
      loading: 'Guardando preferencias...',
      success: (result) => {
        reset(result.updatedPrefs);
        return '¡Preferencias guardadas con éxito!';
      },
      error: (err) => `Error: ${err.message}`,
    });
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium">Preferencias de Alertas</h3>
      <p className="text-sm text-gray-600 mb-4">Elige qué notificaciones quieres recibir y por qué canal.</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Alerta: Cuotas por Vencer */}
        <div>
          <label className="font-semibold text-gray-800">Cuotas próximas a vencer</label>
          <div className="flex items-center space-x-6 mt-2">
            <label className="flex items-center">
              <input type="checkbox" {...register('alerts.paymentDueSoon.push')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <span className="ml-2 text-sm">Notificación Push</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" {...register('alerts.paymentDueSoon.email')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <span className="ml-2 text-sm">Email</span>
            </label>
          </div>
        </div>

        {/* Alerta: Cuotas Vencidas (Obligatorias) */}
        <div>
          <label className="font-semibold text-gray-800">Cuotas vencidas</label>
          <div className="flex items-center space-x-6 mt-2">
            <label className="flex items-center">
              <input type="checkbox" {...register('alerts.paymentOverdue.push')} checked disabled className="h-4 w-4 text-gray-400 border-gray-300 rounded" />
              <span className="ml-2 text-sm text-gray-500">Notificación Push (Obligatoria)</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" {...register('alerts.paymentOverdue.email')} checked disabled className="h-4 w-4 text-gray-400 border-gray-300 rounded" />
              <span className="ml-2 text-sm text-gray-500">Email (Obligatorio)</span>
            </label>
          </div>
        </div>

        {/* Alerta: Cambio de Estado del Pedido */}
        <div>
          <label className="font-semibold text-gray-800">Actualización en el estado de un pedido</label>
          <div className="flex items-center space-x-6 mt-2">
            <label className="flex items-center">
              <input type="checkbox" {...register('alerts.orderStatusChanged.push')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <span className="ml-2 text-sm">Notificación Push</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" {...register('alerts.orderStatusChanged.email')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <span className="ml-2 text-sm">Email</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end items-center pt-4">
          <button type="submit" disabled={isSubmitting || !isDirty} className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
            {isSubmitting ? 'Guardando...' : 'Guardar Preferencias'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationSettings;
