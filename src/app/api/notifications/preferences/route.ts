import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

// Simulamos un ID de usuario. En una app real, esto vendría de la sesión de autenticación.
const getUserId = () => 'test-user-id';

export interface NotificationPreferences {
  alerts: {
    paymentDueSoon: { push: boolean; email: boolean; daysBefore: number };
    paymentOverdue: { push: boolean; email: boolean };
    orderStatusChanged: { push: boolean; email: boolean };
  };
}

const defaultPreferences: NotificationPreferences = {
  alerts: {
    paymentDueSoon: { push: true, email: true, daysBefore: 3 },
    paymentOverdue: { push: true, email: true }, // Estas son obligatorias por lógica de negocio
    orderStatusChanged: { push: false, email: true },
  },
};

// GET: Obtener las preferencias del usuario
export async function GET() {
  const userId = getUserId();
  try {
    const prefDocRef = doc(db, 'user_preferences', userId);
    const docSnap = await getDoc(prefDocRef);

    if (docSnap.exists()) {
      return NextResponse.json(docSnap.data());
    } else {
      // Si el usuario no tiene preferencias, se le asignan las por defecto
      await setDoc(prefDocRef, defaultPreferences);
      return NextResponse.json(defaultPreferences);
    }
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

// POST: Actualizar las preferencias del usuario
export async function POST(request: Request) {
  const userId = getUserId();
  try {
    const newPrefs = (await request.json()) as NotificationPreferences;

    // Validación básica (en un futuro se puede ampliar)
    if (!newPrefs || !newPrefs.alerts) {
      return NextResponse.json({ error: 'Invalid preferences format' }, { status: 400 });
    }

    const prefDocRef = doc(db, 'user_preferences', userId);
    await setDoc(prefDocRef, newPrefs, { merge: true }); // 'merge: true' para no sobreescribir todo el documento

    return NextResponse.json({ success: true, updatedPrefs: newPrefs });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
