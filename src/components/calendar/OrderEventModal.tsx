'use client';

import Link from 'next/link';
import { X } from 'lucide-react';

// Definimos el tipo para la información del evento que recibirá el modal
export interface EventInfo {
  orderId: string;
  title: string; // e.g., "Vencimiento Pedido #123"
  providerName: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: 'pendiente' | 'pagado';
}

interface OrderEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventInfo: EventInfo | null;
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount);
};

export const OrderEventModal = ({ isOpen, onClose, eventInfo }: OrderEventModalProps) => {
  if (!isOpen || !eventInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">{eventInfo.title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-3 text-gray-700">
            <p><strong>Proveedor:</strong> {eventInfo.providerName}</p>
            <p><strong>Fecha de Vencimiento:</strong> {eventInfo.dueDate}</p>
            <p><strong>Monto a Pagar:</strong> {formatCurrency(eventInfo.amount, eventInfo.currency)}</p>
            <div className="flex items-center">
              <strong className="mr-2">Estado:</strong>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${eventInfo.status === 'pagado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {eventInfo.status}
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link href={`/orders/${eventInfo.orderId}`} passHref>
              <button
                onClick={onClose} // Cierra el modal al navegar
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver Detalles del Pedido
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
