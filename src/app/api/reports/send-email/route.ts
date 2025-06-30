import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ReportEmail } from '@/components/emails/ReportEmail';
import { PlainOrder } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, reportData } = await req.json() as { email: string; reportData: PlainOrder[] };

    if (!email || !reportData) {
      return NextResponse.json({ message: 'Faltan datos para enviar el correo.' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Reportes <onboarding@resend.dev>', // Reemplaza con tu dominio verificado en Resend
      to: [email],
      subject: 'Tu Reporte de Órdenes está listo',
      react: ReportEmail({ reportData }) as React.ReactElement,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ message: 'Error al enviar el correo.', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Correo enviado con éxito.', data });

  } catch (error) {
    console.error('Server-side error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error en el servidor.';
    return NextResponse.json({ message: 'Error interno del servidor.', error: errorMessage }, { status: 500 });
  }
}
