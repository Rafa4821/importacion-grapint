import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types';
import { dispatchNotification } from '@/services/notificationDispatcher';

// Default days before due date to send a notification.
// In a future version, this could be a global setting.
const DAYS_BEFORE_DUE = 3;

export async function GET(request: Request) {
  // 1. Authenticate the cron job request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    console.log('Cron job for checking expirations started...');

    const now = new Date();
    const upcomingDueDate = new Date();
    upcomingDueDate.setDate(now.getDate() + DAYS_BEFORE_DUE);

    // 2. Fetch all orders that are not fully paid
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', '!=', 'Pagado'));
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

    const notificationsDispatched = [];

    // 3. Process each order and its installments
    for (const order of orders) {
      if (!order.installments) continue;

      for (const installment of order.installments) {
        if (installment.status !== 'pendiente' || !installment.dueDate) continue;

        const dueDate = (installment.dueDate as Timestamp).toDate();

        const payload = { order, installment };

        // 4. Check for overdue installments
        if (dueDate < now) {
          console.log(`Found overdue installment for order #${order.orderNumber}. Dispatching...`);
          await dispatchNotification('Cuota vencida', payload);
          notificationsDispatched.push({ orderNumber: order.orderNumber, type: 'Cuota vencida' });
        }
        // 5. Check for installments due soon
        else if (dueDate <= upcomingDueDate) {
          console.log(`Found upcoming installment for order #${order.orderNumber}. Dispatching...`);
          await dispatchNotification('Vencimiento de cuota', payload);
          notificationsDispatched.push({ orderNumber: order.orderNumber, type: 'Vencimiento de cuota' });
        }
      }
    }

    console.log('Cron job completed successfully.');
    return NextResponse.json({
      ok: true,
      message: 'Cron job completed.',
      dispatchedCount: notificationsDispatched.length,
      dispatched: notificationsDispatched,
    });

  } catch (error) {
    console.error('Error in cron job for checking expirations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: errorMessage }), {
      status: 500,
    });
  }
}
