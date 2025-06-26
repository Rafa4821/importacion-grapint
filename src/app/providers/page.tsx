'use client';

import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import AddProviderModal from '@/components/providers/AddProviderModal';
import { Provider } from '@/types';
import { getProviders, addProvider, updateProvider, deleteProvider } from '@/services/providerService';
import toast from 'react-hot-toast';
import ProvidersTable from '@/components/providers/ProvidersTable';

export default function ProvidersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const providersData = await getProviders();
      setProviders(providersData);
    } catch {
      toast.error('Error al cargar los proveedores.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSaveProvider = async (data: Omit<Provider, 'id'>) => {
    const promise = editingProvider
      ? updateProvider(editingProvider.id, data)
      : addProvider(data);

    toast.promise(promise, {
      loading: editingProvider ? 'Actualizando proveedor...' : 'Guardando proveedor...',
      success: editingProvider ? '¡Proveedor actualizado!' : '¡Proveedor guardado!',
      error: editingProvider ? 'Error al actualizar.' : 'Error al guardar.',
    });

    try {
      await promise;
      setEditingProvider(null);
      fetchProviders(); // Re-fetch providers to update the table
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingProvider(null);
    setIsModalOpen(false);
  };

  const handleDeleteProvider = async (providerId: string) => {
    const promise = deleteProvider(providerId);

    toast.promise(promise, {
      loading: 'Eliminando proveedor...',
      success: '¡Proveedor eliminado exitosamente!',
      error: 'Error al eliminar el proveedor.',
    });

    try {
      await promise;
      fetchProviders(); // Re-fetch to update the table
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Proveedores</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Añadir Proveedor
        </button>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <p>Cargando proveedores...</p>
        ) : (
          <ProvidersTable providers={providers} onEdit={handleEditProvider} onDelete={handleDeleteProvider} />
        )}
      </div>

      {isModalOpen && (
        <AddProviderModal 
          providerToEdit={editingProvider}
          onClose={handleCloseModal} 
          onSave={handleSaveProvider} 
        />
      )}
    </div>
  );
}
