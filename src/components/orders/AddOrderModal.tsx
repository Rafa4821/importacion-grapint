'use client';

import { useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { Order, Provider, OrderStatus, OrderFormData } from '@/types';
import { X } from 'lucide-react';

// The data structure for our form internally, using Date objects
type ModalFormData = Omit<Order, 'id' | 'installments' | 'providerName' | 'createdAt' | 'updatedAt' | 'isPaid' | 'orderDate' | 'invoiceDate'> & {
  orderDate: Date;
  invoiceDate?: Date;
};

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OrderFormData) => Promise<void> | void; // This now correctly refers to the imported type
  providers: Provider[];
  orderToEdit?: Order | null;
}

const orderStatuses: OrderStatus[] = [
  'Gestionado',
  'En respuesta de proveedor',
  'Primer pago',
  'Invoice recibido por proveedor',
  'AWB/ADS recibido',
  'Enviado a Aduana',
  'Recibido en local',
  'Recibido en bodega Miami',
  'En tránsito',
  'Pagado'
];

export default function AddOrderModal({ isOpen, onClose, onSave, providers, orderToEdit }: AddOrderModalProps) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ModalFormData>({
    defaultValues: {
      orderNumber: '',
      providerId: '',
      orderDate: new Date(),
      totalAmount: 0,
      currency: 'USD',
      invoiceNumber: '',
      invoiceDate: undefined,
      status: 'Gestionado',
    }
  });

  useEffect(() => {
    if (orderToEdit) {
      reset({
        ...orderToEdit,
        orderDate: orderToEdit.orderDate.toDate(), // Convert Firestore Timestamp to JS Date
        invoiceDate: orderToEdit.invoiceDate ? orderToEdit.invoiceDate.toDate() : undefined,
      });
    } else {
      // Reset to default values for a new order
      reset({
        orderNumber: '',
        providerId: '',
        orderDate: new Date(),
        totalAmount: 0,
        currency: 'USD',
        invoiceNumber: '',
        invoiceDate: undefined,
        status: 'Gestionado',
      });
    }
  }, [orderToEdit, reset]);

  if (!isOpen) return null;

    const onSubmit: SubmitHandler<ModalFormData> = (data) => {
    // Transform dates from Date objects to strings before saving
    const dataForSave: OrderFormData = {
      ...data,
      orderDate: data.orderDate.toISOString().split('T')[0],
      invoiceDate: data.invoiceDate ? data.invoiceDate.toISOString().split('T')[0] : undefined,
    };
    onSave(dataForSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{orderToEdit ? 'Editar Pedido' : 'Añadir Pedido'}</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="orderNumber" className="block font-medium">Número de Pedido</label>
            <input {...register('orderNumber', { required: 'El número de pedido es requerido' })} className="w-full p-2 border rounded" />
            {errors.orderNumber && <p className="text-red-500 text-sm">{errors.orderNumber.message}</p>}
          </div>

          <div>
            <label htmlFor="providerId" className="block font-medium">Proveedor</label>
            <select {...register('providerId', { required: 'Debe seleccionar un proveedor' })} className="w-full p-2 border rounded">
              <option value="">Seleccione un proveedor</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.companyName}</option>
              ))}
            </select>
            {errors.providerId && <p className="text-red-500 text-sm">{errors.providerId.message}</p>}
          </div>

          <div>
            <label htmlFor="orderDate" className="block font-medium">Fecha del Pedido</label>
            <Controller
              name="orderDate"
              control={control}
              render={({ field }) => <input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} className="w-full p-2 border rounded" />}
            />
          </div>

          <div>
            <label htmlFor="totalAmount" className="block font-medium">Monto Total</label>
            <input type="number" {...register('totalAmount', { required: 'El monto es requerido', valueAsNumber: true, min: { value: 0.01, message: 'El monto debe ser positivo' } })} className="w-full p-2 border rounded" />
            {errors.totalAmount && <p className="text-red-500 text-sm">{errors.totalAmount.message}</p>}
          </div>

          <div>
            <label htmlFor="currency" className="block font-medium">Moneda</label>
            <select {...register('currency')} className="w-full p-2 border rounded">
              <option value="USD">USD</option>
              <option value="CLP">CLP</option>
            </select>
          </div>

          <div>
            <label htmlFor="invoiceNumber" className="block font-medium">Número de Invoice</label>
            <input {...register('invoiceNumber')} className="w-full p-2 border rounded" />
          </div>

          <div>
            <label htmlFor="invoiceDate" className="block font-medium">Fecha de Invoice</label>
            <Controller
              name="invoiceDate"
              control={control}
              render={({ field }) => <input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} className="w-full p-2 border rounded" />}
            />
          </div>

          <div>
            <label htmlFor="status" className="block font-medium">Estado</label>
            <select {...register('status', { required: 'El estado es requerido' })} className="w-full p-2 border rounded">
              {orderStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
