'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Theme } from '@mui/material/styles';

interface ChartData {
  name: string;
  value: number;
}

interface ExpensesByProviderChartProps {
  data: ChartData[];
  theme: Theme;
}

const ExpensesByProviderChart: React.FC<ExpensesByProviderChartProps> = ({ data, theme }) => {
  if (!data || data.length === 0) {
    return <div style={{ color: theme.palette.text.secondary, textAlign: 'center', paddingTop: '20px' }}>No hay datos disponibles.</div>;
  }

  const COLORS = theme.palette.mode === 'light' 
    ? ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#00796b']
    : ['#90caf9', '#81c784', '#ffb74d', '#e57373', '#ba68c8', '#4db6ac'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius="80%"
          fill={theme.palette.primary.main}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary 
          }}
          formatter={(value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value)}
        />
        <Legend wrapperStyle={{ color: theme.palette.text.secondary }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpensesByProviderChart;
