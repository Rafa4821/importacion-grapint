'use client';

import { Navigate, View } from 'react-big-calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Tipos para las props que recibe la barra de herramientas de react-big-calendar
// Definimos un tipo para las acciones de navegación, extrayendo los valores del objeto Navigate
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
    <div className="rbc-toolbar mb-4 flex flex-col md:flex-row items-center justify-between p-2 bg-gray-50 rounded-lg">
      {/* Grupo de Navegación */}
      <div className="flex items-center mb-3 md:mb-0">
        <button
          type="button"
          onClick={() => onNavigate(Navigate.PREVIOUS)}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate(Navigate.TODAY)}
          className="mx-2 px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 font-semibold text-gray-700 text-sm transition-colors"
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => onNavigate(Navigate.NEXT)}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Siguiente"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Etiqueta de Fecha (Mes y Año) */}
      <div className="text-lg font-bold text-gray-800 order-first md:order-none mb-3 md:mb-0">
        {label}
      </div>

      {/* Grupo de Vistas */}
      <div className="flex items-center space-x-1 bg-gray-200 p-1 rounded-lg">
        {(['month', 'week', 'day', 'agenda'] as View[]).map(viewName => (
          <button
            key={viewName}
            type="button"
            onClick={() => onView(viewName)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              view === viewName
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-300'
            }`}
          >
            {viewNames[viewName]}
          </button>
        ))}
      </div>
    </div>
  );
};
