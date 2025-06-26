import { Order } from '@/types';

/**
 * Calcula el monto total pendiente de pago para un pedido.
 * Suma el valor de todas las cuotas con estado 'pendiente'.
 * @param order El objeto del pedido.
 * @returns El monto total pendiente de pago.
 */
export const getMontoPendiente = (order: Order): number => {
  if (order.isPaid || !order.installments || order.installments.length === 0) {
    return 0;
  }

  const montoPendiente = order.installments.reduce((total, installment) => {
    if (installment.status === 'pendiente') {
      return total + installment.amount;
    }
    return total;
  }, 0);

  return montoPendiente;
};
