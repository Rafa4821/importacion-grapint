'use client';

import { useEffect, useState, useMemo } from 'react';
import { Order } from '@/types';
import { getOrders } from '@/services/orderService';
import { getOrdersByMonth, getMonthlyRevenue, getProviderRanking } from '@/utils/dashboard-processor';
import { OrdersByMonthChart } from '@/components/dashboard/OrdersByMonthChart';
import { RevenueByMonthChart } from '@/components/dashboard/RevenueByMonthChart';
import { ProviderRankingChart } from '@/components/dashboard/ProviderRankingChart';

// Función para obtener la fecha de inicio (hace 6 meses)
const getStartDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 5);
  date.setDate(1);
  return date;
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(getStartDate());
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const fetchedOrders = await getOrders();
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return orders.filter(order => {
      // Ignorar pedidos sin fecha para evitar errores
      if (!order || !order.orderDate) {
        return false;
      }
      const orderDate = order.orderDate.toDate();
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, startDate, endDate]);

  // MODO DEBUG: Se desactivan los cálculos de datos para los gráficos, ya que usan datos estáticos.
  // const ordersByMonthData = useMemo(() => getOrdersByMonth(filteredOrders), [filteredOrders]);
  // const revenueByMonthData = useMemo(() => getMonthlyRevenue(filteredOrders), [filteredOrders]);
  // const providerRankingData = useMemo(() => getProviderRanking(filteredOrders), [filteredOrders]);

  const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Dashboard de Métricas</h1>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Dashboard de Métricas</h1>

      {/* --- Filtros de Fecha --- */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <h3 className="text-lg font-semibold mb-2 sm:mb-0">Filtrar por Fecha</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Desde</label>
              <input
                type="date"
                id="startDate"
                value={formatDateForInput(startDate)}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Hasta</label>
              <input
                type="date"
                id="endDate"
                value={formatDateForInput(endDate)}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Contenedor de Gráficos --- */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
           <p className="text-gray-500">No hay datos disponibles para el período seleccionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <OrdersByMonthChart />
          <RevenueByMonthChart />
          <div className="md:col-span-2">
            <ProviderRankingChart />
          </div>
        </div>
      )}
    </div>
  );
}

