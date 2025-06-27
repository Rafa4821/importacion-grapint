'use client';

import { useState, useEffect } from 'react';

import {
  getOrders,
  deleteOrder,
  addOrder,
  updateOrder,
  OrderFormDataForService,
} from '@/services/orderService';
import { getProviders } from '@/services/providerService';
import { Order, Provider, OrderFormData } from '@/types';
import AddOrderModal from '@/components/orders/AddOrderModal';
import { updateInstallmentStatus } from '@/services/orderService';
import OrdersTable from '@/components/orders/OrdersTable';
import { PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ordersData, providersData] = await Promise.all([getOrders(), getProviders()]);
      setOrders(ordersData);
      setProviders(providersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleEdit = (order: Order) => {
    setOrderToEdit(order);
    setAddModalOpen(true);
  };

  const handleDelete = async (orderId: string) => {
    toast.promise(
      deleteOrder(orderId),
      {
        loading: 'Eliminando pedido...',
        success: () => {
          fetchAllData();
          return '¡Pedido eliminado con éxito!';
        },
        error: 'Error al eliminar el pedido.',
      }
    );
  };

  const handleSaveOrder = async (data: OrderFormData) => {
    const isEditing = !!orderToEdit;
    const dataForService: OrderFormDataForService = {
      ...data,
      orderDate: new Date(data.orderDate),
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
    };

    const promise = isEditing
      ? updateOrder(orderToEdit!.id, dataForService)
      : addOrder(dataForService);

    toast.promise(promise, {
      loading: isEditing ? 'Actualizando pedido...' : 'Guardando nuevo pedido...',
      success: () => {
        fetchAllData();
        setAddModalOpen(false);
        setOrderToEdit(null);
        return isEditing ? '¡Pedido actualizado!' : '¡Pedido guardado!';
      },
      error: isEditing ? 'Error al actualizar.' : 'Error al guardar.',
    });
  };

  const handleInstallmentUpdate = async (orderId: string, installmentIndex: number) => {
    await toast.promise(
      updateInstallmentStatus(orderId, installmentIndex, 'pagado'),
      {
        loading: 'Actualizando estado del pago...',
        success: () => {
          fetchAllData(); // Refresh data to show updated pending amount
          return '¡Cuota marcada como pagada!';
        },
        error: 'Error al actualizar la cuota.',
      }
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
        <button
          onClick={() => {
            setOrderToEdit(null);
            setAddModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <PlusCircle size={20} className="mr-2" />
          Añadir Pedido
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando pedidos...</div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <OrdersTable 
            orders={orders} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            onInstallmentUpdate={handleInstallmentUpdate} 
          />
        </div>
      )}

      <AddOrderModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setOrderToEdit(null);
        }}
        onSave={handleSaveOrder}
        orderToEdit={orderToEdit}
        providers={providers}
      />
    </div>
  );
}
