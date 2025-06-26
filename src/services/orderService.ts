import { db } from '@/lib/firebase';
import { PaymentTerms } from '@/types';
import { collection, addDoc, getDocs, getDoc, deleteDoc, doc, serverTimestamp, Timestamp, DocumentData, QueryDocumentSnapshot, updateDoc } from 'firebase/firestore';
import { Order, Provider, PaymentInstallment, OrderStatus } from '@/types';

/**
 * Fetches all orders from the 'orders' collection.
 * @returns An array of Order objects.
 */
export const getOrders = async (): Promise<Order[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));
    const orders = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    } as Order));
    return orders;
  } catch (error) {
    console.error('Error fetching orders: ', error);
    throw new Error('Failed to fetch orders.');
  }
};

/**
 * Deletes an order document from Firestore.
 * @param orderId The ID of the order to delete.
 */
export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await deleteDoc(orderDocRef);
  } catch (error) {
    console.error('Error deleting order: ', error);
    throw new Error('Failed to delete order.');
  }
};

/**
 * Adds a new order to Firestore after calculating payment installments.
 * @param orderData The raw order data from the form.
 */
type OrderFormDataForService = Omit<Order, 'id' | 'installments' | 'providerName' | 'createdAt' | 'updatedAt' | 'isPaid' | 'orderDate' | 'invoiceDate'> & {
  orderDate: Date;
  invoiceDate?: Date;
};

export const addOrder = async (orderData: OrderFormDataForService): Promise<void> => {
  try {
    // 1. Get provider details to access payment terms
    const providerDocRef = doc(db, 'providers', orderData.providerId);
    const providerSnap = await getDoc(providerDocRef);

    if (!providerSnap.exists()) {
      throw new Error('Proveedor no encontrado!');
    }
    const provider = providerSnap.data() as Provider;


    // 2. Calculate installments based on payment terms
    const installments: PaymentInstallment[] = [];
    const orderDate = new Date(orderData.orderDate);
    const invoiceDate = orderData.invoiceDate ? new Date(orderData.invoiceDate) : undefined;

    const paymentTerms = provider.paymentTerms;
    if (paymentTerms.type === 'contado') {
      installments.push({
        dueDate: Timestamp.fromDate(orderDate),
        amount: orderData.totalAmount,
        status: 'pendiente',
      });
    } else if (paymentTerms.type === 'credito') {
      // Sanitize values here, inside the type-narrowed block

      const days = parseInt(String(paymentTerms.days ?? 0), 10);
      const downPaymentPercentage = paymentTerms.downPaymentPercentage 
        ? parseFloat(String(paymentTerms.downPaymentPercentage)) 
        : 0;


      if (downPaymentPercentage > 0) {
        const downPayment = orderData.totalAmount * (downPaymentPercentage / 100);
        const remainingAmount = orderData.totalAmount - downPayment;
        
        // Down payment installment
        installments.push({
          dueDate: Timestamp.fromDate(orderDate),
          amount: downPayment,
          status: 'pendiente',
        });
        
        // Remaining balance installment
        const dueDate = new Date(orderDate);
        dueDate.setDate(dueDate.getDate() + days);
        installments.push({
          dueDate: Timestamp.fromDate(dueDate),
          amount: remainingAmount,
          status: 'pendiente',
        });
      } else {
        // Full amount on credit, single installment
        const dueDate = new Date(orderDate);
        dueDate.setDate(dueDate.getDate() + days);
        installments.push({
          dueDate: Timestamp.fromDate(dueDate),
          amount: orderData.totalAmount,
          status: 'pendiente',
        });
      }
    }



    // 3. Construct the full order object
    const newOrder: Omit<Order, 'id'> = {
      ...orderData,
      orderDate: Timestamp.fromDate(orderDate),
      invoiceDate: invoiceDate ? Timestamp.fromDate(invoiceDate) : undefined,
      providerName: provider.companyName, // Denormalize for easy display
      isPaid: false, // Default to not paid
      installments,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 4. Save to Firestore
    await addDoc(collection(db, 'orders'), newOrder);

  } catch (error) {
    console.error('Error adding order: ', error);
    throw new Error('Failed to add order.');
  }
};

/**
 * Updates the status of a specific order.
 * @param orderId The ID of the order to update.
 * @param status The new status for the order.
 */
export const updateOrder = async (orderId: string, orderData: OrderFormDataForService): Promise<void> => {
  try {
    const orderDocRef = doc(db, 'orders', orderId);

    // 1. Get provider details to access payment terms
    const providerDocRef = doc(db, 'providers', orderData.providerId);
    const providerSnap = await getDoc(providerDocRef);

    if (!providerSnap.exists()) {
      throw new Error('Proveedor no encontrado!');
    }
    const provider = providerSnap.data() as Provider;


    // 2. Recalculate installments based on payment terms
    const installments: PaymentInstallment[] = [];
    const orderDate = new Date(orderData.orderDate);
    const invoiceDate = orderData.invoiceDate ? new Date(orderData.invoiceDate) : undefined;

    // Sanitize payment terms to ensure numeric values for calculations
    let paymentTerms: PaymentTerms;
    if (provider.paymentTerms.type === 'credito') {
      paymentTerms = {
        type: 'credito',
        days: parseInt(String(provider.paymentTerms.days ?? 0), 10),
        downPaymentPercentage: provider.paymentTerms.downPaymentPercentage
          ? parseFloat(String(provider.paymentTerms.downPaymentPercentage))
          : undefined,
      };
    } else {
      paymentTerms = { type: 'contado' };
    }

    if (paymentTerms.type === 'contado') {
      installments.push({
        dueDate: Timestamp.fromDate(orderDate),
        amount: orderData.totalAmount,
        status: 'pendiente',
      });
    } else if (paymentTerms.type === 'credito') {
      if (paymentTerms.downPaymentPercentage && paymentTerms.downPaymentPercentage > 0) {
        const downPayment = orderData.totalAmount * (paymentTerms.downPaymentPercentage / 100);
        const remainingAmount = orderData.totalAmount - downPayment;
        
        installments.push({ dueDate: Timestamp.fromDate(orderDate), amount: downPayment, status: 'pendiente' });
        
        const dueDate = new Date(orderDate);
        dueDate.setDate(dueDate.getDate() + paymentTerms.days);
        installments.push({ dueDate: Timestamp.fromDate(dueDate), amount: remainingAmount, status: 'pendiente' });
      } else {
        const dueDate = new Date(orderDate);
        dueDate.setDate(dueDate.getDate() + paymentTerms.days);
        installments.push({ dueDate: Timestamp.fromDate(dueDate), amount: orderData.totalAmount, status: 'pendiente' });
      }
    }



    // 3. Construct the full order object for update
    const orderToUpdate = {
      ...orderData,
      orderDate: Timestamp.fromDate(orderDate),
      invoiceDate: invoiceDate ? Timestamp.fromDate(invoiceDate) : undefined,
      providerName: provider.companyName,
      installments,
      updatedAt: serverTimestamp(),
    };

    // 4. Update in Firestore
    await updateDoc(orderDocRef, orderToUpdate);

  } catch (error) {
    console.error('Error updating order: ', error);
    throw new Error('Failed to update order.');
  }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, {
      status: status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating order status: ', error);
    throw new Error('Failed to update order status.');
  }
};
