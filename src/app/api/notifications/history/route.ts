import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

export async function GET() {
  try {
    // En un futuro, obtendrías el ID del usuario de la sesión de autenticación
    const userId = 'test-user-id';

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'), // Ordenar por fecha de creación, más recientes primero
      limit(50) // Limitar a las últimas 50 notificaciones para no sobrecargar
    );

    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convertir Timestamp de Firestore a un string ISO, manejando casos donde no exista.
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date(0).toISOString(),
      };
    });

    return NextResponse.json(notifications);

  } catch (error) {
    console.error('Error al obtener el historial de notificaciones:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió';
    return new NextResponse(JSON.stringify({ message: 'Error Interno del Servidor', error: errorMessage }), { status: 500 });
  }
}
