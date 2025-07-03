import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from '@react-email/components';

interface NotificationTestEmailProps {
  subject: string;
  body: string;
}

export const NotificationTestEmail: React.FC<NotificationTestEmailProps> = ({ subject, body }) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Prueba de Notificación del Sistema</Heading>
        <Text style={paragraph}>
          Hola,
          <br />
          Has recibido esta notificación como parte de una prueba desde el panel de administración.
        </Text>
        <Text style={paragraph}>A continuación, el contenido que se habría generado:</Text>
        <Hr style={hr} />
        <Text style={callout}>
          <strong>Asunto:</strong> {subject}
        </Text>
        <Text style={callout}>
          <strong>Cuerpo:</strong> {body}
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Este es un correo de prueba y no requiere ninguna acción.
        </Text>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  marginTop: '48px',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 40px',
};

const callout = {
  ...paragraph,
  padding: '20px 40px',
  backgroundColor: '#f2f9fc',
  borderLeft: '4px solid #007bff',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};
