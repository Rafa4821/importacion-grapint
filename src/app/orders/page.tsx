'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { calculatePendingAmount, getNextDueDate } from '@/utils/order-calculations';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Helper para formatear la fecha
const formatDate = (date: Date | null) => {
  if (!date) return 'N/A';
  return date.toLocaleDateString('es-CL');
};

// Helper para formatear la moneda
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount);
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);

    const fetchOrders = async () => {
    try {
      setLoading(true);
      const [ordersData, providersData] = await Promise.all([
        getOrders(),
        getProviders(),
      ]);
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
    fetchOrders();
  }, []);

    const handleEdit = (order: Order) => {
    // Lógica para editar un pedido
    // Por ahora, abriremos el modal de añadir con los datos del pedido
    setOrderToEdit(order);
    setAddModalOpen(true);
  };

    const handleSaveOrder = async (data: OrderFormData) => {
    const isEditing = !!orderToEdit;

    // Convert date strings from form back to Date objects for the service
    const dataForService: OrderFormDataForService = {
      ...data,
      orderDate: new Date(data.orderDate),
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
    };

    const promise = isEditing
      ? updateOrder(orderToEdit!.id, dataForService)
      : addOrder(dataForService);

    toast.promise(
      promise,
      {
        loading: isEditing ? 'Actualizando pedido...' : 'Guardando nuevo pedido...',
        success: () => {
          fetchOrders();
          setAddModalOpen(false);
          setOrderToEdit(null);
          return isEditing ? '¡Pedido actualizado con éxito!' : '¡Pedido guardado con éxito!';
        },
        error: isEditing ? 'Error al actualizar el pedido.' : 'Error al guardar el pedido.',
      }
    );
  };

  const handleDelete = async (orderId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      try {
        await deleteOrder(orderId);
        toast.success('Pedido eliminado con éxito');
        fetchOrders(); // Recargar la lista
      } catch (error) {
        console.error('Error deleting order:', error);
        toast.error('Error al eliminar el pedido');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
        <button
          onClick={() => setAddModalOpen(true)}
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Pedido</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Total</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Pendiente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próximo Vencimiento</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const pendingAmount = calculatePendingAmount(order);
                  const nextDueDate = getNextDueDate(order);
                  const isFullyPaid = pendingAmount === 0;

                  return (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline">
                        <Link href={`/orders/${order.id}`}>{order.orderNumber}</Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.providerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(order.totalAmount, order.currency)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(pendingAmount, order.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(nextDueDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isFullyPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {isFullyPaid ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEdit(order)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
