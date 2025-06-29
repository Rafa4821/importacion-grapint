import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { Order, Provider } from '@/types';
import { Resend } from 'resend';
import { ReportSummaryEmail } from '@/components/emails/ReportSummaryEmail';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, status, startDate, endDate, recipientEmail } = body;

    if (!recipientEmail) {
      return new NextResponse(JSON.stringify({ message: 'El email del destinatario es requerido.' }), { status: 400 });
    }

    // 1. Construir la consulta a Firestore dinámicamente
    let queries = [];
    if (providerId && providerId !== 'all') {
      queries.push(where('providerId', '==', providerId));
    }
    if (status && status !== 'all') {
      queries.push(where('status', '==', status));
    }
    if (startDate) {
      queries.push(where('createdAt', '>=', Timestamp.fromDate(new Date(startDate))));
    }
    if (endDate) {
      // Añadimos 1 día a la fecha final para incluir todo el día
      const endOfDay = new Date(endDate);
      endOfDay.setDate(endOfDay.getDate() + 1);
      queries.push(where('createdAt', '<', Timestamp.fromDate(endOfDay)));
    }

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, ...queries);
    
    // 2. Ejecutar la consulta y obtener los pedidos
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

    // 3. Obtener el nombre del proveedor si se seleccionó uno
    let providerName = 'Todos';
    if (providerId && providerId !== 'all') {
      const providerDoc = await getDoc(doc(db, 'providers', providerId));
      if (providerDoc.exists()) {
        providerName = (providerDoc.data() as Provider).companyName;
      }
    }

    // 4. Preparar y enviar el correo
    const filtersForEmail = {
      providerName,
      status: status === 'all' ? 'Todos' : status,
      startDate,
      endDate,
    };

    const { data, error } = await resend.emails.send({
      from: 'Grapint Reportes <onboarding@resend.dev>',
      to: recipientEmail,
      subject: `Reporte de Pedidos: ${providerName}`,
      react: React.createElement(ReportSummaryEmail, { filters: filtersForEmail, orders }),
    });

    if (error) {
      console.error('Error al enviar email desde Resend:', error);
      return new NextResponse(JSON.stringify({ message: 'Error al enviar el correo.' }), { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Reporte enviado exitosamente.', emailId: data?.id });

  } catch (error) {
    console.error('Error en la API de reportes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió';
    return new NextResponse(JSON.stringify({ message: 'Error Interno del Servidor', error: errorMessage }), { status: 500 });
  }
}
