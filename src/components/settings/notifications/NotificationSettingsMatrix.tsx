import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Paper,
} from '@mui/material';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

// Define user-friendly labels for events and channels
const eventLabels: { [key: string]: string } = {
  'Vencimiento de cuota': 'Vencimiento de Cuota',
  'Cuota vencida': 'Cuota Vencida',
  'Cambio de estado del pedido': 'Cambio de Estado del Pedido',
  'Documento nuevo': 'Documento Nuevo',
  'Gasto nuevo': 'Gasto Nuevo',
};

const channelLabels: { [key: string]: string } = {
  email: 'Email',
  inApp: 'En la App',
  push: 'Push (Navegador)',
};

const eventKeys = Object.keys(eventLabels);
const channelKeys = Object.keys(channelLabels);

// Use a generic interface to accept any form control.
interface NotificationSettingsMatrixProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
}

const NotificationSettingsMatrix = <TFieldValues extends FieldValues>({ control }: NotificationSettingsMatrixProps<TFieldValues>) => {
  return (
    <Box sx={{ mt: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Preferencias de Notificación
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Evento</TableCell>
              {channelKeys.map((channelKey) => (
                <TableCell key={channelKey} align="center" sx={{ fontWeight: 'bold' }}>
                  {channelLabels[channelKey]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {eventKeys.map((eventKey) => (
              <TableRow key={eventKey}>
                <TableCell component="th" scope="row">
                  {eventLabels[eventKey]}
                </TableCell>
                {channelKeys.map((channelKey) => (
                  <TableCell key={channelKey} align="center">
                    <Controller
                      name={`settings.${eventKey}.${channelKey}` as Path<TFieldValues>}
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Switch
                          checked={!!value}
                          onChange={(e) => onChange(e.target.checked)}
                        />
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default NotificationSettingsMatrix;
