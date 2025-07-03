import { Resend } from 'resend';
import { NotificationTestEmail } from '@/components/emails/NotificationTestEmail'; // Usamos la misma plantilla de prueba por ahora

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail({ to, subject, body }: EmailParams) {
  const { data, error } = await resend.emails.send({
    from: 'Sistema Grapint <onboarding@resend.dev>', // Reemplazar con tu dominio verificado
    to: [to],
    subject: subject,
    react: NotificationTestEmail({ subject, body }) as React.ReactElement,
  });

  if (error) {
    console.error('Error sending email via Resend:', error);
    throw new Error('Failed to send email.');
  }

  return data;
}
