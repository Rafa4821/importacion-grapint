import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { NotificationTestEmail } from '@/components/emails/NotificationTestEmail';

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Define the expected shape of the request body
interface RequestBody {
  to: string;
  subject: string;
  body: string;
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { to, subject, body } = (await req.json()) as RequestBody;

    // Basic validation
    if (!to || !subject || !body) {
      return NextResponse.json({ message: 'Faltan datos para enviar el correo de prueba.' }, { status: 400 });
    }

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Sistema de Pruebas <onboarding@resend.dev>', // This should be a verified domain in Resend
      to: [to],
      subject: `Prueba: ${subject}`,
      react: NotificationTestEmail({ subject, body }) as React.ReactElement,
    });

    // Handle potential errors from Resend
    if (error) {
      console.error('Error sending test email via Resend:', error);
      return NextResponse.json({ message: 'Error al enviar el correo de prueba.', error: error.message }, { status: 500 });
    }

    // Return a success response
    return NextResponse.json({ message: 'Correo de prueba enviado con éxito.', data });

  } catch (error) {
    console.error('Server-side error in test email API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error en el servidor.';
    return NextResponse.json({ message: 'Error interno del servidor.', error: errorMessage }, { status: 500 });
  }
}
