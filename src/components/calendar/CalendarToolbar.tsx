'use client';

import { Navigate, View } from 'react-big-calendar';
import { Box, Button, ButtonGroup, IconButton, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

// Tipos para las props que recibe la barra de herramientas de react-big-calendar
type NavigateAction = (typeof Navigate)[keyof typeof Navigate];

interface CustomToolbarProps {
  label: string;
  view: View;
  onNavigate: (navigate: NavigateAction) => void;
  onView: (view: View) => void;
}

// El componente de la barra de herramientas personalizada
export const CalendarToolbar = ({ label, onNavigate, onView, view }: CustomToolbarProps) => {
  const viewNames: { [key in View]?: string } = {
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        mb: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
      }}
    >
      {/* Grupo de Navegación */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
        <IconButton onClick={() => onNavigate(Navigate.PREVIOUS)} aria-label="Anterior">
          <ChevronLeft />
        </IconButton>
        <Button variant="outlined" onClick={() => onNavigate(Navigate.TODAY)} sx={{ mx: 1 }}>
          Hoy
        </Button>
        <IconButton onClick={() => onNavigate(Navigate.NEXT)} aria-label="Siguiente">
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Etiqueta de Fecha (Mes y Año) */}
      <Typography variant="h6" sx={{ order: { xs: -1, md: 0 }, mb: { xs: 2, md: 0 } }}>
        {label}
      </Typography>

      {/* Grupo de Vistas */}
      <ButtonGroup variant="outlined" aria-label="Vistas del calendario">
        {(['month', 'week', 'day', 'agenda'] as View[]).map(viewName => (
          <Button
            key={viewName}
            onClick={() => onView(viewName)}
            variant={view === viewName ? 'contained' : 'outlined'}
          >
            {viewNames[viewName]}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
};
