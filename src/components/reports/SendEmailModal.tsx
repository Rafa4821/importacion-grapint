'use client';

import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: string) => void;
}

interface FormData {
  email: string;
}

export default function SendEmailModal({ isOpen, onClose, onSend }: SendEmailModalProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    onSend(data.email);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Enviar Reporte por Correo
        <IconButton
          aria-label="close"
          onClick={onClose}
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
        <DialogContent dividers sx={{ pt: 2 }}>
          <Controller
            name="email"
            control={control}
            defaultValue=""
            rules={{
              required: 'El correo es requerido',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Dirección de correo inválida',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                autoFocus
                margin="dense"
                label="Correo Electrónico del Destinatario"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">Enviar</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
