import { Order, PaymentInstallment } from '@/types';
import { Timestamp } from 'firebase/firestore';

export type Criticidad = 'vencido' | 'critico' | 'pronto' | 'normal' | 'sin-vencimiento';

export interface VencimientoInfo {
  fecha: Date | null;
  criticidad: Criticidad;
}

export const getProximoVencimiento = (order: Order): { fecha: Date | null; criticidad: Criticidad } => {
  if (!order.installments || order.installments.length === 0) {
    return { fecha: null, criticidad: 'sin-vencimiento' };
  }

  const ahora = new Date();

  const pendingInstallments = order.installments
    .filter(inst => inst.status === 'pendiente')
    .map(inst => {
      // Ensure dueDate is a JS Date object for reliable comparison. Handle both Timestamp and string/number formats.
      const jsDueDate = inst.dueDate instanceof Timestamp 
        ? inst.dueDate.toDate() 
        : new Date(inst.dueDate as any);
      return { ...inst, jsDueDate };
    })
    .sort((a, b) => a.jsDueDate.getTime() - b.jsDueDate.getTime());

  if (pendingInstallments.length === 0) {
    return { fecha: null, criticidad: 'sin-vencimiento' };
  }

  const nextInstallment = pendingInstallments[0];
  const fechaVencimiento = nextInstallment.jsDueDate;
  const diffDias = (fechaVencimiento.getTime() - ahora.getTime()) / (1000 * 3600 * 24);

  let criticidad: Criticidad = 'normal';
  if (diffDias < 0) {
    criticidad = 'vencido';
  } else if (diffDias <= 3) {
    criticidad = 'critico';
  } else if (diffDias <= 7) {
    criticidad = 'pronto';
  }

  return { fecha: fechaVencimiento, criticidad };
};
