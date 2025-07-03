import { useState } from 'react';
import { Provider, PaymentTerms, ProductTypes } from '@/types';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

interface ProvidersTableProps {
  providers: Provider[];
  onEdit: (provider: Provider) => void;
  onDelete: (providerId: string) => void;
}

export default function ProvidersTable({ providers, onEdit, onDelete }: ProvidersTableProps) {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  if (providers.length === 0) {
    return <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>No hay proveedores para mostrar.</Typography>;
  }

  const formatPaymentTerms = (paymentTerms: PaymentTerms): string => {
    if (typeof paymentTerms !== 'object' || paymentTerms === null || !('type' in paymentTerms)) {
      return 'No especificado';
    }
    if (paymentTerms.type === 'contado') return 'Contado';
    if (paymentTerms.type === 'credito') {
      let result = 'Crédito';
      if (paymentTerms.downPaymentPercentage) result = `Pie ${paymentTerms.downPaymentPercentage}%`;
      if (paymentTerms.days) {
        const remainingDays = paymentTerms.days;
        if (paymentTerms.downPaymentPercentage) result += ` + ${remainingDays} días`;
        else result += ` (${remainingDays} días)`;
      }
      return result;
    }
    return 'Condición desconocida';
  };

  const formatProductTypes = (productTypes: ProductTypes): string => {
    if (!productTypes) return 'No especificado';
    const types = [];
    if (productTypes.insumos) types.push('Insumos');
    const repuestos = [];
    if (productTypes.repuestos?.original) repuestos.push('Original');
    if (productTypes.repuestos?.alternativo) repuestos.push('Alternativo');
    if (repuestos.length > 0) types.push(`Repuestos (${repuestos.join(', ')})`);
    return types.join(', ') || 'No especificado';
  };

  const handleDeleteClick = (providerId: string) => {
    setSelectedProviderId(providerId);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedProviderId) {
      onDelete(selectedProviderId);
    }
    setOpenDeleteDialog(false);
    setSelectedProviderId(null);
  };

  return (
    <>
      <Box sx={{ overflowX: 'auto' }}>
      <TableContainer component={Paper} elevation={3} sx={{ minWidth: 800 }}>
        <Table sx={{ minWidth: 650 }} aria-label="tabla de proveedores">
          <TableHead sx={{ bgcolor: 'background.paper' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Nombre Empresa</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Contacto Principal</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Condiciones de Pago</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Tipos de Producto</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', textAlign: 'center' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {providers.map((provider) => (
              <TableRow key={provider.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                <TableCell>{provider.companyName}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{provider.contacts[0]?.name || 'N/A'}</Typography>
                    <Typography variant="caption" color="text.secondary">{provider.contacts[0]?.email || ''}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{formatPaymentTerms(provider.paymentTerms)}</TableCell>
                <TableCell>{formatProductTypes(provider.productTypes)}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <IconButton onClick={() => onEdit(provider)} color="primary" aria-label={`editar ${provider.companyName}`}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteClick(provider.id)} color="error" aria-label={`eliminar ${provider.companyName}`}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que quieres eliminar este proveedor? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
