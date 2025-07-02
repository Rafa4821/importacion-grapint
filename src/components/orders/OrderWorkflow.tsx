'use client';

import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types';
import { getProximoVencimiento, VencimientoInfo } from '@/utils/dateUtils';
import { getMontoPendiente } from '@/utils/orderUtils';
import { DndContext, closestCenter, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Paper, Typography, Card, CardContent } from '@mui/material';

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

  const criticalityColors: Record<VencimientoInfo['criticidad'], string> = {
    'vencido': 'error.main',
    'critico': 'warning.main',
    'pronto': 'info.main',
    'normal': 'success.main',
    'sin-vencimiento': 'grey.300',
  };

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 1.5,
        borderLeft: 5,
        borderColor: criticalityColors[vencimiento.criticidad],
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle2" component="p">{order.orderNumber}</Typography>
        <Typography variant="caption" color="text.secondary" component="p">{order.providerName}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>Total: ${order.totalAmount.toLocaleString()}</Typography>
        {montoPendiente > 0 && (
          <Typography variant="body2" color="error" sx={{ fontWeight: 'bold', mt: 0.5 }}>
            Pendiente: ${montoPendiente.toLocaleString()}
          </Typography>
        )}
        {vencimiento.fecha && (
          <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption">Vence: <strong>{vencimiento.fecha.toLocaleDateString()}</strong></Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// --- Sub-componente: La columna que representa un estado ---
function Column({ status, orders }: { status: OrderStatus; orders: Order[] }) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <Paper ref={setNodeRef} sx={{ p: 2, width: 280, flexShrink: 0, backgroundColor: 'grey.100' }}>
      <Typography variant="h6" align="center" gutterBottom>{status}</Typography>
      <SortableContext items={orders.map(o => o.id)}>
        <Box sx={{ minHeight: 100 }}>
          {orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </Box>
      </SortableContext>
    </Paper>
  );
}

interface OrderWorkflowProps {
  orders: Order[];
  onOrderStatusUpdate: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}

export default function OrderWorkflow({ orders, onOrderStatusUpdate }: OrderWorkflowProps) {
  const [columns, setColumns] = useState<Record<OrderStatus, Order[]>>(() => {
    const initialColumns: Record<string, Order[]> = {};
    orderStatuses.forEach(status => { initialColumns[status] = []; });
    return initialColumns as Record<OrderStatus, Order[]>;
  });

  useEffect(() => {
    const newColumns = orderStatuses.reduce((acc, status) => {
      acc[status] = [];
      return acc;
    }, {} as Record<OrderStatus, Order[]>);

    orders.forEach(order => {
      if (newColumns[order.status]) {
        newColumns[order.status].push(order);
      }
    });
    setColumns(newColumns);
  }, [orders]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable?.containerId || over.id;

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
        // Logic for reordering within the same column
        if (activeContainer === overContainer) {
            setColumns(prev => {
                const columnOrders = prev[activeContainer as OrderStatus];
                const oldIndex = columnOrders.findIndex(o => o.id === activeId);
                const newIndex = columnOrders.findIndex(o => o.id === overId);
                if (oldIndex !== -1 && newIndex !== -1) {
                    return { ...prev, [activeContainer as OrderStatus]: arrayMove(columnOrders, oldIndex, newIndex) };
                }
                return prev;
            });
        }
        return;
    }

    // Moving to a different column
    const newStatus = overContainer as OrderStatus;
    if (orderStatuses.includes(newStatus)) {
      onOrderStatusUpdate(activeId, newStatus);
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {orderStatuses.map(status => (
            <Column key={status} status={status} orders={columns[status] || []} />
          ))}
        </Box>
      </DndContext>
    </Box>
  );
}
