import { Order } from '@/types';


// Tipos de datos para los gráficos
export interface MonthlyData {
  month: string;
  total: number;
}

export interface MonthlyRevenue {
  month: string;
  CLP: number;
  USD: number;
}

export interface ProviderRanking {
  providerName: string;
  total: number;
}

// Función para formatear el mes (e.g., '2023-01')
const getMonthYear = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Procesa los pedidos para obtener la cantidad de pedidos por mes.
 */
export const getOrdersByMonth = (orders: Order[]): MonthlyData[] => {
  const monthlyCounts: { [key: string]: number } = {};

  orders.forEach(order => {
    const month = getMonthYear(order.orderDate.toDate());
    if (!monthlyCounts[month]) {
      monthlyCounts[month] = 0;
    }
    monthlyCounts[month]++;
  });

  return Object.keys(monthlyCounts)
    .map(month => ({ month, total: monthlyCounts[month] }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Procesa los pedidos para obtener el monto total por mes en CLP y USD.
 */
export const getMonthlyRevenue = (orders: Order[]): MonthlyRevenue[] => {
  const monthlyRevenues: { [key: string]: { CLP: number; USD: number } } = {};

  orders.forEach(order => {
    // Validar que el monto sea un número finito
    const amount = typeof order.totalAmount === 'number' && isFinite(order.totalAmount) ? order.totalAmount : 0;
    const roundedAmount = Math.round(amount);

    if (order.orderDate) { // Asegurarse de que la fecha del pedido exista
      const month = getMonthYear(order.orderDate.toDate());
      if (!monthlyRevenues[month]) {
        monthlyRevenues[month] = { CLP: 0, USD: 0 };
      }
      monthlyRevenues[month][order.currency] += roundedAmount;
    }
  });

  return Object.keys(monthlyRevenues)
    .map(month => ({
      month,
      ...monthlyRevenues[month],
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
};

/**
 * Procesa los pedidos para obtener el ranking de proveedores por monto total (en USD equivalente).
 */
export const getProviderRanking = (orders: Order[], clpToUsdRate: number = 950): ProviderRanking[] => {
  const providerTotals: { [key: string]: number } = {};
  const validRate = (typeof clpToUsdRate === 'number' && clpToUsdRate > 0) ? clpToUsdRate : 950;

  orders.forEach(order => {
    const providerName = order.providerName;
    // Ignorar pedidos sin nombre de proveedor
    if (providerName && typeof providerName === 'string') {
      if (!providerTotals[providerName]) {
        providerTotals[providerName] = 0;
      }

      // Validar que el monto sea un número finito
      const amount = typeof order.totalAmount === 'number' && isFinite(order.totalAmount) ? order.totalAmount : 0;
      
      const amountInUSD = order.currency === 'CLP' ? amount / validRate : amount;

      // Acumular solo si el valor es un número finito
      if (isFinite(amountInUSD)) {
        providerTotals[providerName] += amountInUSD;
      }
    }
  });

  return Object.keys(providerTotals)
    .map(providerName => ({
      providerName,
      total: Math.round(providerTotals[providerName]),
    }))
    .sort((a, b) => b.total - a.total);
};