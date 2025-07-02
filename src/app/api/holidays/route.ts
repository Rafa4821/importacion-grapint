import { NextRequest, NextResponse } from 'next/server';

// Define la estructura esperada de un feriado de la API de Nager
interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

// Define la estructura del objeto de feriado que devolveremos
export interface Holiday {
  date: string;
  name: string;
  countryCode: 'US' | 'CL';
}

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get('year');

  if (!year) {
    return NextResponse.json({ error: 'El año es un parámetro requerido' }, { status: 400 });
  }

  try {
    // Consultar los feriados de ambos países en paralelo para mayor eficiencia
    const [usResponse, clResponse] = await Promise.all([
      fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`),
      fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/CL`),
    ]);

    if (!usResponse.ok || !clResponse.ok) {
      // Manejar posibles errores de la API externa
      console.error('Error en la API de Nager:', { us: usResponse.statusText, cl: clResponse.statusText });
      throw new Error('No se pudieron obtener los datos de feriados de la API externa.');
    }

    const usHolidays: NagerHoliday[] = await usResponse.json();
    const clHolidays: NagerHoliday[] = await clResponse.json();

        // Mapeo simple para traducir los nombres de los feriados de EE. UU. al español
    const usHolidayTranslations: { [key: string]: string } = {
      "New Year's Day": "Año Nuevo",
      "Martin Luther King, Jr. Day": "Día de Martin Luther King, Jr.",
      "Washington's Birthday": "Cumpleaños de Washington",
      "Good Friday": "Viernes Santo",
      "Memorial Day": "Día de los Caídos",
      "Juneteenth": "Juneteenth",
      "Independence Day": "Día de la Independencia",
      "Labour Day": "Día del Trabajo",
      "Columbus Day": "Día de Colón",
      "Veterans Day": "Día de los Veteranos",
      "Thanksgiving Day": "Día de Acción de Gracias",
      "Christmas Day": "Navidad",
    };

    // Función para obtener el nombre traducido o el original si no hay traducción
    const getTranslatedName = (name: string) => usHolidayTranslations[name] || name;

    // Formatear y combinar los datos de los feriados
    const formattedHolidays: Holiday[] = [
      ...usHolidays.map(h => ({ date: h.date, name: getTranslatedName(h.name), countryCode: 'US' as const })),
      ...clHolidays.map(h => ({ date: h.date, name: h.localName, countryCode: 'CL' as const })), // Usar localName para Chile
    ];
    
    return NextResponse.json(formattedHolidays);

  } catch (error) {
    console.error('Error al obtener los feriados:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    return NextResponse.json({ error: 'No se pudieron obtener los feriados', details: errorMessage }, { status: 500 });
  }
}
