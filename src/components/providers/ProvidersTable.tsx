import { Provider, PaymentTerms, ProductTypes } from '@/types';

import { Trash2, Edit } from 'lucide-react';

interface ProvidersTableProps {
  providers: Provider[];
  onEdit: (provider: Provider) => void;
  onDelete: (providerId: string) => void;
}

export default function ProvidersTable({ providers, onEdit, onDelete }: ProvidersTableProps) {
  if (providers.length === 0) {
    return <p className="text-center text-gray-500">No hay proveedores para mostrar.</p>;
  }

  const formatPaymentTerms = (paymentTerms: PaymentTerms): string => {
    // Defensive check for malformed data from Firestore
    if (typeof paymentTerms !== 'object' || paymentTerms === null || !('type' in paymentTerms)) {
      return 'No especificado';
    }

    if (paymentTerms.type === 'contado') {
      return 'Contado';
    }

    if (paymentTerms.type === 'credito') {
      let result = 'Crédito';
      if (paymentTerms.downPaymentPercentage) {
        result = `Pie ${paymentTerms.downPaymentPercentage}%`;
      }
      if (paymentTerms.days) {
        const remainingDays = paymentTerms.days;
        if (paymentTerms.downPaymentPercentage) {
          result += ` + ${remainingDays} días`;
        } else {
          result += ` (${remainingDays} días)`;
        }
      }
      return result;
    }

        return 'Condición desconocida'; // Fallback return
  };

  const formatProductTypes = (productTypes: ProductTypes): string => {
    if (!productTypes) return 'No especificado';

    const types = [];
    if (productTypes.insumos) types.push('Insumos');
    
    const repuestos = [];
    if (productTypes.repuestos?.original) repuestos.push('Original');
    if (productTypes.repuestos?.alternativo) repuestos.push('Alternativo');

    if (repuestos.length > 0) {
      types.push(`Repuestos (${repuestos.join(', ')})`);
    }

    return types.join(', ') || 'No especificado';
  };

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border-b text-left">Nombre Empresa</th>
              <th className="py-2 px-4 border-b text-left">Contacto Principal</th>
              <th className="py-2 px-4 border-b text-left">Condiciones de Pago</th>
              <th className="py-2 px-4 border-b text-left">Tipos de Producto</th>
              <th className="py-2 px-4 border-b text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{provider.companyName}</td>
                <td className="py-2 px-4 border-b">
                  {provider.contacts[0]?.name || 'N/A'}
                  <br />
                  <span className="text-sm text-gray-500">{provider.contacts[0]?.email || ''}</span>
                </td>
                <td className="py-2 px-4 border-b">{formatPaymentTerms(provider.paymentTerms)}</td>
                <td className="py-2 px-4 border-b">{formatProductTypes(provider.productTypes)}</td>
                <td className="py-2 px-4 border-b">
                  <button onClick={() => onEdit(provider)} className="text-blue-500 hover:text-blue-700 mr-2"><Edit size={20} /></button>
                  <button onClick={() => { if (window.confirm(`¿Estás seguro de que quieres eliminar a ${provider.companyName}?`)) { onDelete(provider.id); } }} className="text-red-500 hover:text-red-700"><Trash2 size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold">{provider.companyName}</h3>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button onClick={() => onEdit(provider)} className="text-blue-500 hover:text-blue-700"><Edit size={20} /></button>
                <button onClick={() => { if (window.confirm(`¿Estás seguro de que quieres eliminar a ${provider.companyName}?`)) { onDelete(provider.id); } }} className="text-red-500 hover:text-red-700"><Trash2 size={20} /></button>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Contacto Principal</p>
                <p className="font-semibold">{provider.contacts[0]?.name || 'N/A'}</p>
                <p className="text-gray-500">{provider.contacts[0]?.email || ''}</p>
              </div>
              <div>
                <p className="text-gray-500">Condiciones de Pago</p>
                <p className="font-semibold">{formatPaymentTerms(provider.paymentTerms)}</p>
              </div>
              <div>
                <p className="text-gray-500">Tipos de Producto</p>
                <p className="font-semibold">{formatProductTypes(provider.productTypes)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
