import { PlainOrder } from '@/types';
import * as React from 'react';

interface ReportEmailProps {
  reportData: PlainOrder[];
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const tableHeader = {
  backgroundColor: '#f4f4f7',
  color: '#2b2b2b',
  textAlign: 'left' as const,
  fontWeight: 'bold',
};

const tableCell = {
  padding: '12px 15px',
  borderBottom: '1px solid #f0f0f0',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 30px',
};

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 40px',
  padding: '0 30px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  marginTop: '20px',
};

export const ReportEmail: React.FC<Readonly<ReportEmailProps>> = ({ reportData }) => (
  <div style={main}>
    <div style={container}>
      <h1 style={h1}>Reporte de Órdenes</h1>
      <p style={text}>Aquí está el resumen de las órdenes que has solicitado.</p>
      
      <table style={table}>
        <thead>
          <tr>
            <th style={{ ...tableHeader, ...tableCell }}>Nº Orden</th>
            <th style={{ ...tableHeader, ...tableCell }}>Proveedor</th>
            <th style={{ ...tableHeader, ...tableCell }}>Fecha</th>
            <th style={{ ...tableHeader, ...tableCell }}>Monto</th>
            <th style={{ ...tableHeader, ...tableCell }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {reportData.map((order, index) => (
            <tr key={order.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
              <td style={tableCell}>{order.orderNumber}</td>
              <td style={tableCell}>{order.providerName}</td>
              <td style={tableCell}>{new Date(order.orderDate).toLocaleDateString('es-CL')}</td>
              <td style={tableCell}>{new Intl.NumberFormat('es-CL', { style: 'currency', currency: order.currency || 'CLP' }).format(order.totalAmount)}</td>
              <td style={tableCell}>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p style={footer}>Este es un correo generado automáticamente por tu sistema de gestión.</p>
  </div>
);
