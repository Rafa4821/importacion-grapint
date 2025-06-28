import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types';
import { Resend } from 'resend';
import { ExpirationNotificationEmail } from '@/components/emails/ExpirationNotificationEmail';
import webpush, { PushSubscription } from 'web-push';

// Esta es la función que Vercel llamará según la programación.
export async function GET(request: Request) {
  // 1. Asegurar el endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Instanciar Resend y definir destinatario
  const resend = new Resend(process.env.RESEND_API_KEY);
  const recipientsEnv = process.env.NOTIFICATION_EMAIL_RECIPIENT;

  if (!recipientsEnv) {
        console.error('Error: La variable de entorno NOTIFICATION_EMAIL_RECIPIENT no está definida.');
    return new NextResponse('Configuración de servidor incompleta', { status: 500 });
  }

  const notificationRecipients = recipientsEnv.split(',').map(email => email.trim());

  // 3. Configurar web-push
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO || 'mailto:your-email@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
  );

  // 3. Lógica principal del cron job
  try {
    console.log('Cron job iniciado...');

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // 4. Obtener todas las suscripciones de push
    const subscriptionsSnapshot = await getDocs(collection(db, 'pushSubscriptions'));
    const pushSubscriptions = subscriptionsSnapshot.docs.map(doc => doc.data());

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', '!=', 'Pagado'));
    
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

    const results = [];

    // Usamos for...of para poder usar await dentro del bucle
    for (const order of orders) {
      if (!order.installments) continue;
      
      for (const [index, installment] of order.installments.entries()) {
        if (installment.status === 'pendiente' && installment.dueDate) {
          const dueDate = (installment.dueDate as Timestamp).toDate();
          let emailStatus: 'VENCIDO' | 'PRÓXIMO A VENCER' | null = null;
          
          if (dueDate < now) {
            emailStatus = 'VENCIDO';
          } else if (dueDate <= threeDaysFromNow) {
            emailStatus = 'PRÓXIMO A VENCER';
          }

          if (emailStatus) {
            const subject = `${emailStatus === 'VENCIDO' ? 'Alerta de Vencimiento' : 'Aviso de Próximo Vencimiento'}: Pedido #${order.orderNumber}`;
            
            try {
              const { data, error } = await resend.emails.send({
                from: 'Grapint Notificaciones <onboarding@resend.dev>', // IMPORTANTE: Cambiar a un dominio verificado
                to: notificationRecipients,
                subject: subject,
                react: ExpirationNotificationEmail({
                  orderNumber: order.orderNumber,
                  providerName: order.providerName,
                  installmentNumber: index + 1,
                  dueDate: dueDate.toLocaleDateString('es-CL'),
                  amount: installment.amount,
                  currency: order.currency || 'USD', // Usamos USD como fallback por seguridad
                  status: emailStatus,
                }),
              });

              if(error) {
                throw error;
              }

                            console.log(`Email enviado exitosamente para pedido #${order.orderNumber}. Email ID: ${data?.id}`);
              results.push({ type: 'email', success: true, orderNumber: order.orderNumber, emailId: data?.id });

            } catch (emailError) {
                            console.error(`Error al enviar email para pedido #${order.orderNumber}:`, emailError);
              const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
              results.push({ type: 'email', success: false, orderNumber: order.orderNumber, error: errorMessage });
            }

            // Enviar notificaciones push a todos los suscritos
            const pushPayload = JSON.stringify({
              title: subject,
              body: `La cuota de ${installment.amount.toLocaleString('es-CL')} ${order.currency || 'USD'} para el proveedor ${order.providerName} vence el ${dueDate.toLocaleDateString('es-CL')}`,
              url: `/orders/${order.id}` // URL a la que se redirigirá al hacer clic
            });

            for (const sub of pushSubscriptions) {
              try {
                await webpush.sendNotification(sub as PushSubscription, pushPayload);
                                console.log(`Notificación push enviada a ${sub.endpoint}`);
                results.push({ type: 'push', success: true, endpoint: sub.endpoint });
              } catch (pushError) {
                                console.error(`Error al enviar push a ${sub.endpoint}:`, pushError);
                // Podríamos querer eliminar suscripciones inválidas (error 410 Gone)
                const errorMessage = pushError instanceof Error ? pushError.message : 'Unknown error';
                results.push({ type: 'push', success: false, endpoint: sub.endpoint, error: errorMessage });
              }
            }
          }
        }
      }
    }

    if (results.length === 0) {
            console.log('No se encontraron cuotas para notificar.');
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Cron job completado.',
      results: results
    });

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error catastrófico durante la ejecución del cron job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió';
    return new NextResponse(JSON.stringify({ message: 'Error Interno del Servidor', error: errorMessage }), { status: 500 });
  }
}
