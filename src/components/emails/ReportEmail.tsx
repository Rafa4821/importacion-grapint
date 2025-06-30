import { PlainOrder } from '@/types';
import * as React from 'react';

interface ReportEmailProps {
  reportData: PlainOrder[];
}

export const ReportEmail: React.FC<Readonly<ReportEmailProps>> = ({ reportData }) => (
  <div>
    <h1>Reporte de Órdenes</h1>
    <p>Aquí está el resumen de las órdenes solicitado:</p>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Nº Orden</th>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Proveedor</th>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Fecha</th>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Monto</th>
          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Estado</th>
        </tr>
      </thead>
      <tbody>
        {reportData.map((order) => (
          <tr key={order.id}>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{order.orderNumber}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{order.providerName}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(order.orderDate).toLocaleDateString()}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Intl.NumberFormat('es-CL', { style: 'currency', currency: order.currency || 'CLP' }).format(order.totalAmount)}</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{order.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <p>Este es un correo generado automáticamente.</p>
  </div>
);
