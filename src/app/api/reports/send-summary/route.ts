import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, QueryConstraint, doc, getDoc } from 'firebase/firestore';
import { Order, PlainOrder } from '@/types/index';
import { Resend } from 'resend';
import { ReportSummaryEmail } from '@/components/emails/ReportSummaryEmail';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, status, startDate, endDate, recipientEmail, dateRange } = body;

    if (!recipientEmail) {
      return new NextResponse(JSON.stringify({ message: 'El email del destinatario es requerido.' }), { status: 400 });
    }

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

    // 3. Convert orders to a serializable format for the email component
    const plainOrders: PlainOrder[] = orders.map(order => ({
      ...order,
      orderDate: (order.orderDate as Timestamp).toDate().toISOString(),
      invoiceDate: order.invoiceDate ? (order.invoiceDate as Timestamp).toDate().toISOString() : undefined,
      createdAt: (order.createdAt as unknown as Timestamp).toDate().toISOString(),
      updatedAt: (order.updatedAt as unknown as Timestamp).toDate().toISOString(),
      installments: order.installments ? order.installments.map(i => ({
        ...i,
        dueDate: (i.dueDate as Timestamp).toDate().toISOString(),
      })) : [],
    }));

    // 4. Get provider name if selected
    let providerName = 'Todos';
    if (providerId && providerId !== 'all') {
      const providerDoc = await getDoc(doc(db, 'providers', providerId));
      if (providerDoc.exists()) {
        providerName = providerDoc.data().companyName;
      }
    }

    // 5. Prepare and send email
    const filtersForEmail = {
      providerName,
      status: status || 'Todos',
      dateRange: dateRange || 'Todas',
      startDate,
      endDate,
    };

    const { error } = await resend.emails.send({
      from: 'Grapint Notificaciones <onboarding@resend.dev>',
      to: recipientEmail,
      subject: `Resumen de Órdenes - ${providerName}`,
      react: React.createElement(ReportSummaryEmail, {
        filters: filtersForEmail,
        orders: plainOrders,
      }),
    });

    if (error) {
      console.error({ error });
      return new NextResponse(JSON.stringify({ message: 'Error al enviar el correo.', error: error }), { status: 500 });
    }

    return new NextResponse(JSON.stringify({ message: 'Resumen enviado con éxito!' }), { status: 200 });

  } catch (error) {
    console.error('Error in send-summary:', error);
    return new NextResponse(JSON.stringify({ message: 'Error interno del servidor.' }), { status: 500 });
  }
}
