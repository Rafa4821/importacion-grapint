'use client';

import { useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { Order, Provider, OrderStatus, OrderFormData } from '@/types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  IconButton,
  Box,
} from '@mui/material';
import { Close } from '@mui/icons-material';

// The data structure for our form internally, using Date objects
type ModalFormData = Omit<Order, 'id' | 'installments' | 'providerName' | 'createdAt' | 'updatedAt' | 'isPaid' | 'orderDate' | 'invoiceDate'> & {
  orderDate: Date;
  invoiceDate?: Date;
};

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OrderFormData) => Promise<void> | void;
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
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ModalFormData>({
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
    if (isOpen) {
      if (orderToEdit) {
        reset({
          ...orderToEdit,
          orderDate: orderToEdit.orderDate.toDate(),
          invoiceDate: orderToEdit.invoiceDate ? orderToEdit.invoiceDate.toDate() : undefined,
        });
      } else {
        reset({
          orderNumber: '',
          providerId: '',
          orderDate: new Date(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          totalAmount: '' as any, // Use empty string for better UX in controlled input
          currency: 'USD',
          invoiceNumber: '',
          invoiceDate: undefined,
          status: 'Gestionado',
        });
      }
    }
  }, [orderToEdit, reset, isOpen]);

  const onSubmit: SubmitHandler<ModalFormData> = (data) => {
    const orderDateObj = data.orderDate instanceof Date ? data.orderDate : new Date(data.orderDate);
    const invoiceDateObj = data.invoiceDate ? (data.invoiceDate instanceof Date ? data.invoiceDate : new Date(data.invoiceDate)) : undefined;

    const dataForSave: OrderFormData = {
      ...data,
      totalAmount: Number(data.totalAmount), // Ensure it's a number
      orderDate: orderDateObj.toISOString().split('T')[0],
      invoiceDate: invoiceDateObj ? invoiceDateObj.toISOString().split('T')[0] : undefined,
    };
    onSave(dataForSave);
    onClose();
  };

  // Helper to format date for input type="date"
  const formatDateForInput = (date: Date | undefined | string) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {orderToEdit ? 'Editar Pedido' : 'Añadir Pedido'}
        <IconButton
          aria-label="close"
          onClick={(e) => {
            (e.currentTarget as HTMLElement).blur();
            onClose();
          }}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Controller
              name="orderNumber"
              control={control}
              rules={{ required: 'El número de pedido es requerido' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Número de Pedido"
                  fullWidth
                  error={!!errors.orderNumber}
                  helperText={errors.orderNumber?.message}
                />
              )}
            />

            <FormControl fullWidth error={!!errors.providerId}>
              <InputLabel id="provider-select-label">Proveedor</InputLabel>
              <Controller
                name="providerId"
                control={control}
                rules={{ required: 'Debe seleccionar un proveedor' }}
                render={({ field }) => (
                  <Select {...field} labelId="provider-select-label" label="Proveedor">
                    <MenuItem value=""><em>Seleccione un proveedor</em></MenuItem>
                    {providers.map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.companyName}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.providerId && <FormHelperText>{errors.providerId.message}</FormHelperText>}
            </FormControl>

            <Controller
              name="orderDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Fecha del Pedido"
                  type="date"
                  fullWidth
                  value={formatDateForInput(field.value)}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />

            <Controller
              name="totalAmount"
              control={control}
              rules={{
                required: 'El monto es requerido',
                min: { value: 0.01, message: 'El monto debe ser positivo' }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Monto Total"
                  type="number"
                  fullWidth
                  error={!!errors.totalAmount}
                  helperText={errors.totalAmount?.message}
                  inputProps={{ step: "0.01" }}
                />
              )}
            />

            <FormControl fullWidth>
              <InputLabel id="currency-select-label">Moneda</InputLabel>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select {...field} labelId="currency-select-label" label="Moneda">
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="CLP">CLP</MenuItem>
                  </Select>
                )}
              />
            </FormControl>

            <Controller
              name="invoiceNumber"
              control={control}
              render={({ field }) => <TextField {...field} label="Número de Invoice" fullWidth />}
            />

            <Controller
              name="invoiceDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Fecha de Invoice"
                  type="date"
                  fullWidth
                  value={formatDateForInput(field.value)}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />

            <FormControl fullWidth error={!!errors.status}>
              <InputLabel id="status-select-label">Estado</InputLabel>
              <Controller
                name="status"
                control={control}
                rules={{ required: 'El estado es requerido' }}
                render={({ field }) => (
                  <Select {...field} labelId="status-select-label" label="Estado">
                    {orderStatuses.map(status => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={(e) => {
            (e.currentTarget as HTMLElement).blur();
            onClose();
          }}>Cancelar</Button>
          <Button type="submit" variant="contained">Guardar</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}