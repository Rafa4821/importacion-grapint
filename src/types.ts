import { Timestamp, FieldValue } from 'firebase/firestore';

export interface Installment {
  id: string;
  amount: number;
  dueDate: Date | Timestamp | FieldValue;
  status: 'pendiente' | 'pagado';
  paymentDate?: Date | Timestamp | FieldValue;
}

export interface Order {
  id: string;
  orderNumber: string;
  providerId: string;
  providerName?: string;
  issueDate: Date | Timestamp | FieldValue;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  installments?: Installment[];
  createdAt: Timestamp | FieldValue;
}

export interface Provider {
  id: string;
  name: string;
}

export type OrderStatus = 'Pendiente' | 'En Proceso' | 'Pagado' | 'Cancelado';
