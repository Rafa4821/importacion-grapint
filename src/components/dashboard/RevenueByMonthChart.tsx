'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyRevenue } from '@/utils/dashboard-processor';

interface RevenueByMonthChartProps {
  data: MonthlyRevenue[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL').format(value);

export const RevenueByMonthChart = ({ data }: RevenueByMonthChartProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Ingresos por Mes (CLP y USD)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
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
