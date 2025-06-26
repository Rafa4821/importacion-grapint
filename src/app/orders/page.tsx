'use client';

import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import OrdersTable from '@/components/orders/OrdersTable';
import AddOrderModal from '@/components/orders/AddOrderModal';
import { Order, Provider, OrderFormData } from '@/types';
import { getProviders } from '@/services/providerService';
import {
  getOrders,
  addOrder,
  deleteOrder,
  updateOrder,
  OrderFormDataForService
} from '@/services/orderService';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const fetchOrdersAndProviders = async () => {
    setIsLoading(true);
    try {
      const [ordersData, providersData] = await Promise.all([
        getOrders(),
        getProviders(),
      ]);
      setOrders(ordersData);
      setProviders(providersData);
    } catch {
      toast.error('Error al cargar los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndProviders();
  }, []);

  const handleSaveOrder = async (data: OrderFormData) => {
    const isEditing = !!editingOrder;

    const dataForService: OrderFormDataForService = {
      ...data,
      orderDate: new Date(data.orderDate),
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
    };

    const promise = isEditing
      ? updateOrder(editingOrder!.id, dataForService)
      : addOrder(dataForService);

    toast.promise(
      promise.then(() => {
        fetchOrdersAndProviders();
        setIsModalOpen(false);
        setEditingOrder(null);
      }),
      {
        loading: isEditing ? 'Actualizando pedido...' : 'Guardando nuevo pedido...',
        success: isEditing ? '¡Pedido actualizado con éxito!' : '¡Pedido guardado con éxito!',
        error: isEditing ? 'Error al actualizar el pedido.' : 'Error al guardar el pedido.',
      }
    );
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleAddNewOrder = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    const promise = deleteOrder(orderId);

    toast.promise(promise, {
      loading: 'Eliminando pedido...',
      success: '¡Pedido eliminado con éxito!',
      error: 'Error al eliminar el pedido.',
    }).then(() => {
      fetchOrdersAndProviders();
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestión de Pedidos</h1>
        <button
          onClick={handleAddNewOrder}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full flex items-center transition duration-300 ease-in-out transform hover:scale-105"
        >
          <PlusCircle className="mr-2" size={20} />
          Añadir Pedido
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {isLoading ? (
          <p>Cargando pedidos...</p>
        ) : (
          <OrdersTable
            orders={orders}
            onEdit={handleEditOrder}
            onDelete={handleDeleteOrder}
          />
        )}
      </div>

      {isModalOpen && (
        <AddOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveOrder}
          providers={providers}
          orderToEdit={editingOrder}
        />
      )}
    </div>
  );
}
