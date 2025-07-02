'use client';

import React, { useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Paper,
  Typography,
} from '@mui/material';

// Esta interfaz debe coincidir con la definida en la API
interface NotificationPreferences {
  alerts: {
    paymentDueSoon: { push: boolean; email: boolean; daysBefore: number };
    paymentOverdue: { push: boolean; email: boolean };
    orderStatusChanged: { push: boolean; email: boolean };
  };
}

const NotificationSettings = () => {
  const { control, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<NotificationPreferences>({
    defaultValues: {
      alerts: {
        paymentDueSoon: { push: false, email: false, daysBefore: 3 },
        paymentOverdue: { push: true, email: true },
        orderStatusChanged: { push: false, email: false },
      },
    },
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences');
        if (!response.ok) throw new Error('Failed to fetch preferences');
        const data: NotificationPreferences = await response.json();
        reset(data); // Cargar los datos en el formulario
      } catch (error) {
        console.error(error);
        toast.error('Error al cargar la configuración.');
      }
    };
    fetchPreferences();
  }, [reset]);

  const onSubmit: SubmitHandler<NotificationPreferences> = async (data) => {
    const promise = fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async (response) => {
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Error al guardar');
      }
      return response.json();
    });

    toast.promise(promise, {
      loading: 'Guardando preferencias...',
      success: (result) => {
        reset(result.updatedPrefs, { keepDirty: false });
        return '¡Preferencias guardadas con éxito!';
      },
      error: (err) => `Error: ${err.message}`,
    });
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Preferencias de Alertas
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Elige qué notificaciones quieres recibir y por qué canal.
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">Cuotas próximas a vencer</FormLabel>
            <FormGroup row>
              <Controller
                name="alerts.paymentDueSoon.push"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Notificación Push"
                  />
                )}
              />
              <Controller
                name="alerts.paymentDueSoon.email"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Email"
                  />
                )}
              />
            </FormGroup>
          </FormControl>

          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">Cuotas vencidas</FormLabel>
            <FormGroup row>
               <FormControlLabel
                  control={<Checkbox checked disabled />}
                  label="Notificación Push (Obligatoria)"
                />
                <FormControlLabel
                  control={<Checkbox checked disabled />}
                  label="Email (Obligatorio)"
                />
            </FormGroup>
          </FormControl>

          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">Actualización en el estado de un pedido</FormLabel>
            <FormGroup row>
              <Controller
                name="alerts.orderStatusChanged.push"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Notificación Push"
                  />
                )}
              />
              <Controller
                name="alerts.orderStatusChanged.email"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Email"
                  />
                )}
              />
            </FormGroup>
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
            <Button type="submit" variant="contained" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Guardar Preferencias'}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default NotificationSettings;
