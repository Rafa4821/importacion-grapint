import { useMemo } from 'react';
import { Order } from '@/types';
import { getProximoVencimiento, VencimientoInfo } from '@/utils/dateUtils';
import { getMontoPendiente } from '@/utils/orderUtils';
import { Edit, Trash2 } from 'lucide-react';

interface OrdersTableProps {
  orders: Order[];
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
}

export default function OrdersTable({ orders, onEdit, onDelete }: OrdersTableProps) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

    const formatDate = (date: import('firebase/firestore').Timestamp) => {
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('es-CL');
    }
    return 'N/A';
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
              <td className="py-2 px-4 border-b">{order.orderNumber}</td>
              <td className="py-2 px-4 border-b">{order.providerName}</td>
              <td className="py-2 px-4 border-b">{formatDate(order.orderDate)}</td>
                            <td className="py-2 px-4 border-b">{formatCurrency(order.totalAmount)} {order.currency}</td>
                            <td className="py-2 px-4 border-b">{formatCurrency(order.montoPendiente)} {order.currency}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'Pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </td>
              <td className="py-2 px-4 border-b">
                {
                  order.vencimientoInfo.fecha ? (
                    <div className="flex items-center">
                      <span className={`h-3 w-3 rounded-full mr-2 ${criticalityClasses[order.vencimientoInfo.criticidad]}`}></span>
                      {order.vencimientoInfo.fecha.toLocaleDateString('es-CL')}
                    </div>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )
                }
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
