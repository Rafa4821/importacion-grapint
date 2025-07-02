'use client';

import { useState, useEffect, useCallback } from 'react';

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import debounce from 'lodash.debounce';
import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout';
import type { Layout, Layouts } from 'react-grid-layout';
import { BarChartComponent } from '../../components/dashboard/BarChartComponent';
import { LineChartComponent } from '@/components/dashboard/LineChartComponent';
import ExpensesByProviderChart from '@/components/dashboard/ExpensesByProviderChart';
import { WidgetSettings } from '@/components/dashboard/WidgetSettings';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, LayoutDashboard } from 'lucide-react';
import { WidgetConfig } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Import styles for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Wrap the responsive grid layout with a width provider
const ResponsiveGridLayoutWithWidth = WidthProvider(ResponsiveGridLayout);

interface ChartData {
  name: string;
  value: number;
}

const DEFAULT_USER_ID = 'single-user-dashboard'; // Hardcoded ID for single-user mode

const DashboardPage = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [layouts, setLayouts] = useState<Layouts>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Debounced function to save dashboard state to Firestore
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveDashboardState = useCallback(debounce(async (uid: string, currentWidgets: WidgetConfig[], currentLayouts: Layouts) => {
    if (!uid) return;
    try {
      const dashboardRef = doc(db, 'dashboards', uid);

      // Create a payload object with the current state
      const payload = {
        widgets: currentWidgets,
        layouts: currentLayouts,
      };

      // Deep clone and remove all undefined values using JSON stringify/parse.
      // This is a robust way to ensure no undefined values are sent to Firestore.
      const cleanedPayload = JSON.parse(JSON.stringify(payload));

      await setDoc(dashboardRef, cleanedPayload);
    } catch (error) {
      console.error("Error saving dashboard state: ", error);
    }
  }, 1500), []);

  // Effect to load dashboard state from Firestore on component mount
  useEffect(() => {
    const loadDashboardState = async () => {
      const dashboardRef = doc(db, 'dashboards', DEFAULT_USER_ID);
      const docSnap = await getDoc(dashboardRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWidgets(data.widgets || []);
        setLayouts(data.layouts || {});
      } else {
        // Set default state for the first time
        setWidgets([
          {
            id: 'initial-widget-1',
            metric: 'expenses_by_provider',
            title: 'Gastos por Proveedor',
            chartType: 'pie',
          },
        ]);
        setLayouts({
          lg: [{ i: 'initial-widget-1', x: 0, y: 0, w: 6, h: 2.5, isDraggable: true, isResizable: true, minW: 3, minH: 2 }],
        });
      }
      setIsInitialLoad(false);
    };

    loadDashboardState();
  }, []); // Runs only once on mount

  // Effect to save dashboard state when widgets or layouts change
  useEffect(() => {
    if (!isInitialLoad) {
      saveDashboardState(DEFAULT_USER_ID, widgets, layouts);
    }
  }, [widgets, layouts, isInitialLoad, saveDashboardState]);

  const addWidget = () => {
    const newWidgetId = `widget-${Date.now()}`;
    const newWidget: WidgetConfig = {
      id: newWidgetId,
      metric: 'expenses_by_provider', // Default metric
      title: 'Nuevo Widget',
      chartType: 'bar', // Default chart type
      timeRange: '30d', // Default time range
    };

    const currentLayout = layouts.lg || [];
    const newLayoutItem = { ...findNextAvailablePosition(currentLayout, newWidgetId), w: 4, h: 2.5, isDraggable: true, isResizable: true, minW: 3, minH: 2 };

    setWidgets([...widgets, newWidget]);
    setLayouts(prev => ({ ...prev, lg: [...(prev.lg || []), newLayoutItem] }));
  };

  const removeWidget = (widgetIdToRemove: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este widget?')) {
      setWidgets(widgets.filter(w => w.id !== widgetIdToRemove));
      setLayouts(prev => {
        const newLayouts = { ...prev };
        // Remove the layout for the widget from all breakpoints
        Object.keys(newLayouts).forEach(breakpoint => {
          newLayouts[breakpoint] = newLayouts[breakpoint].filter(l => l.i !== widgetIdToRemove);
        });
        return newLayouts;
      });
    }
  };

  const findNextAvailablePosition = (layout: Layout[], newWidgetId: string): Layout => {
    const grid = new Array(100).fill(0).map(() => new Array(12).fill(false)); // Assuming max 100 rows

    // Mark occupied cells, rounding coordinates to handle potential floats from react-grid-layout
    layout.forEach(item => {
      const startY = Math.round(item.y);
      const endY = Math.round(item.y + item.h);
      const startX = Math.round(item.x);
      const endX = Math.round(item.x + item.w);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (y >= 0 && y < 100 && x >= 0 && x < 12) {
            grid[y][x] = true;
          }
        }
      }
    });

    const widgetWidth = 6;
    const widgetHeight = 2.5; // The actual height can be a float
    const gridHeight = Math.ceil(widgetHeight); // The number of grid rows it occupies

    // Find the first available position
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x <= 12 - widgetWidth; x++) {
        let isSpaceAvailable = true;
        for (let h = 0; h < gridHeight; h++) {
          for (let w = 0; w < widgetWidth; w++) {
            const checkY = y + h;
            const checkX = x + w;
            // Check if the cell is out of bounds or already occupied
            if (checkY >= 100 || checkX >= 12 || grid[checkY][checkX]) {
              isSpaceAvailable = false;
              break;
            }
          }
          if (!isSpaceAvailable) break;
        }
        if (isSpaceAvailable) {
          return { i: newWidgetId, x, y, w: widgetWidth, h: widgetHeight };
        }
      }
    }

    // Fallback position if no space is found
    return { i: newWidgetId, x: 0, y: Infinity, w: widgetWidth, h: widgetHeight };
  };

  const handleLayoutChange = (layout: Layout[], allLayouts: Layouts) => {
    if (!isInitialLoad) {
      setLayouts(allLayouts);
    }
  };

  const handleSaveSettings = (newConfig: Omit<WidgetConfig, 'id'>) => {
    if (!editingWidgetId) return;

    setWidgets(widgets.map(w => (w.id === editingWidgetId ? { ...newConfig, id: editingWidgetId } : w)));
    setIsSettingsOpen(false);
    setEditingWidgetId(null);
  };

  const openSettingsModal = (widgetId: string) => {
    setEditingWidgetId(widgetId);
    setIsSettingsOpen(true);
  };

  const editingWidget = widgets.find(w => w.id === editingWidgetId);

  if (isInitialLoad) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <TooltipProvider>
      <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard Financiero</h1>
        <Button onClick={addWidget}>Añadir Widget</Button>
      </div>

      {widgets.length > 0 ? (
        <ResponsiveGridLayoutWithWidth
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 1, xs: 1, xxs: 1 }}
          rowHeight={100}
          draggableHandle=".drag-handle"
          draggableCancel=".no-drag"
        >
          {widgets.map(widget => (
            <div key={widget.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col">
              <DashboardWidget config={widget} onOpenSettings={openSettingsModal} onRemove={removeWidget} />
            </div>
          ))}
        </ResponsiveGridLayoutWithWidth>
      ) : (
        <div className="text-center p-16 border-2 border-dashed rounded-lg bg-white">
          <LayoutDashboard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Dashboard Vacío</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza añadiendo un widget desde los botones de arriba.</p>
        </div>
      )}

      {editingWidget && (
        <WidgetSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentConfig={editingWidget}
          onSave={handleSaveSettings}
        />
      )}
    </div>
    </TooltipProvider>
  );
};

const DashboardWidget = ({ config, onOpenSettings, onRemove }: { config: WidgetConfig; onOpenSettings: (id: string) => void; onRemove: (id: string) => void; }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/dashboard/financial-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metric: config.metric, timeRange: config.timeRange }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch data');
        }
        setData(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [config.metric, config.timeRange]);

  const renderChart = () => {
    switch (config.chartType) {
      case 'pie':
        return <ExpensesByProviderChart data={data} />;
      case 'bar':
        return <BarChartComponent data={data} />;
      case 'line':
        return <LineChartComponent data={data} />;
      default:
        return <div className="text-center">Tipo de gráfico no soportado</div>;
    }
  };

  return (
    <>
      <div className="drag-handle cursor-move flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">{config.title}</h2>
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => onOpenSettings(config.id)} className="no-drag">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Configurar Widget</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => onRemove(config.id)} className="no-drag">
                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar Widget</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="flex-grow overflow-hidden">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <div className="flex justify-center items-center h-full text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          renderChart()
        )}
      </div>
    </>
  );
};

export default DashboardPage;
