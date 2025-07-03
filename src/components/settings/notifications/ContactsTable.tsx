'use client';

import { NotificationContact } from '@/types';
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ScienceIcon from '@mui/icons-material/Science'; // Icono para el botón de prueba

interface ContactsTableProps {
  contacts: NotificationContact[];
  onEdit: (contact: NotificationContact) => void;
  onDelete: (id: string) => void;
  onTest: (contact: NotificationContact) => void; // Nueva prop para la prueba
}

export default function ContactsTable({ contacts, onEdit, onDelete, onTest }: ContactsTableProps) {
  if (contacts.length === 0) {
    return (
      <Typography sx={{ mt: 4, textAlign: 'center' }} color="text.secondary">
        No hay contactos de notificación. Añade uno para empezar.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>{contact.name}</TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell align="right">
                <Tooltip title="Probar Notificaciones">
                  <IconButton onClick={() => onTest(contact)}>
                    <ScienceIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar Contacto">
                  <IconButton onClick={() => onEdit(contact)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar Contacto">
                  <IconButton onClick={() => onDelete(contact.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
