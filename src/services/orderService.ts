import { db } from '@/lib/firebase';

import { collection, addDoc, getDocs, getDoc, deleteDoc, doc, serverTimestamp, Timestamp, DocumentData, QueryDocumentSnapshot, updateDoc } from 'firebase/firestore';
import { Order, Provider, PaymentInstallment, OrderStatus, PaymentTerms, OrderFormData } from '@/types';

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
export type OrderFormDataForService = Omit<OrderFormData, 'orderDate' | 'invoiceDate'> & {
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
    const { invoiceDate: _originalInvoiceDate, ...restOfOrderData } = orderData;

    const newOrder: Omit<Order, 'id'> = {
      ...restOfOrderData,
      orderDate: Timestamp.fromDate(orderDate),
      providerName: provider.companyName, // Denormalize for easy display
      isPaid: false, // Default to not paid
      installments,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (invoiceDate) {
      newOrder.invoiceDate = Timestamp.fromDate(invoiceDate);
    }

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

/**
 * Fetches a single order by its ID.
 * @param orderId The ID of the order to fetch.
 * @returns An Order object or null if not found.
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(orderDocRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order;
    }
    return null;
  } catch (error) {
    console.error('Error fetching order by ID: ', error);
    throw new Error('Failed to fetch order.');
  }
};

export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<void> => {
  const orderDocRef = doc(db, 'orders', orderId);

  try {
    const orderSnap = await getDoc(orderDocRef);
    if (!orderSnap.exists()) {
      throw new Error('Pedido no encontrado');
    }

    const order = orderSnap.data() as Order;
    let updatedInstallments = [...order.installments];

    // Si el estado es 'Primer pago', marca la primera cuota como pagada.
    if (newStatus === 'Primer pago') {
      if (updatedInstallments.length > 0 && updatedInstallments[0].status === 'pendiente') {
        updatedInstallments[0] = { ...updatedInstallments[0], status: 'pagado' };
      }
    }

    // Si el estado es 'Pagado', marca todas las cuotas como pagadas.
    if (newStatus === 'Pagado') {
      updatedInstallments = updatedInstallments.map(inst => ({ ...inst, status: 'pagado' }));
    }

    // Determina si el pedido está totalmente pagado
    const isPaid = newStatus === 'Pagado' || updatedInstallments.every(inst => inst.status === 'pagado');

    await updateDoc(orderDocRef, {
      status: newStatus,
      installments: updatedInstallments,
      isPaid: isPaid,
      updatedAt: serverTimestamp(),
    });

  } catch (error) {
    console.error('Error updating order status: ', error);
    throw new Error('Failed to update order status.');
  }
};

/**
 * Updates the status of a specific installment for an order.
 * @param orderId The ID of the order.
 * @param installmentIndex The index of the installment to update.
 * @param newStatus The new status for the installment.
 */
export const updateInstallmentStatus = async (
  orderId: string, 
  installmentIndex: number,
  newStatus: 'pagado' | 'pendiente'
): Promise<void> => {
  const orderDocRef = doc(db, 'orders', orderId);

  try {
    const orderSnap = await getDoc(orderDocRef);
    if (!orderSnap.exists()) {
      throw new Error('Pedido no encontrado');
    }

    const order = orderSnap.data() as Order;
    const updatedInstallments = [...order.installments];

    if (installmentIndex < 0 || installmentIndex >= updatedInstallments.length) {
      throw new Error('Índice de cuota inválido');
    }

    // Update the specific installment's status
    updatedInstallments[installmentIndex] = { 
      ...updatedInstallments[installmentIndex], 
      status: newStatus 
    };

    // Check if all installments are paid to update the main order status
    const allPaid = updatedInstallments.every(inst => inst.status === 'pagado');
    const newOrderStatus = allPaid ? 'Pagado' : order.status;

    await updateDoc(orderDocRef, {
      installments: updatedInstallments,
      isPaid: allPaid,
      status: newOrderStatus,
      updatedAt: serverTimestamp(),
    });

  } catch (error) {
    console.error('Error updating installment status: ', error);
    throw new Error('Failed to update installment status.');
  }
};
