import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, Timestamp, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types';
import { Resend } from 'resend';
import { ExpirationNotificationEmail } from '@/components/emails/ExpirationNotificationEmail';
import webpush, { PushSubscription } from 'web-push';

// Esta es la función que Vercel llamará según la programación.

// Definimos la estructura de preferencias aquí para mantener el archivo autocontenido
interface NotificationPreferences {
  alerts: {
    paymentDueSoon: { push: boolean; email: boolean; daysBefore: number };
    paymentOverdue: { push: boolean; email: boolean };
    orderStatusChanged: { push: boolean; email: boolean };
  };
}

const defaultPreferences: NotificationPreferences = {
  alerts: {
    paymentDueSoon: { push: true, email: true, daysBefore: 3 },
    paymentOverdue: { push: true, email: true },
    orderStatusChanged: { push: false, email: true },
  },
};

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const recipientsEnv = process.env.NOTIFICATION_EMAIL_RECIPIENT;
  if (!recipientsEnv) {
    console.error('Error: NOTIFICATION_EMAIL_RECIPIENT no está definida.');
    return new NextResponse('Configuración de servidor incompleta', { status: 500 });
  }
  const notificationRecipients = recipientsEnv.split(',').map(email => email.trim());

  webpush.setVapidDetails(
    process.env.VAPID_MAILTO || 'mailto:your-email@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
  );

  try {
    console.log('Cron job iniciado...');

    // 1. Cargar las preferencias del usuario
    const userId = 'test-user-id'; // Usamos el ID de usuario simulado
    const prefDocRef = doc(db, 'user_preferences', userId);
    const docSnap = await getDoc(prefDocRef);
    const prefs: NotificationPreferences = docSnap.exists() ? (docSnap.data() as NotificationPreferences) : defaultPreferences;
    console.log('Preferencias de notificación cargadas:', prefs);

    const now = new Date();
    const upcomingDueDate = new Date();
    upcomingDueDate.setDate(now.getDate() + (prefs.alerts.paymentDueSoon.daysBefore || 3));

    const subscriptionsSnapshot = await getDocs(collection(db, 'pushSubscriptions'));
    const pushSubscriptions = subscriptionsSnapshot.docs.map(doc => doc.data());

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', '!=', 'Pagado'));
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

    const results = [];

    for (const order of orders) {
      if (!order.installments) continue;

      for (const [index, installment] of order.installments.entries()) {
        if (installment.status !== 'pendiente' || !installment.dueDate) continue;

        const dueDate = (installment.dueDate as Timestamp).toDate();
        let alertType: 'VENCIDO' | 'PRÓXIMO A VENCER' | null = null;

        if (dueDate < now) {
          alertType = 'VENCIDO';
        } else if (dueDate <= upcomingDueDate) {
          alertType = 'PRÓXIMO A VENCER';
        }

        if (alertType) {
          const subject = `${alertType === 'VENCIDO' ? 'Alerta de Vencimiento' : 'Aviso de Próximo Vencimiento'}: Pedido #${order.orderNumber}`;

          // 2. Comprobar preferencias antes de enviar EMAIL
          const shouldSendEmail = (alertType === 'VENCIDO' && prefs.alerts.paymentOverdue.email) || (alertType === 'PRÓXIMO A VENCER' && prefs.alerts.paymentDueSoon.email);

          if (shouldSendEmail) {
            try {
              const { data, error } = await resend.emails.send({
                from: 'Grapint Notificaciones <onboarding@resend.dev>',
                to: notificationRecipients,
                subject: subject,
                react: ExpirationNotificationEmail({ orderNumber: order.orderNumber, providerName: order.providerName, installmentNumber: index + 1, dueDate: dueDate.toLocaleDateString('es-CL'), amount: installment.amount, currency: order.currency || 'USD', status: alertType }),
              });
              if (error) throw error;
                            console.log(`Email enviado para pedido #${order.orderNumber}.`);
              results.push({ type: 'email', success: true, orderNumber: order.orderNumber });

              // Guardar en historial
              await addDoc(collection(db, 'notifications'), {
                userId,
                createdAt: Timestamp.now(),
                type: alertType === 'VENCIDO' ? 'paymentOverdue' : 'paymentDueSoon',
                channel: 'email',
                title: subject,
                body: `La cuota de ${installment.amount} ${order.currency} para el proveedor ${order.providerName} vence el ${dueDate.toLocaleDateString('es-CL')}`,
                isRead: false,
                referenceUrl: `/orders/${order.id}`,
              });
            } catch (e) {
              console.error(`Error al enviar email para pedido #${order.orderNumber}:`, e);
              results.push({ type: 'email', success: false, orderNumber: order.orderNumber, error: e instanceof Error ? e.message : 'Unknown' });
            }
          } else {
            console.log(`Email para pedido #${order.orderNumber} omitido por preferencias.`);
          }

          // 3. Comprobar preferencias antes de enviar PUSH
          const shouldSendPush = (alertType === 'VENCIDO' && prefs.alerts.paymentOverdue.push) || (alertType === 'PRÓXIMO A VENCER' && prefs.alerts.paymentDueSoon.push);

          if (shouldSendPush && pushSubscriptions.length > 0) {
            const pushPayload = JSON.stringify({ title: subject, body: `La cuota de ${installment.amount} ${order.currency} vence el ${dueDate.toLocaleDateString('es-CL')}`, url: `/orders/${order.id}` });
            for (const sub of pushSubscriptions) {
              try {
                await webpush.sendNotification(sub as PushSubscription, pushPayload);
                results.push({ type: 'push', success: true, endpoint: sub.endpoint });

                // Guardar en historial (una sola vez por lote de pushes)
                if (pushSubscriptions.indexOf(sub) === 0) { // Solo guardar en la primera iteración
                  await addDoc(collection(db, 'notifications'), {
                    userId,
                    createdAt: Timestamp.now(),
                    type: alertType === 'VENCIDO' ? 'paymentOverdue' : 'paymentDueSoon',
                    channel: 'push',
                    title: subject,
                    body: `La cuota de ${installment.amount} ${order.currency} vence el ${dueDate.toLocaleDateString('es-CL')}`,
                    isRead: false,
                    referenceUrl: `/orders/${order.id}`,
                  });
                }
              } catch (e) {
                console.error(`Error al enviar push a ${sub.endpoint}:`, e);
                results.push({ type: 'push', success: false, endpoint: sub.endpoint, error: e instanceof Error ? e.message : 'Unknown' });
              }
            }
          } else if (shouldSendPush) {
            console.log(`Notificación Push para pedido #${order.orderNumber} omitida (no hay suscriptores).`);
          } else {
            console.log(`Notificación Push para pedido #${order.orderNumber} omitida por preferencias.`);
          }
        }
      }
    }

    console.log('Cron job completado.');
    return NextResponse.json({ ok: true, message: 'Cron job completado.', results });

  } catch (error) {
    console.error('Error en el cron job:', error);
    return new NextResponse(JSON.stringify({ message: 'Error Interno del Servidor', error: error instanceof Error ? error.message : 'Unknown' }), { status: 500 });
  }
}
