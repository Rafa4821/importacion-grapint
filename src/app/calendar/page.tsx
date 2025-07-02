'use client';

import moment from 'moment';
import 'moment/locale/es';
import { useCallback, useEffect, useState } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { CalendarToolbar } from '@/components/calendar/CalendarToolbar';
import { OrderEventModal } from '@/components/calendar/OrderEventModal';
import { getOrders } from '@/services/orderService';
import { Order, PaymentInstallment } from '@/types';
import { EventInfo } from '@/components/calendar/OrderEventModal';
import { Box, Paper, Tooltip, Typography, useTheme } from '@mui/material';

// Tipos para los feriados
interface Holiday {
  date: string;
  localName: string;
  name: string;
  countryCode: 'CL' | 'US';
}

// Tipo para los eventos del calendario
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    order: Order;
    installment: PaymentInstallment;
  };
}

// Configuración en español para react-big-calendar
const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango.',
  showMore: (total: number) => `+ Ver más (${total})`,
};

moment.locale('es');
const localizer = momentLocalizer(moment);

export default function CalendarPage() {
  const theme = useTheme();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const orders: Order[] = await getOrders();
      const calendarEvents: CalendarEvent[] = orders.flatMap(order =>
        order.installments.map(installment => ({
          title: `${order.providerName} - Cuota`,
          start: installment.dueDate.toDate(),
          end: installment.dueDate.toDate(),
          allDay: true,
          resource: { order, installment },
        }))
      );
      setEvents(calendarEvents);
    };

    const fetchHolidays = async () => {
      const year = currentDate.getFullYear();
      try {
        const response = await fetch(`/api/holidays?year=${year}`);
        if (!response.ok) throw new Error('Failed to fetch holidays');
        const data: Holiday[] = await response.json();
        setHolidays(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchOrders();
    fetchHolidays();
  }, [currentDate]);

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    const { order, installment } = event.resource;
    const eventInfo: EventInfo = {
      orderId: order.id,
      title: `Vencimiento Pedido #${order.orderNumber}`,
      providerName: order.providerName,
      dueDate: installment.dueDate.toDate().toLocaleDateString('es-CL'),
      amount: installment.amount,
      currency: order.currency,
      status: installment.status,
    };
    setSelectedEvent(eventInfo);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const isPaid = event.resource?.installment?.status === 'pagado';
    const backgroundColor = isPaid ? theme.palette.success.main : theme.palette.error.main;
    const borderColor = isPaid ? theme.palette.success.dark : theme.palette.error.dark;

    return {
      style: {
        backgroundColor,
        borderColor,
        color: theme.palette.getContrastText(backgroundColor),
      },
    };
  }, [theme]);

  const components = {
    toolbar: CalendarToolbar,
    dateHeader: ({ label, date }: { label: string; date: Date }) => {
      const holidaysForDate = holidays.filter(h => new Date(h.date).toDateString() === date.toDateString());
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', p: '2px' }}>
          <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
            {holidaysForDate.map(holiday => (
              <Tooltip key={`${holiday.countryCode}-${holiday.name}`} title={`${holiday.name} (${holiday.countryCode})`}>
                <Box
                  sx={{
                    height: 8,
                    width: 8,
                    borderRadius: '50%',
                    backgroundColor: holiday.countryCode === 'CL' ? 'error.light' : 'info.light',
                  }}
                />
              </Tooltip>
            ))}
          </Box>
          <span>{label}</span>
        </Box>
      );
    },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 2, sm: 3, lg: 4 } }}>
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ height: 12, width: 12, borderRadius: 1, bgcolor: 'success.main' }} />
          <Typography variant="caption">Cuota Pagada</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ height: 12, width: 12, borderRadius: 1, bgcolor: 'error.main' }} />
          <Typography variant="caption">Cuota Pendiente</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ height: 12, width: 12, borderRadius: '50%', bgcolor: 'error.main', border: '1px solid white' }} />
          <Typography variant="caption">Feriado (Chile)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ height: 12, width: 12, borderRadius: '50%', bgcolor: 'info.main', border: '1px solid white' }} />
          <Typography variant="caption">Feriado (EE.UU.)</Typography>
        </Box>
      </Box>
      <Paper
        elevation={2}
        sx={{
          height: '85vh', // Asignar altura explícita para evitar que se corte
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // El calendario gestionará su propio scroll si es necesario
        }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          messages={messages}
          eventPropGetter={eventPropGetter}
          onView={setView}
          view={view}
          date={currentDate}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          components={components}
          style={{ height: '100%' }}
        />
      </Paper>
      {selectedEvent && (
        <OrderEventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          eventInfo={selectedEvent}
        />
      )}
    </Box>
  );
}
