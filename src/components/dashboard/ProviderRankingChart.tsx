'use client';

import React, { ReactNode } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';
import { ProviderRanking } from '@/utils/dashboard-processor';

const formatUSD = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export const ProviderRankingChart = () => {
  // MODO DEBUG CON DATOS ESTÁTICOS
  const debugData: ProviderRanking[] = [
    { providerName: 'Proveedor A', total: 4000 },
    { providerName: 'Proveedor B', total: 3000 },
    { providerName: 'Proveedor C', total: 2000 },
    { providerName: 'Proveedor D', total: 2780 },
    { providerName: 'Proveedor E', total: 1890 },
    { providerName: 'Proveedor F', total: 2390 },
    { providerName: 'Proveedor G', total: 3490 },
    { providerName: 'Proveedor H', total: 1200 },
    { providerName: 'Proveedor I', total: 2500 },
    { providerName: 'Proveedor J', total: 3800 },
  ].sort((a, b) => b.total - a.total);

  const topProviders = debugData.slice(0, 10);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Top 10 Proveedores (MODO DEBUG)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={topProviders} layout="vertical" margin={{ left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={formatUSD} />
          <YAxis type="category" dataKey="providerName" width={100} interval={0} />
          <Tooltip formatter={(value: number) => formatUSD(value)} />
          <Legend />
          <Bar dataKey="total" fill="#82ca9d" name="Total (USD)">
            <LabelList dataKey="total" position="right" formatter={(value: ReactNode) => (typeof value === 'number' ? formatUSD(value) : value)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};