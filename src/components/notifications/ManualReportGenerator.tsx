'use client';

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Provider, OrderStatus } from '@/types';

interface ReportFormData {
  providerId: string; // 'all' or a specific provider ID
  status: string; // 'all' or a specific status
  startDate: string;
  endDate: string;
  recipientEmail: string;
}

interface ManualReportGeneratorProps {
  providers: Provider[];
  orderStatuses: OrderStatus[];
  defaultEmail: string;
}

const ManualReportGenerator = ({ providers, orderStatuses, defaultEmail }: ManualReportGeneratorProps) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ReportFormData>({
    defaultValues: {
      providerId: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
      recipientEmail: defaultEmail,
    }
  });

  const onSubmit: SubmitHandler<ReportFormData> = async (data) => {
    try {
      const response = await fetch('/api/reports/send-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ocurrió un error al enviar el reporte.');
      }

      toast.success('Reporte enviado con éxito.');
      reset(); // Limpiar el formulario
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
      toast.error(`Error al enviar el reporte: ${errorMessage}`);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">Generar Reporte Manual</h2>
      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600 mb-4">Selecciona los filtros para generar un resumen de pedidos y enviarlo por correo electrónico.</p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por Proveedor */}
            <div>
              <label htmlFor="providerId" className="block font-medium text-sm">Proveedor</label>
              <select {...register('providerId')} className="w-full p-2 border rounded mt-1">
                <option value="all">Todos los proveedores</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.companyName}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div>
              <label htmlFor="status" className="block font-medium text-sm">Estado del Pedido</label>
              <select {...register('status')} className="w-full p-2 border rounded mt-1">
                <option value="all">Todos los estados</option>
                {orderStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Fecha */}
            <div>
              <label htmlFor="startDate" className="block font-medium text-sm">Desde la fecha</label>
              <input type="date" {...register('startDate')} className="w-full p-2 border rounded mt-1" />
            </div>
            <div>
              <label htmlFor="endDate" className="block font-medium text-sm">Hasta la fecha</label>
              <input type="date" {...register('endDate')} className="w-full p-2 border rounded mt-1" />
            </div>
          </div>

          {/* Destinatario */}
          <div>
            <label htmlFor="recipientEmail" className="block font-medium text-sm">Enviar a</label>
            <input type="email" {...register('recipientEmail', { required: 'El email es requerido' })} className="w-full p-2 border rounded mt-1" />
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400">
              {isSubmitting ? 'Enviando...' : 'Generar y Enviar Reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualReportGenerator;
