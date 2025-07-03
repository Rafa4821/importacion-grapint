/**
 * Generates a subject and body for a notification based on the event type and payload.
 * @param event The notification event key.
 * @param payload The data related to the event (e.g., order, installment details).
 * @returns An object with subject and body for the notification.
 */
import { NotificationEvent, NotificationPayload } from '@/types';

export function generateNotificationContentForEvent(
  event: NotificationEvent,
  payload: NotificationPayload
): { subject: string; body: string } {
  // Default values for safety
  const orderNumber = payload.order?.orderNumber || 'N/A';
  const providerName = payload.order?.providerName || 'N/A';
  const amount = payload.installment?.amount || '0.00';
  const currency = payload.order?.currency || 'USD';
  const dueDate = payload.installment?.dueDate
    ? payload.installment.dueDate.toDate().toLocaleDateString('es-CL')
    : 'N/A';

  switch (event) {
    case 'Vencimiento de cuota':
      return {
        subject: `Aviso de Vencimiento: Pedido #${orderNumber}`,
        body: `La cuota de ${amount} ${currency} para el proveedor ${providerName} está próxima a vencer el ${dueDate}.`,
      };
    case 'Cuota vencida':
      return {
        subject: `Alerta de Vencimiento: Pedido #${orderNumber}`,
        body: `La cuota de ${amount} ${currency} para el proveedor ${providerName} ha vencido. Por favor, regularice el pago.`,
      };
    case 'Cambio de estado del pedido':
      const status = payload.order?.status || 'desconocido';
      return {
        subject: `Actualización de Pedido: #${orderNumber}`,
        body: `El estado de tu pedido con ${providerName} ha cambiado a: ${status}.`,
      };
    case 'Documento nuevo':
      const documentType = payload.document?.type || 'documento';
      return {
        subject: `Nuevo Documento en Pedido #${orderNumber}`,
        body: `Se ha añadido un nuevo documento (${documentType}) a tu pedido de ${providerName}.`,
      };
    case 'Gasto nuevo':
      const expenseType = payload.expense?.type || 'gasto';
      const expenseAmount = payload.expense?.amount || '0.00';
      return {
        subject: `Nuevo Gasto Registrado en Pedido #${orderNumber}`,
        body: `Se ha registrado un nuevo gasto de ${expenseType} por ${expenseAmount} ${currency} en tu pedido.`,
      };
    default:
      // Fallback for any unhandled event types
      return {
        subject: 'Notificación del Sistema',
        body: 'Este es un evento de notificación no configurado.',
      };
  }
}
