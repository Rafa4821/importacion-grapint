import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase/server'; // Asumimos una configuración de admin separada para el servidor
import { z } from 'zod';

// Esquema de validación para un solo pedido
const orderSchema = z.object({
  orderNumber: z.string().min(1, 'El número de pedido es requerido.'),
  providerName: z.string().min(1, 'El nombre del proveedor es requerido.'),
  totalAmount: z.number().positive('El monto total debe ser un número positivo.'),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser AAAA-MM-DD.'),
  status: z.enum(['PENDIENTE', 'EN_PRODUCCION', 'EN_TRANSITO', 'EN_ADUANA', 'EN_BODEGA', 'ENTREGADO']),
  installments: z.array(z.object({
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha de cuota debe ser AAAA-MM-DD.'),
    amount: z.number().positive('El monto de la cuota debe ser un número positivo.'),
    status: z.enum(['PENDIENTE', 'PAGADO']).default('PENDIENTE'),
  })),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ordersToImport = body.orders;

    if (!Array.isArray(ordersToImport) || ordersToImport.length === 0) {
      return NextResponse.json({ message: 'No se proporcionaron pedidos para importar.' }, { status: 400 });
    }

        const providersSnapshot = await db.collection('providers').get();
    const existingProviders = new Set(providersSnapshot.docs.map(doc => doc.data().name.toLowerCase()));
    const providerRefs = new Map(providersSnapshot.docs.map(doc => [doc.data().name.toLowerCase(), doc.ref]));

    const ordersSnapshot = await db.collection('orders').get();
    const existingOrderNumbers = new Set(ordersSnapshot.docs.map(doc => doc.data().orderNumber));

    const batch = db.batch();
    const errors: { index: number; message: string; orderNumber?: string }[] = [];
    let successCount = 0;

    for (const [index, order] of ordersToImport.entries()) {
      // 1. Validar con Zod
      const validationResult = orderSchema.safeParse(order);
      if (!validationResult.success) {
        errors.push({ index, message: validationResult.error.errors.map(e => e.message).join(', '), orderNumber: order.orderNumber });
        continue;
      }

      const validatedOrder = validationResult.data;

      // 2. Validaciones de negocio
      if (existingOrderNumbers.has(validatedOrder.orderNumber)) {
        errors.push({ index, message: 'El número de pedido ya existe.', orderNumber: validatedOrder.orderNumber });
        continue;
      }

      const providerNameLower = validatedOrder.providerName.toLowerCase();
      if (!existingProviders.has(providerNameLower)) {
        errors.push({ index, message: `El proveedor '${validatedOrder.providerName}' no fue encontrado.`, orderNumber: validatedOrder.orderNumber });
        continue;
      }

      // 3. Preparar datos para Firestore
      const providerRef = providerRefs.get(providerNameLower);
      const newOrderRef = db.collection('orders').doc();

      const orderData = {
        ...validatedOrder,
        provider: providerRef,
        providerName: validatedOrder.providerName, // Mantener el case original
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        issueDate: admin.firestore.Timestamp.fromDate(new Date(validatedOrder.issueDate)),
        installments: validatedOrder.installments.map(inst => ({
          ...inst,
          dueDate: admin.firestore.Timestamp.fromDate(new Date(inst.dueDate))
        }))
      };

      batch.set(newOrderRef, orderData);
      existingOrderNumbers.add(validatedOrder.orderNumber); // Prevenir duplicados en el mismo batch
      successCount++;
    }

    if (successCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      message: 'Proceso de importación finalizado.',
      successCount,
      errorCount: errors.length,
      errors: errors.map(e => `Fila ${e.index + 1} (Pedido ${e.orderNumber || 'N/A'}): ${e.message}`),
    });

  } catch (error) {
    console.error('Error en la importación masiva:', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
