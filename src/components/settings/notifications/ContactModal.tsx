'use client';

import { NotificationContact } from '@/types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import NotificationSettingsMatrix from './NotificationSettingsMatrix';
import { getDefaultNotificationSettings } from '@/services/notificationContactsService';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (contact: Omit<NotificationContact, 'id'>) => void;
  contactToEdit?: NotificationContact | null;
}

// This is the shape of our form
type ContactFormValues = Omit<NotificationContact, 'id'>;

// Define the schema for a single notification channel (email, inApp, push)
const notificationChannelSchema = yup.object().shape({
  email: yup.boolean().required(),
  inApp: yup.boolean().required(),
  push: yup.boolean().required(),
});

// Define the main schema for the entire contact form
const schema: yup.ObjectSchema<ContactFormValues> = yup.object().shape({
  name: yup.string().required('El nombre es obligatorio'),
  email: yup.string().email('Debe ser un email válido').required('El email es obligatorio'),
  settings: yup.object().shape({
    'Vencimiento de cuota': notificationChannelSchema.required(),
    'Cuota vencida': notificationChannelSchema.required(),
    'Cambio de estado del pedido': notificationChannelSchema.required(),
    'Documento nuevo': notificationChannelSchema.required(),
    'Gasto nuevo': notificationChannelSchema.required(),
  }).required(),
});

export default function ContactModal({ open, onClose, onSave, contactToEdit }: ContactModalProps) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ContactFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      settings: getDefaultNotificationSettings(),
    },
  });

  React.useEffect(() => {
    if (open) {
      if (contactToEdit) {
        reset(contactToEdit);
      } else {
        reset({
          name: '',
          email: '',
          settings: getDefaultNotificationSettings(),
        });
      }
    }
  }, [contactToEdit, open, reset]);

  const onSubmit = (data: ContactFormValues) => {
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{contactToEdit ? 'Editar Contacto' : 'Añadir Nuevo Contacto'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <TextField
            {...control.register('name')}
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            variant="outlined"
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            {...control.register('email')}
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <NotificationSettingsMatrix control={control} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">Guardar</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}


