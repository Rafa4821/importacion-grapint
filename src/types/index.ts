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

export type ReportOrderStatus = 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';

export interface PaymentInstallment {
  dueDate: Timestamp;
  amount: number;
  status: 'pendiente' | 'pagado';
  isPaid?: boolean; // Add this to align with usage
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

export interface PlainOrder extends Omit<Order, 'orderDate' | 'invoiceDate' | 'installments' | 'createdAt' | 'updatedAt' | 'status'> {
  orderDate: string; // ISO date string
  invoiceDate?: string; // ISO date string
  status: ReportOrderStatus;
  installments: PlainPaymentInstallment[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Configuration for dashboard widgets
export type ChartType = 'pie' | 'bar' | 'line';
export type TimeRange = '7d' | '30d' | '90d' | 'all';

export interface WidgetConfig {
  id: string; 
  metric: string;
  title: string;
  chartType: ChartType;
  timeRange?: TimeRange;
}

export type NotificationEvent =
  | 'Vencimiento de cuota'
  | 'Cuota vencida'
  | 'Cambio de estado del pedido'
  | 'Documento nuevo'
  | 'Gasto nuevo';

export interface NotificationSettings {
  [key: string]: { 
    email: boolean;
    inApp: boolean;
    push: boolean;
  };
}

export interface PushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationContact {
  id: string;
  name: string;
  email: string;
  settings: NotificationSettings;
}

export interface NotificationPayload {
  order?: {
    id?: string;
    orderNumber?: string;
    providerName?: string;
    currency?: Currency;
    status?: OrderStatus;
  };
  installment?: {
    amount?: number;
    dueDate?: Timestamp;
  };
  document?: {
    type?: string;
    name?: string;
  };
  expense?: {
    type?: string;
    amount?: number;
  };
}
