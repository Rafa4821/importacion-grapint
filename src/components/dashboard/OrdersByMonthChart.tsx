'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


export const OrdersByMonthChart = () => {
  // MODO DEBUG CON DATOS ESTÁTICOS
  const debugData = [
    { month: 'Ene', total: 12 },
    { month: 'Feb', total: 19 },
    { month: 'Mar', total: 3 },
    { month: 'Abr', total: 5 },
    { month: 'May', total: 2 },
    { month: 'Jun', total: 3 },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Cantidad de Pedidos por Mes (MODO DEBUG)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={debugData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(value: number) => `${value} pedidos`} />
          <Legend />
          <Bar dataKey="total" fill="#8884d8" name="Pedidos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};