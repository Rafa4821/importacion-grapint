'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyData } from '@/utils/dashboard-processor';

interface OrdersByMonthChartProps {
  data: MonthlyData[];
}

export const OrdersByMonthChart = ({ data }: OrdersByMonthChartProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Cantidad de Pedidos por Mes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(value) => `${value} pedidos`} />
          <Legend />
          <Bar dataKey="total" fill="#8884d8" name="Pedidos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
