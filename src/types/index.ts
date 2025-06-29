import { Timestamp, FieldValue } from 'firebase/firestore';

export type Currency = 'CLP' | 'USD';

export interface ContactPerson {
  name: string;
  email: string;
  phone: string;
  whatsapp?: string; // Made optional
}

export interface ProductTypes {
  insumos: boolean;
  repuestos: {
    original: boolean;
    alternativo: boolean;
  };
}

export type PaymentTerms =
  | { type: 'contado' }
  | {
      type: 'credito';
      days: number;
      downPaymentPercentage?: number; // e.g., 20 for 20%
    };

export interface Provider {
  id: string; // Firestore document ID
  companyName: string;
  contacts: ContactPerson[]; // Supports multiple contacts
  productTypes: ProductTypes;
  paymentTerms: PaymentTerms;
  createdAt?: FieldValue;
  updatedAt?: FieldValue;
}

export type OrderStatus =
  | 'Gestionado'
  | 'En respuesta de proveedor'
  | 'Primer pago'
  | 'Invoice recibido por proveedor'
  | 'AWB/ADS recibido'
  | 'Enviado a Aduana'
  | 'Recibido en local'
  | 'Recibido en bodega Miami'
  | 'En tránsito'
  | 'Pagado';

export interface PaymentInstallment {
  dueDate: Timestamp;
  amount: number;
  status: 'pendiente' | 'pagado';
}

export type OrderFormData = Omit<Order, 'id' | 'providerName' | 'isPaid' | 'installments' | 'createdAt' | 'updatedAt' | 'orderDate' | 'invoiceDate'> & {
  orderDate: string;
  invoiceDate?: string;
};

export interface Order {
  id: string;
  orderNumber: string;
  providerId: string;
  providerName: string; // Denormalized for easy display
  orderDate: Timestamp;
  invoiceNumber?: string;
  invoiceDate?: Timestamp;
  totalAmount: number;
  currency: Currency;
  status: OrderStatus;
  isPaid: boolean; // Field to manually mark as paid
  installments: PaymentInstallment[];
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

export interface Alert {
  id: string;
  orderId: string;
  message: string;
  alertDate: Timestamp;
  type: 'default' | 'custom';
}

// Serializable versions of types for email components
export interface PlainPaymentInstallment extends Omit<PaymentInstallment, 'dueDate'> {
  dueDate: string; // ISO date string
}

export interface PlainOrder extends Omit<Order, 'orderDate' | 'invoiceDate' | 'installments' | 'createdAt' | 'updatedAt'> {
  orderDate: string; // ISO date string
  invoiceDate?: string; // ISO date string
  installments: PlainPaymentInstallment[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
