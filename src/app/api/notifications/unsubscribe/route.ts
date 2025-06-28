import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Este endpoint busca y elimina una suscripción de notificación push de Firestore.
export async function POST(request: Request) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return new NextResponse('Cuerpo de la petición inválido: falta el endpoint.', { status: 400 });
    }

    const subscriptionsRef = collection(db, 'pushSubscriptions');
    const q = query(subscriptionsRef, where('endpoint', '==', endpoint));
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ success: true, message: 'La suscripción no fue encontrada, no se realizó ninguna acción.' });
    }

    // Usamos un batch para eliminar todos los documentos que coincidan (aunque debería ser solo uno)
    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json({ success: true, message: 'Suscripción eliminada correctamente.' });

  } catch (error) {
        console.error('Error al eliminar la suscripción:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió';
    return new NextResponse(JSON.stringify({ message: 'Error Interno del Servidor', error: errorMessage }), { status: 500 });
  }
}
