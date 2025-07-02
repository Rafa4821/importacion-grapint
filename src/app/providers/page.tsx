'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, Skeleton } from '@mui/material';
import { AddCircle } from '@mui/icons-material';
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestión de Proveedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddCircle />}
          onClick={() => setIsModalOpen(true)}
        >
          Añadir Proveedor
        </Button>
      </Box>

      <Box sx={{ mt: 4 }}>
        {isLoading ? (
          <Skeleton variant="rectangular" width="100%" height={300} />
        ) : (
          <ProvidersTable providers={providers} onEdit={handleEditProvider} onDelete={handleDeleteProvider} />
        )}
      </Box>

      {isModalOpen && (
        <AddProviderModal 
          providerToEdit={editingProvider}
          onClose={handleCloseModal} 
          onSave={handleSaveProvider} 
        />
      )}
    </Container>
  );
}
