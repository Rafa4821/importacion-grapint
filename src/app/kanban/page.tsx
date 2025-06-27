'use client';

import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types';
import { getOrders, updateOrderStatus } from '@/services/orderService';
import OrderWorkflow from '@/components/orders/OrderWorkflow';
import toast from 'react-hot-toast';

export default function KanbanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const ordersData = await getOrders();
      setOrders(ordersData);
    } catch {
      toast.error('Error al cargar los pedidos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

    const handleOrderStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    const promise = updateOrderStatus(orderId, newStatus).then(() => {
      // After a successful update, refetch all orders to get the updated installments
      fetchOrders();
    });

    toast.promise(promise, {
      loading: 'Actualizando estado...',
      success: '¡Estado actualizado con éxito!',
      error: 'Error al actualizar el estado.',
    });
  };

  return (
        <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Seguimiento de Pedidos</h1>
      {isLoading ? (
                <p className="text-center text-gray-500">Cargando seguimiento...</p>
      ) : (
        <OrderWorkflow orders={orders} onOrderStatusUpdate={handleOrderStatusUpdate} />
      )}
    </div>
  );
}
