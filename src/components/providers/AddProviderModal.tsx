'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { Provider, ProductTypes, PaymentTerms, ContactPerson } from '@/types';
import { X, PlusCircle, Trash2 } from 'lucide-react';

interface AddProviderModalProps {
  providerToEdit?: Provider | null;
  onClose: () => void;
  onSave: (data: Omit<Provider, 'id'>) => void;
}

const createEmptyContact = (): ContactPerson => ({
  name: '',
  email: '',
  phone: '',
  whatsapp: '',
});

interface ProviderFormData {
  companyName: string;
  contacts: ContactPerson[];
  productTypes: ProductTypes;
  paymentTerms: {
    type: 'contado' | 'credito';
    days?: number;
    hasDownPayment?: boolean;
    downPaymentPercentage?: number;
  };
}

export default function AddProviderModal({ providerToEdit, onClose, onSave }: AddProviderModalProps) {
  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<ProviderFormData>({
    defaultValues: {
      companyName: '',
      contacts: [createEmptyContact()],
      productTypes: { insumos: false, repuestos: { original: false, alternativo: false } },
      paymentTerms: { type: 'contado', days: 0, hasDownPayment: false, downPaymentPercentage: 0 },
    }
  });

  useEffect(() => {
    if (providerToEdit) {
      const { paymentTerms, ...rest } = providerToEdit;
      const formData = {
        ...rest,
        paymentTerms: {
          type: paymentTerms.type,
          days: paymentTerms.type === 'credito' ? paymentTerms.days : 0,
          hasDownPayment: paymentTerms.type === 'credito' && !!paymentTerms.downPaymentPercentage,
          downPaymentPercentage: paymentTerms.type === 'credito' ? paymentTerms.downPaymentPercentage : 0,
        }
      };
      reset(formData);
    } else {
      reset({
        companyName: '',
        contacts: [createEmptyContact()],
        productTypes: { insumos: false, repuestos: { original: false, alternativo: false } },
        paymentTerms: { type: 'contado', days: 0, hasDownPayment: false, downPaymentPercentage: 0 },
      });
    }
  }, [providerToEdit, reset]);

  const paymentType = watch('paymentTerms.type');
  const hasDownPayment = watch('paymentTerms.hasDownPayment');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts',
  });

  const onSubmit: SubmitHandler<ProviderFormData> = (data) => {
    const { paymentTerms, ...restOfProvider } = data;

    let finalPaymentTerms: PaymentTerms;

    if (paymentTerms.type === 'contado') {
      finalPaymentTerms = { type: 'contado' };
    } else {
      finalPaymentTerms = {
        type: 'credito',
        days: parseInt(String(paymentTerms.days), 10) || 0,
      };
      if (paymentTerms.hasDownPayment && paymentTerms.downPaymentPercentage) {
        finalPaymentTerms.downPaymentPercentage = parseFloat(String(paymentTerms.downPaymentPercentage));
      }
    }

    const providerToSave: Omit<Provider, 'id'> = {
      ...restOfProvider,
      paymentTerms: finalPaymentTerms,
    };

    onSave(providerToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{providerToEdit ? 'Editar Proveedor' : 'Añadir Proveedor'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
            <input
              type="text"
              id="companyName"
              {...register('companyName', { required: 'El nombre es obligatorio' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Personas de Contacto</label>
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md space-y-2 relative">
                <input {...register(`contacts.${index}.name`, { required: 'El nombre es requerido' })} placeholder="Nombre" className="w-full border-gray-200 rounded-md p-2" />
                {errors.contacts?.[index]?.name && <p className="text-red-500 text-sm">{errors.contacts[index]?.name?.message}</p>}
                
                <input {...register(`contacts.${index}.email`)} placeholder="Email" className="w-full border-gray-200 rounded-md p-2" />
                
                <input {...register(`contacts.${index}.phone`, { required: 'El teléfono es requerido' })} placeholder="Teléfono" className="w-full border-gray-200 rounded-md p-2" />
                {errors.contacts?.[index]?.phone && <p className="text-red-500 text-sm">{errors.contacts[index]?.phone?.message}</p>}

                <input {...register(`contacts.${index}.whatsapp`)} placeholder="WhatsApp (Opcional)" className="w-full border-gray-200 rounded-md p-2" />

                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => append(createEmptyContact())} className="flex items-center text-blue-500 hover:text-blue-700">
              <PlusCircle size={16} className="mr-1" /> Añadir otro contacto
            </button>
          </div>

          <div className="space-y-2">
            <label className="block font-medium">Tipos de Productos</label>
            <div className="flex items-center">
              <input type="checkbox" {...register('productTypes.insumos')} id="insumos" className="mr-2" />
              <label htmlFor="insumos">Insumos</label>
            </div>
            <div className="ml-4 space-y-2">
              <label className="block font-medium">Repuestos:</label>
              <div className="flex items-center">
                <input type="checkbox" {...register('productTypes.repuestos.original')} id="repuestos_original" className="mr-2" />
                <label htmlFor="repuestos_original">Original</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" {...register('productTypes.repuestos.alternativo')} id="repuestos_alternativo" className="mr-2" />
                <label htmlFor="repuestos_alternativo">Alternativo</label>
              </div>
            </div>
          </div>

          <div>
            <div className="space-y-2">
              <label className="font-medium">Condiciones de Pago</label>
              <Controller
                name="paymentTerms.type"
                control={control}
                render={({ field }) => (
                  <select {...field} className="w-full border-gray-200 rounded-md p-2">
                    <option value="contado">Contado</option>
                    <option value="credito">Crédito</option>
                  </select>
                )}
              />
            </div>

            {paymentType === 'credito' && (
              <div className="mt-4 space-y-4 p-4 border rounded-md">
                <div>
                  <label htmlFor="paymentTerms.days" className="font-medium">Días de Crédito</label>
                  <input 
                    id="paymentTerms.days"
                    type="number" 
                    {...register('paymentTerms.days', { valueAsNumber: true, required: 'Los días son requeridos', min: { value: 1, message: 'Debe ser al menos 1 día' } })} 
                    className="w-full border-gray-200 rounded-md p-2"
                    placeholder="Ej: 30"
                  />
                  {errors.paymentTerms?.days && <p className="text-red-500 text-sm">{errors.paymentTerms.days.message}</p>}
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="hasDownPayment"
                    {...register('paymentTerms.hasDownPayment')} 
                  />
                  <label htmlFor="hasDownPayment">¿Tiene pago inicial (pie)?</label>
                </div>

                {hasDownPayment && (
                  <div>
                    <label htmlFor="paymentTerms.downPaymentPercentage">Porcentaje del Pie (%)</label>
                    <input 
                      id="paymentTerms.downPaymentPercentage"
                      type="number"
                      {...register('paymentTerms.downPaymentPercentage', { 
                        valueAsNumber: true, 
                        required: 'El porcentaje es requerido',
                        min: { value: 1, message: 'Debe ser mayor a 0' },
                        max: { value: 99, message: 'Debe ser menor a 100' }
                      })}
                      className="w-full border-gray-200 rounded-md p-2 mt-1"
                      placeholder="Ej: 20"
                    />
                    {errors.paymentTerms?.downPaymentPercentage && <p className="text-red-500 text-sm">{errors.paymentTerms.downPaymentPercentage.message}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
              Guardar Proveedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
