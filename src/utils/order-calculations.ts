import { Order } from '@/types';

/**
 * Calcula el monto total pendiente de un pedido sumando las cuotas no pagadas.
 * @param order El pedido para calcular.
 * @returns El monto pendiente.
 */
export const calculatePendingAmount = (order: Order): number => {
  return order.installments
    .filter(inst => inst.status === 'pendiente')
    .reduce((sum, inst) => sum + inst.amount, 0);
};

/**
 * Encuentra la fecha de vencimiento más próxima de las cuotas pendientes.
 * @param order El pedido a revisar.
 * @returns La fecha de vencimiento más próxima como objeto Date, o null si no hay cuotas pendientes.
 */
export const getNextDueDate = (order: Order): Date | null => {
  const pendingInstallments = order.installments
    .filter(inst => inst.status === 'pendiente')
    .sort((a, b) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime());

  return pendingInstallments.length > 0 ? pendingInstallments[0].dueDate.toDate() : null;
};
