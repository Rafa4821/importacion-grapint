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
    } catch (error) {
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
      // Optimistically update the local state
      setOrders(prevOrders =>
        prevOrders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    });

    toast.promise(promise, {
      loading: 'Actualizando estado...',
      success: '¡Estado actualizado con éxito!',
      error: 'Error al actualizar el estado.',
    });
  };

  return (
    <div className="container mx-auto p-4">
      {isLoading ? (
        <p className="text-center text-gray-500">Cargando tablero...</p>
      ) : (
        <OrderWorkflow orders={orders} onOrderStatusUpdate={handleOrderStatusUpdate} />
      )}
    </div>
  );
}
