'use client';

import { PlainOrder } from '@/types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportChartsProps {
  reportData: PlainOrder[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ReportCharts: React.FC<ReportChartsProps> = ({ reportData }) => {
  // 1. Process data for Status Pie Chart
  const statusData = reportData.reduce((acc, order) => {
    const status = order.status || 'Sin Estado';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.keys(statusData).map(key => ({ name: key, value: statusData[key] }));

  // 2. Process data for Amount by Currency Bar Chart
  const currencyData = reportData.reduce((acc, order) => {
    const currency = order.currency || 'N/A';
    acc[currency] = (acc[currency] || 0) + order.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const barChartData = Object.keys(currencyData).map(key => ({ name: key, total: currencyData[key] }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-center">Distribución por Estado</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-center">Total por Moneda</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => new Intl.NumberFormat('es-CL').format(value)} />
            <Legend />
            <Bar dataKey="total" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ReportCharts;
