import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Provider } from '@/types';

// The data from the form will not include the 'id', so we use Omit
type NewProviderData = Omit<Provider, 'id'>;

/**
 * Adds a new provider document to the 'providers' collection in Firestore.
 * @param providerData - The provider data from the form.
 * @returns The ID of the newly created document.
 */
export const addProvider = async (providerData: NewProviderData): Promise<void> => {
  try {
    await addDoc(collection(db, 'providers'), {
      ...providerData,
      // We can add created/updated timestamps for good practice
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding provider to Firestore: ', error);
    // Re-throw the error to be handled by the caller
    throw new Error('Failed to add provider.');
  }
};

/**
 * Fetches all providers from the 'providers' collection.
 * @returns An array of Provider objects.
 */
export const getProviders = async (): Promise<Provider[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'providers'));
    const providers = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    } as Provider));
    return providers;
  } catch (error) {
    console.error('Error fetching providers: ', error);
    throw new Error('Failed to fetch providers.');
  }
};

/**
 * Deletes a provider document from Firestore.
 * @param providerId The ID of the provider to delete.
 */
export const deleteProvider = async (providerId: string): Promise<void> => {
  try {
    const providerDocRef = doc(db, 'providers', providerId);
    await deleteDoc(providerDocRef);
  } catch (error) {
    console.error('Error deleting provider: ', error);
    throw new Error('Failed to delete provider.');
  }
};

/**
 * Updates a provider document in Firestore.
 * @param providerId The ID of the provider to update.
 * @param providerData The new data for the provider.
 */
export const updateProvider = async (providerId: string, providerData: Omit<Provider, 'id'>): Promise<void> => {
  try {
    const providerDocRef = doc(db, 'providers', providerId);
    await updateDoc(providerDocRef, {
      ...providerData,
      updatedAt: serverTimestamp(), // Update the timestamp
    });
  } catch (error) {
    console.error('Error updating provider: ', error);
    throw new Error('Failed to update provider.');
  }
};
