'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { Provider, ProductTypes, PaymentTerms, ContactPerson } from '@/types';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Checkbox, FormControlLabel, Select, MenuItem, Button, Typography, Paper, Box, FormControl, InputLabel, IconButton
} from '@mui/material';
import { Close, AddCircle, Delete } from '@mui/icons-material';

interface AddProviderModalProps {
  providerToEdit?: Provider | null;
  onClose: () => void;
  onSave: (data: Omit<Provider, 'id'>) => void;
}

const createEmptyContact = (): ContactPerson => ({ name: '', email: '', phone: '', whatsapp: '' });

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
      reset({
        ...rest,
        paymentTerms: {
          type: paymentTerms.type,
          days: paymentTerms.type === 'credito' ? paymentTerms.days : 0,
          hasDownPayment: paymentTerms.type === 'credito' && !!paymentTerms.downPaymentPercentage,
          downPaymentPercentage: paymentTerms.type === 'credito' ? paymentTerms.downPaymentPercentage : 0,
        }
      });
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

  const { fields, append, remove } = useFieldArray({ control, name: 'contacts' });

  const onSubmit: SubmitHandler<ProviderFormData> = (data) => {
    const { paymentTerms, ...restOfProvider } = data;
    let finalPaymentTerms: PaymentTerms;
    if (paymentTerms.type === 'contado') {
      finalPaymentTerms = { type: 'contado' };
    } else {
      finalPaymentTerms = { type: 'credito', days: Number(paymentTerms.days) || 0 };
      if (paymentTerms.hasDownPayment && paymentTerms.downPaymentPercentage) {
        finalPaymentTerms.downPaymentPercentage = Number(paymentTerms.downPaymentPercentage);
      }
    }
    onSave({ ...restOfProvider, paymentTerms: finalPaymentTerms });
    onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {providerToEdit ? 'Editar Proveedor' : 'Añadir Proveedor'}
        <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Nombre de la Empresa"
              {...register('companyName', { required: 'El nombre es obligatorio' })}
              error={!!errors.companyName}
              helperText={errors.companyName?.message}
            />

            <Box>
              <Typography variant="h6" gutterBottom>Contactos</Typography>
              {fields.map((field, index) => (
                <Paper key={field.id} sx={{ p: 2, mb: 2, position: 'relative', border: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: '1 1 45%' }}><TextField fullWidth label="Nombre" {...register(`contacts.${index}.name`, { required: 'El nombre es requerido' })} error={!!errors.contacts?.[index]?.name} helperText={errors.contacts?.[index]?.name?.message} /></Box>
                    <Box sx={{ flex: '1 1 45%' }}><TextField fullWidth label="Email" type="email" {...register(`contacts.${index}.email`)} /></Box>
                    <Box sx={{ flex: '1 1 45%' }}><TextField fullWidth label="Teléfono" {...register(`contacts.${index}.phone`)} /></Box>
                    <Box sx={{ flex: '1 1 45%' }}><TextField fullWidth label="WhatsApp" {...register(`contacts.${index}.whatsapp`)} /></Box>
                  </Box>
                  {fields.length > 1 && (
                    <IconButton onClick={() => remove(index)} size="small" sx={{ position: 'absolute', top: 8, right: 8 }}><Delete /></IconButton>
                  )}
                </Paper>
              ))}
              <Button startIcon={<AddCircle />} onClick={() => append(createEmptyContact())}>Añadir Contacto</Button>
            </Box>

            <Box>
              <Typography variant="h6">Tipos de Producto</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                <FormControlLabel control={<Checkbox {...register('productTypes.insumos')} />} label="Insumos" />
                <Box>
                  <Typography>Repuestos:</Typography>
                  <FormControlLabel control={<Checkbox {...register('productTypes.repuestos.original')} />} label="Original" />
                  <FormControlLabel control={<Checkbox {...register('productTypes.repuestos.alternativo')} />} label="Alternativo" />
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography variant="h6">Condiciones de Pago</Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo de Pago</InputLabel>
                <Controller
                  name="paymentTerms.type"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Tipo de Pago">
                      <MenuItem value="contado">Contado</MenuItem>
                      <MenuItem value="credito">Crédito</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
              {paymentType === 'credito' && (
                <Paper sx={{ p: 2, mt: 2, border: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ flex: '1 1 45%' }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Días de Crédito"
                        {...register('paymentTerms.days', { required: 'Los días son requeridos', min: { value: 1, message: 'Debe ser al menos 1 día' } })}
                        error={!!errors.paymentTerms?.days}
                        helperText={errors.paymentTerms?.days?.message}
                      />
                    </Box>
                    <Box sx={{ flex: '1 1 45%' }}>
                      <FormControlLabel control={<Checkbox {...register('paymentTerms.hasDownPayment')} />} label="¿Tiene pago inicial (pie)?" />
                    </Box>
                    {hasDownPayment && (
                      <Box sx={{ width: '100%', mt: 2 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Porcentaje del Pie (%)"
                          {...register('paymentTerms.downPaymentPercentage', { required: 'El porcentaje es requerido', min: { value: 1, message: 'Debe ser mayor a 0' }, max: { value: 99, message: 'Debe ser menor a 100' } })}
                          error={!!errors.paymentTerms?.downPaymentPercentage}
                          helperText={errors.paymentTerms?.downPaymentPercentage?.message}
                        />
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="secondary">Cancelar</Button>
          <Button type="submit" variant="contained">Guardar Proveedor</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
