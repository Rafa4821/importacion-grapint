'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL').format(value);

export const RevenueByMonthChart = () => {
  // MODO DEBUG CON DATOS ESTÁTICOS
  const debugData = [
    { month: 'Ene', CLP: 400000, USD: 500 },
    { month: 'Feb', CLP: 300000, USD: 450 },
    { month: 'Mar', CLP: 200000, USD: 300 },
    { month: 'Abr', CLP: 278000, USD: 400 },
    { month: 'May', CLP: 189000, USD: 250 },
    { month: 'Jun', CLP: 239000, USD: 350 },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Ingresos por Mes (MODO DEBUG)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={debugData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip formatter={(value: number, name: string) => `${name}: ${formatCurrency(value)}`} />
          <Legend />
          <Bar dataKey="CLP" fill="#82ca9d" name="CLP" />
          <Bar dataKey="USD" fill="#8884d8" name="USD" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};