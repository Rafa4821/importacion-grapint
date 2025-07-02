'use client';

import Link from 'next/link';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Typography, Box, Button, Chip
} from '@mui/material';
import { Close } from '@mui/icons-material';

// Definimos el tipo para la información del evento que recibirá el modal
export interface EventInfo {
  orderId: string;
  title: string; // e.g., "Vencimiento Pedido #123"
  providerName: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: 'pendiente' | 'pagado';
}

interface OrderEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventInfo: EventInfo | null;
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount);
};

export const OrderEventModal = ({ isOpen, onClose, eventInfo }: OrderEventModalProps) => {
  if (!isOpen || !eventInfo) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="span">{eventInfo.title}</Typography>
        <IconButton onClick={onClose} aria-label="Cerrar">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography><strong>Proveedor:</strong> {eventInfo.providerName}</Typography>
          <Typography><strong>Fecha de Vencimiento:</strong> {eventInfo.dueDate}</Typography>
          <Typography><strong>Monto a Pagar:</strong> {formatCurrency(eventInfo.amount, eventInfo.currency)}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography component="strong">Estado:</Typography>
            <Chip
              label={eventInfo.status}
              color={eventInfo.status === 'pagado' ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Link href={`/orders/${eventInfo.orderId}`} passHref legacyBehavior>
          <Button component="a" variant="contained" onClick={onClose}>
            Ver Detalles del Pedido
          </Button>
        </Link>
      </DialogActions>
    </Dialog>
  );
};
