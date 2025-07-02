'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { es } from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Holiday } from '@/app/api/holidays/route';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [fetchedYear, setFetchedYear] = useState<number | null>(null);

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

  useEffect(() => {
    const currentYear = date.getFullYear();
    if (currentYear === fetchedYear) {
      return; // No volver a buscar si el año no ha cambiado
    }

    const fetchHolidays = async () => {
      try {
        const response = await fetch(`/api/holidays?year=${currentYear}`);
        if (!response.ok) {
          throw new Error('No se pudieron obtener los feriados');
        }
        const data: Holiday[] = await response.json();
        setHolidays(data);
        setFetchedYear(currentYear); // Marcar este año como obtenido
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    };

    fetchHolidays();
  }, [date, fetchedYear]);

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

  // 3. Agrega un dayPropGetter opcional para el fondo de la celda
  const dayPropGetter = useCallback((date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayHoliday = holidays.find(h => h.date === dateString);

    if (!dayHoliday) return {};

    const className = dayHoliday.countryCode === 'CL' ? 'bg-red-50' : 'bg-blue-50';
    return {
      className,
    };
  }, [holidays]);

  // 2. Usa useMemo para recrear solo los componentes cuando holidays cambien
  const components = useMemo(() => {
    // 1. Se renderizan puntos de colores
    // 4. Posicionamiento y accesibilidad de los dots
    const CustomDateCellWrapper = ({ children, value }: { children: React.ReactNode; value: Date }) => {
      const dateString = format(value, 'yyyy-MM-dd');
      const dayHolidays = holidays.filter(h => h.date === dateString);

      return (
        <div className="relative h-full w-full">
          {children}
          {dayHolidays.length > 0 && (
            <div className="absolute bottom-1 right-1 flex items-center space-x-1">
              {dayHolidays.map(holiday => (
                <Tooltip key={`${holiday.countryCode}-${holiday.name}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={`h-3 w-3 rounded-full ${holiday.countryCode === 'CL' ? 'bg-red-500' : 'bg-blue-500'} ring-1 ring-white`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{`${holiday.name} (${holiday.countryCode})`}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}
        </div>
      );
    };

    return {
      toolbar: CalendarToolbar,
      dateCellWrapper: CustomDateCellWrapper,
    };
  }, [holidays]);

  if (loading) {
    return <div className="text-center p-10">Cargando calendario...</div>;
  }

  return (
    <TooltipProvider>
      <div className="px-4 pb-4 pt-8 sm:px-6 sm:pb-6 sm:pt-10 lg:px-8 lg:pb-8 lg:pt-12">
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: 'rgba(40, 167, 69, 0.8)' }} />
            <span>Pedido Pagado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: 'rgba(220, 53, 69, 0.8)' }} />
            <span>Pedido Vencido</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500 ring-1 ring-white" />
            <span>Feriado (Chile)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500 ring-1 ring-white" />
            <span>Feriado (EE.UU.)</span>
          </div>
        </div>
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
          dayPropGetter={dayPropGetter}
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
    </TooltipProvider>
  );
}


