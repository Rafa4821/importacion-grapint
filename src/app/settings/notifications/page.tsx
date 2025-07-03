'use client';

import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { NotificationContact, NotificationEvent } from '@/types';
import {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
} from '@/services/notificationContactsService';
import ContactsTable from '@/components/settings/notifications/ContactsTable';
import ContactModal from '@/components/settings/notifications/ContactModal';
import toast from 'react-hot-toast';
import { generateNotificationContentForEvent } from '@/services/notificationTemplatingService';

export default function NotificationSettingsPage() {
  const [contacts, setContacts] = useState<NotificationContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<NotificationContact | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedContacts = await getContacts();
      setContacts(fetchedContacts);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar los contactos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleOpenModal = (contact: NotificationContact | null = null) => {
    setContactToEdit(contact);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setContactToEdit(null);
    setIsModalOpen(false);
  };

  const handleSaveContact = async (data: Omit<NotificationContact, 'id'>) => {
    try {
      if (contactToEdit) {
        await updateContact(contactToEdit.id, data);
        toast.success('Contacto actualizado con éxito.');
      } else {
        await addContact(data);
        toast.success('Contacto añadido con éxito.');
      }
      fetchContacts(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar el contacto.');
    }
  };

  const handleTestContact = (contact: NotificationContact) => {
    toast.loading('Ejecutando prueba...', { duration: 1000 });

    setTimeout(() => {
      const { name, email, settings } = contact;
      let testFired = false;

      if (!settings) {
        toast.error(`El contacto ${name} no tiene configuraciones de notificación.`);
        return;
      }

      for (const [event, channels] of Object.entries(settings)) {
        for (const [channel, isEnabled] of Object.entries(channels)) {
          if (isEnabled) {
            testFired = true;
            const { subject, body } = generateNotificationContentForEvent(event as NotificationEvent, {
              order: { orderNumber: 'PED-TEST-01', providerName: 'Proveedor de Prueba', currency: 'USD' },
              installment: { amount: 500.00, dueDate: Timestamp.fromDate(new Date()) },
            });

            if (channel === 'email') {
              // Enviar email real
              toast.promise(
                fetch('/api/notifications/test', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ to: email, subject, body }),
                }).then((res) => {
                  if (!res.ok) throw new Error('Falló el envío del email.');
                  return res.json();
                }),
                {
                  loading: `Enviando email de prueba a ${email}...`,
                  success: '¡Email de prueba enviado con éxito!',
                  error: 'Error al enviar el email de prueba.',
                }
              );
            } else {
              // Simulación para otros canales (inApp, push)
              const channelText = { inApp: 'EN LA APP', push: 'PUSH' }[channel] || channel.toUpperCase();
              toast.custom(
                (t) => (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      borderRadius: 1,
                      boxShadow: 3,
                      opacity: t.visible ? 1 : 0,
                      transition: 'opacity 300ms',
                      maxWidth: 400,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Prueba Canal: [{channelText}]
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <span style={{ fontWeight: 'bold' }}>Asunto:</span> {subject}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      <span style={{ fontWeight: 'bold' }}>Cuerpo:</span> {body}
                    </Typography>
                  </Box>
                ),
                { duration: 5000 }
              );
            }
          }
        }
      }

      if (!testFired) {
        toast.success(`El contacto ${name} no tiene ninguna notificación activa para probar.`);
      }
    }, 1200);
  };

  const handleDeleteContact = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
      try {
        await deleteContact(id);
        toast.success('Contacto eliminado con éxito.');
        fetchContacts(); // Refresh list
      } catch (error) {
        console.error(error);
        toast.error('Error al eliminar el contacto.');
      }
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, lg: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestión de Notificaciones
          </Typography>
          <Typography color="text.secondary">
            Añade o edita los contactos que recibirán alertas del sistema.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
        >
          Añadir Contacto
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ContactsTable
          contacts={contacts}
          onEdit={handleOpenModal}
          onDelete={handleDeleteContact}
          onTest={handleTestContact} // Pasar la nueva función
        />
      )}

      <ContactModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveContact}
        contactToEdit={contactToEdit}
      />
    </Box>
  );
}
