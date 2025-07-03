import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { NotificationContact } from '@/types';

const contactsCollection = collection(db, 'notificationContacts');

// A default settings object for new contacts
export const getDefaultNotificationSettings = () => ({
  'Vencimiento de cuota': { email: true, inApp: true, push: false },
  'Cuota vencida': { email: true, inApp: true, push: true },
  'Cambio de estado del pedido': { email: false, inApp: true, push: false },
  'Documento nuevo': { email: false, inApp: true, push: false },
  'Gasto nuevo': { email: false, inApp: true, push: false },
});

export const getContacts = async (): Promise<NotificationContact[]> => {
  const q = query(contactsCollection, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as NotificationContact)
  );
};

export const addContact = async (contact: Omit<NotificationContact, 'id'>): Promise<string> => {
  const docRef = await addDoc(contactsCollection, contact);
  return docRef.id;
};

export const updateContact = async (
  id: string,
  data: Omit<NotificationContact, 'id'>
): Promise<void> => {
  const contactDoc = doc(db, 'notificationContacts', id);
  await updateDoc(contactDoc, data);
};

export const deleteContact = async (id: string): Promise<void> => {
  const contactDoc = doc(db, 'notificationContacts', id);
  await deleteDoc(contactDoc);
};
