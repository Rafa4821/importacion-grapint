'use client';

import { useMemo, useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types';
import { getProximoVencimiento, VencimientoInfo } from '@/utils/dateUtils';
import { getMontoPendiente } from '@/utils/orderUtils';
import { DndContext, closestCenter, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Helper: Define las columnas de nuestro tablero ---
const orderStatuses: OrderStatus[] = [
  'Gestionado',
  'En respuesta de proveedor',
  'Primer pago',
  'Invoice recibido por proveedor',
  'AWB/ADS recibido',
  'Enviado a Aduana',
  'Recibido en bodega Miami',
  'En tránsito',
  'Recibido en local',
  'Pagado',
];

// --- Sub-componente: La tarjeta que representa un pedido ---
function OrderCard({ order }: { order: Order }) {
  const montoPendiente = getMontoPendiente(order);
  const vencimiento = getProximoVencimiento(order);

  const criticalityClasses: Record<VencimientoInfo['criticidad'], string> = {
    'vencido': 'border-l-4 border-red-500',
    'critico': 'border-l-4 border-orange-500',
    'pronto': 'border-l-4 border-yellow-400',
    'normal': 'border-l-4 border-green-500',
    'sin-vencimiento': 'border-l-4 border-gray-300',
  };
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
            className={`bg-white p-3 mb-3 rounded-md shadow-sm cursor-grab active:cursor-grabbing ${criticalityClasses[vencimiento.criticidad]}`}
    >
      <p className="font-semibold text-sm">{order.orderNumber}</p>
      <p className="text-xs text-gray-600">{order.providerName}</p>
            <p className="text-xs text-gray-500 mt-1">Total: ${order.totalAmount.toLocaleString()}</p>
      {montoPendiente > 0 && (
        <p className="text-xs font-semibold text-red-600 mt-1">Pendiente: ${montoPendiente.toLocaleString()}</p>
      )}
      {vencimiento.fecha && (
        <div className="text-xs text-gray-700 mt-2 pt-2 border-t border-gray-200">
          <p>Vence: <strong>{vencimiento.fecha.toLocaleDateString()}</strong></p>
        </div>
      )}
    </div>
  );
}

// --- Sub-componente: La columna que representa un estado ---
function Column({ status, orders }: { status: OrderStatus; orders: Order[] }) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className="bg-gray-100 rounded-lg p-4 w-72 flex-shrink-0">
      <h3 className="font-bold mb-4 text-center text-gray-700">{status}</h3>
      <SortableContext items={orders.map(o => o.id)}>
        <div className="min-h-[100px]">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// --- Componente Principal: El tablero Kanban ---
interface OrderWorkflowProps {
  orders: Order[];
  onOrderStatusUpdate: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}

export default function OrderWorkflow({ orders, onOrderStatusUpdate }: OrderWorkflowProps) {
  const [columns, setColumns] = useState<Record<OrderStatus, Order[]>>(() => {
    const initialColumns: Record<string, Order[]> = {};
    orderStatuses.forEach(status => {
        initialColumns[status] = [];
    });
    return initialColumns as Record<OrderStatus, Order[]>;
  });

  useEffect(() => {
    const newColumns: Record<string, Order[]> = {};
    orderStatuses.forEach(status => {
        newColumns[status] = [];
    });
    orders.forEach(order => {
        if (newColumns[order.status]) {
            newColumns[order.status].push(order);
        }
    });
    setColumns(newColumns as Record<OrderStatus, Order[]>);
  }, [orders]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) {
      return;
    }

    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId || over.id;
    
    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      // Reordering in the same column
      setColumns(prev => {
        const columnOrders = prev[activeContainer as OrderStatus];
        const oldIndex = columnOrders.findIndex(o => o.id === activeId);
        const newIndex = columnOrders.findIndex(o => o.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          return {
            ...prev,
            [activeContainer as OrderStatus]: arrayMove(columnOrders, oldIndex, newIndex),
          };
        }
        return prev;
      });
    } else {
      // Moving to a different column
      const newStatus = overContainer as OrderStatus;
      if (orderStatuses.includes(newStatus)) {
        onOrderStatusUpdate(activeId as string, newStatus);
      }
    }
  };

  return (
    <div className="p-4 bg-gray-50">
                <h2 className="text-2xl font-bold mb-4 text-center">Flujo de Pedidos (Kanban)</h2>
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <div className="flex space-x-4 overflow-x-auto pb-4">
            {orderStatuses.map(status => (
                <Column key={status} status={status} orders={columns[status]} />
            ))}
            </div>
        </DndContext>
    </div>
  );
}
