import React from 'react';

interface ExpirationEmailProps {
  orderNumber: string;
  providerName: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  currency: 'CLP' | 'USD';
  status: 'VENCIDO' | 'PRÓXIMO A VENCER';
}

// Estilos en línea para máxima compatibilidad con clientes de correo
const containerStyle = {
  fontFamily: 'Arial, sans-serif',
  color: '#333',
  padding: '20px',
  border: '1px solid #eee',
  borderRadius: '5px',
  maxWidth: '600px',
  margin: 'auto',
};

const h1Style = {
  color: '#d9534f', // Rojo para VENCIDO
};

const h1WarningStyle = {
  color: '#f0ad4e', // Naranja para PRÓXIMO A VENCER
};

const pStyle = {
  fontSize: '16px',
  lineHeight: '1.5',
};

const strongStyle = {
  fontWeight: 700,
};

const footerStyle = {
  marginTop: '20px',
  fontSize: '12px',
  color: '#777',
};

export const ExpirationNotificationEmail = ({ 
  orderNumber, 
  providerName, 
  installmentNumber, 
  dueDate, 
  amount, 
  currency,
  status
}: ExpirationEmailProps) => {
  const isExpired = status === 'VENCIDO';
  const title = isExpired ? 'Alerta de Vencimiento' : 'Aviso de Próximo Vencimiento';
  const titleStyle = isExpired ? h1Style : h1WarningStyle;

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>{title}</h1>
      <p style={pStyle}>
        Hola,
      </p>
      <p style={pStyle}>
        Te informamos que una cuota del pedido <strong style={strongStyle}>#{orderNumber}</strong> para el proveedor <strong style={strongStyle}>{providerName}</strong> requiere tu atención.
      </p>
      <ul>
        <li><strong style={strongStyle}>Cuota:</strong> {installmentNumber}</li>
        <li><strong style={strongStyle}>Monto:</strong> {amount.toLocaleString('es-CL')} {currency}</li>
        <li><strong style={strongStyle}>Fecha de Vencimiento:</strong> {dueDate}</li>
        <li><strong style={strongStyle}>Estado:</strong> {status}</li>
      </ul>
      <p style={pStyle}>
        Por favor, gestiona el pago a la brevedad para evitar inconvenientes.
      </p>
      <p style={footerStyle}>
        Este es un correo automático generado por el sistema de gestión de importaciones.
      </p>
    </div>
  );
};
