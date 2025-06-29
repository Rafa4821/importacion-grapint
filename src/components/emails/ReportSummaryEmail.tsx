import { Order } from '@/types';
import { Timestamp } from 'firebase/firestore';
import React from 'react';

interface ReportSummaryEmailProps {
  filters: {
    providerName: string;
    status: string;
    startDate?: string;
    endDate?: string;
  };
  orders: Order[];
}

// Función auxiliar para manejar de forma segura la conversión de fechas
const getSafeDateString = (dateValue: any): string => {
  if (!dateValue) return 'N/A';
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate().toLocaleDateString('es-CL');
  }
  // Si ya es un string o un objeto Date
  return new Date(dateValue).toLocaleDateString('es-CL');
};

export const ReportSummaryEmail: React.FC<ReportSummaryEmailProps> = ({ filters, orders }) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL', { timeZone: 'UTC' });
  };

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#333' }}>
      <h1 style={{ color: '#0056b3' }}>Resumen de Pedidos</h1>
      <p>Se ha generado un reporte con los siguientes filtros:</p>
      <ul>
        <li><strong>Proveedor:</strong> {filters.providerName}</li>
        <li><strong>Estado:</strong> {filters.status}</li>
        {filters.startDate && <li><strong>Desde:</strong> {formatDate(filters.startDate)}</li>}
        {filters.endDate && <li><strong>Hasta:</strong> {formatDate(filters.endDate)}</li>}
      </ul>

      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>{orders.length} Pedido(s) Encontrado(s)</h2>

      {orders.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}># Pedido</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Proveedor</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Fecha Creación</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Monto Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{order.orderNumber}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{order.providerName}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{order.status}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{getSafeDateString(order.createdAt)}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{order.totalAmount.toLocaleString('es-CL', { style: 'currency', currency: order.currency || 'USD' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No se encontraron pedidos que coincidan con los filtros seleccionados.</p>
      )}

      <p style={{ marginTop: '30px', fontSize: '12px', color: '#888' }}>
        Este es un correo generado automáticamente desde el sistema de gestión de Grapint.
      </p>
    </div>
  );
};
