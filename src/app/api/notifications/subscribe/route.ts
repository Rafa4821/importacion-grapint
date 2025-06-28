import { NextResponse } from 'next/server';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Este endpoint recibe una suscripción de notificación push y la guarda en Firestore.
export async function POST(request: Request) {
  try {
    const subscription = await request.json();

    // Validación básica de la suscripción
    if (!subscription || !subscription.endpoint) {
      return new NextResponse('Cuerpo de la petición inválido: falta la suscripción.', { status: 400 });
    }

    // Guardamos la suscripción en una nueva colección en Firestore
    const subscriptionsRef = collection(db, 'pushSubscriptions');
    await addDoc(subscriptionsRef, subscription);

    return NextResponse.json({ success: true, message: 'Suscripción guardada correctamente.' });

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al guardar la suscripción:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió';
    return new NextResponse(JSON.stringify({ message: 'Error Interno del Servidor', error: errorMessage }), { status: 500 });
  }
}
