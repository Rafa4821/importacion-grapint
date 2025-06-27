'use client';

import type { ReactNode } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { ProviderRanking } from '@/utils/dashboard-processor';

interface ProviderRankingChartProps {
  data: ProviderRanking[];
}

const formatUSD = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export const ProviderRankingChart = ({ data }: ProviderRankingChartProps) => {
  // Tomar solo el top 10 para no saturar el gráfico
  const topProviders = data.slice(0, 10);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Top 10 Proveedores (por Monto en USD)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={topProviders} layout="vertical" margin={{ left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={formatUSD} />
          <YAxis type="category" dataKey="providerName" width={100} />
          <Tooltip formatter={(value: number) => formatUSD(value)} />
          <Legend />
          <Bar dataKey="total" fill="#ffc658" name="Monto Total (USD)">
            <LabelList dataKey="total" position="right" formatter={(value: ReactNode) => (typeof value === 'number' ? formatUSD(value) : value)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
