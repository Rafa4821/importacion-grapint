'use client';

import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types';
import { getOrders, updateOrderStatus } from '@/services/orderService';
import OrderWorkflow from '@/components/orders/OrderWorkflow';
import toast from 'react-hot-toast';
import { Container, Typography, Box, CircularProgress } from '@mui/material';

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
      fetchOrders();
    });

    toast.promise(promise, {
      loading: 'Actualizando estado...',
      success: '¡Estado actualizado con éxito!',
      error: 'Error al actualizar el estado.',
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Seguimiento de Pedidos
      </Typography>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Cargando seguimiento...</Typography>
        </Box>
      ) : (
        <OrderWorkflow orders={orders} onOrderStatusUpdate={handleOrderStatusUpdate} />
      )}
    </Container>
  );
}
