'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Order } from '@/types';
import { getOrderById } from '@/services/orderService';
import {
  Container,
  Paper,
  Typography,
  Box,

  Chip,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const formatDate = (timestamp: { toDate: () => Date }) => {
  if (!timestamp || !timestamp.toDate) return 'N/A';
  return new Date(timestamp.toDate()).toLocaleDateString('es-CL');
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount);
};

export default function OrderDetailPage() {
    const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          setLoading(true);
          const fetchedOrder = await getOrderById(orderId);
          if (fetchedOrder) {
            setOrder(fetchedOrder);
          } else {
            setError('El pedido no fue encontrado.');
          }
        } catch (err) {
          setError('Error al cargar el pedido.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">No se encontró el pedido.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box mb={4}>
        <Link href="/orders" passHref>
          <Button startIcon={<ArrowBack />}>
            Volver a la lista de pedidos
          </Button>
        </Link>
      </Box>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Pedido #{order.orderNumber}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Proveedor: {order.providerName}
            </Typography>
          </Box>
          <Chip
            label={order.isPaid ? 'Pagado' : 'Pendiente'}
            color={order.isPaid ? 'success' : 'warning'}
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: { md: 'flex' }, gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Información General
            </Typography>
            <List disablePadding>
              <ListItem disableGutters>
                <ListItemText primary="Fecha del Pedido" secondary={formatDate(order.orderDate)} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary="Monto Total" secondary={formatCurrency(order.totalAmount, order.currency)} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary="Estado Actual" secondary={order.status} />
              </ListItem>
              {order.invoiceNumber && (
                <ListItem disableGutters>
                  <ListItemText primary="Nº Factura" secondary={order.invoiceNumber} />
                </ListItem>
              )}
              {order.invoiceDate && (
                <ListItem disableGutters>
                  <ListItemText primary="Fecha Factura" secondary={formatDate(order.invoiceDate)} />
                </ListItem>
              )}
            </List>
          </Box>

          <Box sx={{ width: '100%', mt: { xs: 4, md: 0 } }}>
            <Typography variant="h6" gutterBottom>
              Cuotas de Pago
            </Typography>
            {order.installments.length > 0 ? (
              <Stack spacing={2} mt={2}>
                {order.installments.map((inst, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1">
                        {formatCurrency(inst.amount, order.currency)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Vence: {formatDate(inst.dueDate)}
                      </Typography>
                    </Box>
                    <Chip
                      label={inst.status}
                      color={inst.status === 'pagado' ? 'success' : 'error'}
                      size="small"
                    />
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" mt={2}>
                No hay cuotas definidas.
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
