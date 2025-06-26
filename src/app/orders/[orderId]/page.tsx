'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order } from '@/types';
import { getOrderById } from '@/services/orderService';
import { ArrowLeft } from 'lucide-react';

const formatDate = (timestamp: any) => {
  if (!timestamp || !timestamp.toDate) return 'N/A';
  return new Date(timestamp.toDate()).toLocaleDateString('es-CL');
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount);
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          setLoading(true);
          const fetchedOrder = await getOrderById(orderId);
          if (fetchedOrder) {
            setOrder(fetchedOrder);
          } else {
            setError('El pedido no fue encontrado.');
          }
        } catch (err) {
          setError('Error al cargar el pedido.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return <div className="text-center p-10">Cargando detalles del pedido...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  if (!order) {
    return <div className="text-center p-10">No se encontró el pedido.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/orders" className="flex items-center text-blue-600 hover:underline">
          <ArrowLeft size={18} className="mr-2" />
          Volver a la lista de pedidos
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pedido #{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">Proveedor: {order.providerName}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${order.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {order.isPaid ? 'Pagado' : 'Pendiente'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="font-semibold text-gray-700">Información General</h3>
            <ul className="mt-2 space-y-2 text-gray-600">
              <li><strong>Fecha del Pedido:</strong> {formatDate(order.orderDate)}</li>
              <li><strong>Monto Total:</strong> {formatCurrency(order.totalAmount, order.currency)}</li>
              <li><strong>Estado Actual:</strong> {order.status}</li>
              {order.invoiceNumber && <li><strong>Nº Factura:</strong> {order.invoiceNumber}</li>}
              {order.invoiceDate && <li><strong>Fecha Factura:</strong> {formatDate(order.invoiceDate)}</li>}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">Cuotas de Pago</h3>
            {order.installments.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {order.installments.map((inst, index) => (
                  <li key={index} className="flex justify-between items-center p-2 rounded bg-gray-50">
                    <span>
                      Vencimiento: {formatDate(inst.dueDate)} - {formatCurrency(inst.amount, order.currency)}
                    </span>
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${inst.status === 'pagado' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                      {inst.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 mt-2">No hay cuotas definidas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
