import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types';

// Esta es la función que Vercel llamará según la programación.
export async function GET(request: Request) {
  // 1. Asegurar el endpoint para que solo Vercel pueda ejecutarlo.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Lógica principal del cron job
  try {
    // eslint-disable-next-line no-console
    console.log('Ejecutando cron job: Verificando vencimientos de pedidos...');

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Buscamos pedidos que no estén completamente pagados.
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', '!=', 'Pagado'));
    
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

    const notifications: string[] = [];

    orders.forEach(order => {
      if (!order.installments) return;
      
      order.installments.forEach((installment, index) => {
        // Nos aseguramos de que la cuota esté pendiente y tenga una fecha.
        if (installment.status === 'pendiente' && installment.dueDate) {
          const dueDate = (installment.dueDate as Timestamp).toDate();

          // Comprobar si está vencida
          if (dueDate < now) {
            const message = `VENCIDO: Pedido #${order.orderNumber}, cuota ${index + 1} del proveedor ${order.providerName} venció el ${dueDate.toLocaleDateString()}`;
            notifications.push(message);
            // eslint-disable-next-line no-console
    console.log(message);
          } 
          // Comprobar si vence en los próximos 3 días
          else if (dueDate <= threeDaysFromNow) {
            const message = `PRÓXIMO A VENCER: Pedido #${order.orderNumber}, cuota ${index + 1} del proveedor ${order.providerName} vence el ${dueDate.toLocaleDateString()}`;
            notifications.push(message);
            // eslint-disable-next-line no-console
    console.log(message);
          }
        }
      });
    });

    if (notifications.length === 0) {
      // eslint-disable-next-line no-console
    console.log('No se encontraron cuotas vencidas o próximas a vencer.');
    }

    // En el futuro, aquí llamaremos a los servicios de email y notificaciones push.

    return NextResponse.json({ 
      ok: true, 
      message: 'Cron job completado exitosamente.',
      found: notifications.length,
      notifications 
    });

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error durante la ejecución del cron job:', error);
    // Usamos `instanceof Error` para un manejo de errores más seguro
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió';
    return new NextResponse(JSON.stringify({ message: 'Error Interno del Servidor', error: errorMessage }), { status: 500 });
  }
}
