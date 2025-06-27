import { useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Order } from '@/types';
import { getProximoVencimiento, VencimientoInfo } from '@/utils/dateUtils';
import { getMontoPendiente } from '@/utils/orderUtils';
import { Edit, Trash2, X } from 'lucide-react';

interface OrdersTableProps {
  orders: Order[];
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onInstallmentUpdate: (orderId: string, installmentIndex: number) => Promise<void>;
}

export default function OrdersTable({ orders, onEdit, onDelete, onInstallmentUpdate }: OrdersTableProps) {
  const [activePopover, setActivePopover] = useState<string | null>(null);

  const processedOrders = useMemo(() => {
    return orders.map(order => {
      const vencimiento = getProximoVencimiento(order);
      const montoPendiente = getMontoPendiente(order);
      return {
        ...order,
        vencimientoInfo: vencimiento,
        montoPendiente: montoPendiente,
      };
    });
  }, [orders]);

  if (orders.length === 0) {
    return <p className="text-center text-gray-500">No hay pedidos para mostrar.</p>;
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (date: Timestamp | null | undefined) => {
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('es-CL');
    }
    return 'N/A';
  };

  const handleTogglePopover = (orderId: string) => {
    setActivePopover(prev => (prev === orderId ? null : orderId));
  };

  const handleMarkAsPaid = async (orderId: string, installmentIndex: number) => {
    try {
      await onInstallmentUpdate(orderId, installmentIndex);
      setActivePopover(null); // Close popover on success
    } catch (error) {
      console.error("Failed to update installment status", error);
    }
  };

  const criticalityClasses: Record<VencimientoInfo['criticidad'], string> = {
    'vencido': 'bg-red-500',
    'critico': 'bg-orange-500',
    'pronto': 'bg-yellow-400',
    'normal': 'bg-green-500',
    'sin-vencimiento': 'bg-gray-400',
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-2 px-4 border-b text-left">N° Pedido</th>
            <th className="py-2 px-4 border-b text-left">Proveedor</th>
            <th className="py-2 px-4 border-b text-left">Fecha Pedido</th>
            <th className="py-2 px-4 border-b text-left">Monto Total</th>
            <th className="py-2 px-4 border-b text-left">Monto Pendiente</th>
            <th className="py-2 px-4 border-b text-left">Estado</th>
            <th className="py-2 px-4 border-b text-left">Próximo Vencimiento</th>
            <th className="py-2 px-4 border-b text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {processedOrders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b relative">
                <button onClick={() => handleTogglePopover(order.id)} className="text-blue-600 hover:underline font-semibold">
                  {order.orderNumber}
                </button>
                {activePopover === order.id && (
                  <div className="absolute z-10 -top-4 left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold">Detalle de Pagos</h4>
                      <button onClick={() => setActivePopover(null)} className="text-gray-500 hover:text-gray-800">
                        <X size={20} />
                      </button>
                    </div>
                    <ul>
                      {order.installments.map((inst, index) => (
                        <li key={index} className="flex justify-between items-center py-1 border-b last:border-b-0">
                          <div>
                            <p className="font-semibold">{formatCurrency(inst.amount, order.currency)}</p>
                            <p className="text-sm text-gray-500">Vence: {formatDate(inst.dueDate)}</p>
                          </div>
                          {inst.status === 'pendiente' ? (
                            <button 
                              onClick={() => handleMarkAsPaid(order.id, index)}
                              className="bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded hover:bg-blue-600"
                            >
                              Pagar
                            </button>
                          ) : (
                            <span className="text-green-600 font-semibold text-sm">Pagado</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </td>
              <td className="py-2 px-4 border-b">{order.providerName}</td>
              <td className="py-2 px-4 border-b">{formatDate(order.orderDate)}</td>
              <td className="py-2 px-4 border-b">{formatCurrency(order.totalAmount, order.currency)}</td>
              <td className="py-2 px-4 border-b font-bold">{formatCurrency(order.montoPendiente, order.currency)}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'Pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="py-2 px-4 border-b">
                {order.vencimientoInfo.fecha ? (
                  <div className="flex items-center">
                    <span className={`h-3 w-3 rounded-full mr-2 ${criticalityClasses[order.vencimientoInfo.criticidad]}`}></span>
                    {order.vencimientoInfo.fecha.toLocaleDateString('es-CL')}
                  </div>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </td>
              <td className="py-2 px-4 border-b">
                <button 
                  onClick={() => onEdit(order)}
                  className="text-blue-500 hover:text-blue-700 mr-2"
                >
                  <Edit size={20} />
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de que quieres eliminar el pedido ${order.orderNumber}?`)) {
                      onDelete(order.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
