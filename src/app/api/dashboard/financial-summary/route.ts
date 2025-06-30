import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { Order } from '@/types';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { metric, timeRange = 'all' } = await req.json();

    if (!metric) {
      return NextResponse.json({ message: 'Metric is required' }, { status: 400 });
    }

    let ordersQuery = query(collection(db, 'orders'));

    if (timeRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case '7d':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30d':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case '90d':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        default:
          startDate = new Date(0); // Should not happen with 'all' check
      }
      
      ordersQuery = query(ordersQuery, where('orderDate', '>=', Timestamp.fromDate(startDate)));
    }

    const querySnapshot = await getDocs(ordersQuery);
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];

    let data: { name: string; value: number }[] = [];

    switch (metric) {
      case 'order_status_distribution': {
        const statusCounts = orders.reduce((acc, order) => {
          const status = order.status || 'pendiente';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        data = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
        break;
      }

      case 'monthly_expense_trend': {
        const monthlyExpenses = orders.reduce((acc, order) => {
          if (order.orderDate) {
            const date = order.orderDate.toDate();
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            acc[monthYear] = (acc[monthYear] || 0) + order.totalAmount;
          }
          return acc;
        }, {} as Record<string, number>);
        data = Object.entries(monthlyExpenses)
          .map(([monthYear, value]) => ({ name: monthYear, value }))
          .sort((a, b) => a.name.localeCompare(b.name));
        break;
      }

      case 'expenses_by_provider': {
        const expenses = orders.reduce((acc, order) => {
          if (order && order.providerName && typeof order.totalAmount === 'number') {
            acc[order.providerName] = (acc[order.providerName] || 0) + order.totalAmount;
          }
          return acc;
        }, {} as Record<string, number>);
        data = Object.entries(expenses).map(([name, value]) => ({ name, value }));
        break;
      }

      case 'pending_payments': {
        const totalPending = orders.reduce((total, order) => {
          const pendingAmount = (order.installments || []).reduce((sum, installment) => {
            if (installment.status === 'pendiente') {
              return sum + installment.amount;
            }
            return sum;
          }, 0);
          return total + pendingAmount;
        }, 0);
        data = [{ name: 'Total Pendiente', value: totalPending }];
        break;
      }

      case 'payments_forecast': {
        const now = new Date();
        const forecast = { overdue: 0, next30: 0, next60: 0, next90: 0 };
        orders.forEach(order => {
          (order.installments || []).forEach(installment => {
            if (installment.status === 'pendiente') {
              const dueDate = installment.dueDate.toDate();
              const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays < 0) forecast.overdue += installment.amount;
              else if (diffDays <= 30) forecast.next30 += installment.amount;
              else if (diffDays <= 60) forecast.next60 += installment.amount;
              else if (diffDays <= 90) forecast.next90 += installment.amount;
            }
          });
        });
        data = [
          { name: 'Vencido', value: forecast.overdue },
          { name: 'Próximos 30 días', value: forecast.next30 },
          { name: '31-60 días', value: forecast.next60 },
          { name: '61-90 días', value: forecast.next90 },
        ];
        break;
      }

      case 'order_count_by_provider': {
        const providerCounts = orders.reduce((acc, order) => {
            if (order && order.providerName) {
                acc[order.providerName] = (acc[order.providerName] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        data = Object.entries(providerCounts).map(([name, value]) => ({ name, value }));
        break;
      }

      case 'total_amount_by_currency': {
        const currencyTotals = orders.reduce((acc, order) => {
            if (order && order.currency && typeof order.totalAmount === 'number') {
                acc[order.currency] = (acc[order.currency] || 0) + order.totalAmount;
            }
            return acc;
        }, {} as Record<string, number>);
        data = Object.entries(currencyTotals).map(([name, value]) => ({ name, value }));
        break;
      }

      case 'monthly_order_volume': {
        const monthlyVolume = orders.reduce((acc, order) => {
            if (order.orderDate) {
                const date = order.orderDate.toDate();
                const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                acc[monthYear] = (acc[monthYear] || 0) + 1; // Increment count
            }
            return acc;
        }, {} as Record<string, number>);
        data = Object.entries(monthlyVolume)
            .map(([monthYear, value]) => ({ name: monthYear, value }))
            .sort((a, b) => a.name.localeCompare(b.name));
        break;
      }

      default:
        return NextResponse.json({ message: `Metric "${metric}" not found` }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
