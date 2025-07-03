import * as admin from 'firebase-admin';

// Prevenir la reinicialización en entornos de desarrollo con hot-reloading
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Las variables de entorno en Vercel y .env.local manejan bien los saltos de línea,
        // pero si da problemas, se puede reemplazar \n por saltos de línea reales.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      // Opcional: si usas Realtime Database
      // databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    console.log('Firebase Admin SDK initialized.');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Firebase admin initialization error', error.stack);
    } else {
      console.error('Firebase admin initialization error', error);
    }
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth, admin };
