import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, QueryConstraint } from 'firebase/firestore';
import { Order, PlainOrder, ReportOrderStatus } from '@/types/index';
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, status, startDate, endDate } = body;

    // 1. Build Firestore query
    const queries: QueryConstraint[] = [];
    if (providerId && providerId !== 'all') {
      queries.push(where('providerId', '==', providerId));
    }
    if (status && status !== 'all') {
      queries.push(where('status', '==', status));
    }
    if (startDate) {
      queries.push(where('orderDate', '>=', Timestamp.fromDate(new Date(startDate))));
    }
    if (endDate) {
      queries.push(where('orderDate', '<=', Timestamp.fromDate(new Date(endDate))));
    }

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, ...queries);
    
    // 2. Execute query and get orders
    const querySnapshot = await getDocs(q);
    const orders: Order[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

    // 3. Convert orders to a serializable format
    const plainOrders = orders
      .map(order => {
        try {
          const createdAtTimestamp = order.createdAt as Timestamp;
          const updatedAtTimestamp = order.updatedAt as Timestamp;

          if (!order.orderDate || typeof order.orderDate.toDate !== 'function' || 
              !createdAtTimestamp || typeof createdAtTimestamp.toDate !== 'function' || 
              !updatedAtTimestamp || typeof updatedAtTimestamp.toDate !== 'function') {
            throw new Error('Missing or invalid date fields');
          }

          const plainOrder: PlainOrder = {
            id: order.id,
            orderNumber: order.orderNumber,
            providerId: order.providerId,
            providerName: order.providerName,
            orderDate: order.orderDate.toDate().toISOString(),
            totalAmount: order.totalAmount,
            currency: order.currency,
            status: order.status as ReportOrderStatus,
            isPaid: order.isPaid,
            createdAt: createdAtTimestamp.toDate().toISOString(),
            updatedAt: updatedAtTimestamp.toDate().toISOString(),
            installments: (order.installments || []).map(i => {
              if (!i.dueDate || typeof i.dueDate.toDate !== 'function') {
                throw new Error(`Invalid dueDate in installments for order ${order.id}`);
              }
              return { ...i, dueDate: i.dueDate.toDate().toISOString() };
            }),
          };

          const invoiceDateTimestamp = order.invoiceDate as Timestamp;
          if (invoiceDateTimestamp && typeof invoiceDateTimestamp.toDate === 'function') {
            plainOrder.invoiceDate = invoiceDateTimestamp.toDate().toISOString();
          }
          if (order.invoiceNumber) {
            plainOrder.invoiceNumber = order.invoiceNumber;
          }

          return plainOrder;
        } catch (e) {
          console.error(`Skipping order ${order.id} due to corrupted data:`, e);
          return null;
        }
      })
      .filter((order): order is PlainOrder => order !== null);

    return new NextResponse(JSON.stringify({ 
      message: 'Reporte generado con éxito',
      data: plainOrders 
    }), { status: 200 });

  } catch (error) {
    console.error('Error generating report:', error);
    return new NextResponse(JSON.stringify({ message: 'Error interno del servidor.' }), { status: 500 });
  }
}
