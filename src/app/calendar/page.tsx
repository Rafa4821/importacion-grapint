'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { es } from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';


import { getOrders } from '@/services/orderService';
import { OrderEventModal, EventInfo } from '@/components/calendar/OrderEventModal';
import { CalendarToolbar } from '@/components/calendar/CalendarToolbar';

// Configuración del localizador para date-fns en español
const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }), // Lunes como inicio de semana
  getDay,
  locales,
});

// Definimos el tipo para los eventos del calendario
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  resource: EventInfo; // Datos adicionales para el modal
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);

  // Estado para controlar la navegación y la vista del calendario
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>('month');

  useEffect(() => {
    const fetchAndProcessOrders = async () => {
      try {
        setLoading(true);
        const orders = await getOrders();
        const calendarEvents = orders.flatMap(order =>
          order.installments.map(inst => {
            const dueDate = inst.dueDate.toDate();
            return {
              title: `${order.providerName} - ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: order.currency }).format(inst.amount)}`,
              start: dueDate,
              end: dueDate,
              resource: {
                orderId: order.id,
                title: `Vencimiento Pedido #${order.orderNumber}`,
                providerName: order.providerName,
                dueDate: dueDate.toLocaleDateString('es-CL'),
                amount: inst.amount,
                currency: order.currency,
                status: inst.status,
              },
            };
          })
        );
        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error fetching orders for calendar:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessOrders();
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event.resource);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const backgroundColor = event.resource.status === 'pagado' ? 'rgba(40, 167, 69, 0.8)' : 'rgba(220, 53, 69, 0.8)';
    const style = {
      backgroundColor,
      borderRadius: '5px',
      color: 'white',
      border: '0px',
      display: 'block',
      padding: '2px 5px',
    };
    return { style };
  }, []);

  const components = useMemo(() => ({ 
    toolbar: CalendarToolbar 
  }), []);

  if (loading) {
    return <div className="text-center p-10">Cargando calendario...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-4 rounded-lg shadow" style={{ height: '85vh' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture='es'
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
          }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
          date={date}
          view={view}
          onNavigate={setDate}
          onView={setView}
          components={components}
        />
      </div>

      <OrderEventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        eventInfo={selectedEvent}
      />
    </div>
  );
}


