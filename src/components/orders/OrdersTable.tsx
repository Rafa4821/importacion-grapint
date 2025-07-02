import { useMemo, useState, MouseEvent } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Order } from '@/types';
import { getProximoVencimiento, VencimientoInfo } from '@/utils/dateUtils';
import { getMontoPendiente } from '@/utils/orderUtils';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  IconButton, Popover, Typography, Box, Button, Chip, Card, CardContent, 
  CardActions, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Link 
} from '@mui/material';
import { Edit, Delete, Close } from '@mui/icons-material';

interface OrdersTableProps {
  orders: Order[];
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onInstallmentUpdate: (orderId: string, installmentIndex: number, newStatus: 'pagado' | 'pendiente') => Promise<void>;
}

export default function OrdersTable({ orders, onEdit, onDelete, onInstallmentUpdate }: OrdersTableProps) {
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLButtonElement | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const processedOrders = useMemo(() => {
    return orders.map(order => ({
      ...order,
      vencimientoInfo: getProximoVencimiento(order),
      montoPendiente: getMontoPendiente(order),
    }));
  }, [orders]);

  if (orders.length === 0) {
    return <Typography sx={{ textAlign: 'center', p: 4 }}>No hay pedidos para mostrar.</Typography>;
  }

  const formatCurrency = (amount: number, currency: string) => new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount);
  const formatDate = (date: Timestamp | null | undefined) => date?.toDate().toLocaleDateString('es-CL') ?? 'N/A';

  const handlePopoverOpen = (event: MouseEvent<HTMLButtonElement>, order: Order) => {
    setPopoverAnchor(event.currentTarget);
    setActiveOrder(order);
  };

  const handlePopoverClose = () => {
    setPopoverAnchor(null);
    setActiveOrder(null);
  };

  const handleToggleInstallmentStatus = async (orderId: string, installmentIndex: number, currentStatus: 'pagado' | 'pendiente') => {
    const newStatus = currentStatus === 'pagado' ? 'pendiente' : 'pagado';
    try {
      await onInstallmentUpdate(orderId, installmentIndex, newStatus);
      handlePopoverClose(); // Cierra el popover después de la acción
    } catch (error) {
      console.error("Failed to update installment status", error);
    }
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = () => {
    if (orderToDelete) {
      onDelete(orderToDelete.id);
      setDeleteConfirmationOpen(false);
      setOrderToDelete(null);
    }
  };

  const criticalityColors: Record<VencimientoInfo['criticidad'], string> = {
    'vencido': 'error.main',
    'critico': 'warning.main',
    'pronto': 'info.main',
    'normal': 'success.main',
    'sin-vencimiento': 'grey.500',
  };

  const statusColors: Record<string, 'success' | 'warning' | 'default'> = {
    'Pagado': 'success',
    'Pendiente': 'warning',
  };

  const renderInstallmentsPopover = () => (
    <Popover
      open={Boolean(popoverAnchor)}
      anchorEl={popoverAnchor}
      onClose={handlePopoverClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Box sx={{ p: 2, width: 350 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Detalle de Pagos</Typography>
          <IconButton onClick={handlePopoverClose} size="small"><Close /></IconButton>
        </Box>
        <Divider sx={{ mb: 1 }}/>
        {activeOrder?.installments.map((inst, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #eee' }}>
            <Box>
              <Typography variant="body1" fontWeight="bold">{formatCurrency(inst.amount, activeOrder.currency)}</Typography>
              <Typography variant="caption" color="text.secondary">Vence: {formatDate(inst.dueDate)}</Typography>
            </Box>
            <Button 
              size="small" 
              variant="contained" 
              color={inst.status === 'pagado' ? 'inherit' : 'success'}
              onClick={() => handleToggleInstallmentStatus(activeOrder.id, index, inst.status)}
            >
              {inst.status === 'pagado' ? 'Marcar Pendiente' : 'Marcar Pagada'}
            </Button>
          </Box>
        ))}
      </Box>
    </Popover>
  );

  const renderDeleteConfirmationDialog = () => (
    <Dialog open={deleteConfirmationOpen} onClose={() => setDeleteConfirmationOpen(false)}>
      <DialogTitle>Confirmar Eliminación</DialogTitle>
      <DialogContent>
        <DialogContentText>
          ¿Estás seguro de que quieres eliminar el pedido <strong>{orderToDelete?.orderNumber}</strong>? Esta acción no se puede deshacer.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteConfirmationOpen(false)}>Cancelar</Button>
        <Button onClick={handleConfirmDelete} color="error" variant="contained">Eliminar</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Desktop Table View */}
      <Paper sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {['N° Pedido', 'Proveedor', 'Fecha', 'Monto Total', 'Monto Pendiente', 'Estado', 'Próximo Vencimiento', 'Acciones'].map(headCell => <TableCell key={headCell}>{headCell}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {processedOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell><Link component="button" variant="body2" onClick={(e) => handlePopoverOpen(e, order)}>{order.orderNumber}</Link></TableCell>
                  <TableCell>{order.providerName}</TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell>{formatCurrency(order.totalAmount, order.currency)}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{formatCurrency(order.montoPendiente, order.currency)}</TableCell>
                  <TableCell><Chip label={order.status.replace(/_/g, ' ')} color={statusColors[order.status] || 'default'} size="small" /></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: criticalityColors[order.vencimientoInfo.criticidad], mr: 1 }} />
                      <Typography variant="body2">{order.vencimientoInfo.fecha ? order.vencimientoInfo.fecha.toLocaleDateString('es-CL') : 'N/A'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => onEdit(order)} size="small"><Edit /></IconButton>
                    <IconButton onClick={() => handleDeleteClick(order)} size="small"><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Mobile Card View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Box>
          {processedOrders.map((order) => (
            <Card variant="outlined" key={order.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Pedido</Typography>
                    <Link component="button" variant="h6" onClick={(e) => handlePopoverOpen(e, order)}>{order.orderNumber}</Link>
                  </Box>
                  <CardActions sx={{ p: 0 }}>
                    <IconButton onClick={() => onEdit(order)} size="small"><Edit /></IconButton>
                    <IconButton onClick={() => handleDeleteClick(order)} size="small"><Delete /></IconButton>
                  </CardActions>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1, mx: -1 }}>
                  <Box sx={{ width: '50%', p: 1 }}><Typography variant="body2"><strong>Proveedor:</strong> {order.providerName}</Typography></Box>
                  <Box sx={{ width: '50%', p: 1 }}><Typography variant="body2"><strong>Fecha:</strong> {formatDate(order.orderDate)}</Typography></Box>
                  <Box sx={{ width: '50%', p: 1 }}><Typography variant="body2"><strong>Total:</strong> {formatCurrency(order.totalAmount, order.currency)}</Typography></Box>
                  <Box sx={{ width: '50%', p: 1 }}><Typography variant="body2" fontWeight="bold"><strong>Pendiente:</strong> {formatCurrency(order.montoPendiente, order.currency)}</Typography></Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                   <Chip label={order.status.replace(/_/g, ' ')} color={statusColors[order.status] || 'default'} size="small" />
                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: criticalityColors[order.vencimientoInfo.criticidad], mr: 1 }} />
                    <Typography variant="body2">{order.vencimientoInfo.fecha ? order.vencimientoInfo.fecha.toLocaleDateString('es-CL') : 'N/A'}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
      {renderInstallmentsPopover()}
      {renderDeleteConfirmationDialog()}
    </Box>
  );
}
