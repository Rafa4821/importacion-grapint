'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Theme } from '@mui/material/styles';

interface ChartData {
  name: string;
  value: number;
}

export interface LineChartProps {
  data: ChartData[];
  theme: Theme;
}

export function LineChartComponent({ data, theme }: LineChartProps) {
  if (!data || data.length === 0) {
    return <div style={{ color: theme.palette.text.secondary, textAlign: 'center', paddingTop: '20px' }}>No hay datos para mostrar.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis dataKey="name" stroke={theme.palette.text.secondary} tick={{ fill: theme.palette.text.secondary }} />
        <YAxis stroke={theme.palette.text.secondary} tick={{ fill: theme.palette.text.secondary }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary 
          }}
          formatter={(value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value)}
        />
        <Legend wrapperStyle={{ color: theme.palette.text.secondary }} />
        <Line type="monotone" dataKey="value" stroke={theme.palette.primary.main} activeDot={{ r: 8 }} name="Valor" />
      </LineChart>
    </ResponsiveContainer>
  );
}
