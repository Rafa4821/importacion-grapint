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
import { WidgetConfig } from '@/types';
import { Button, IconButton, Paper, Box, Typography, Skeleton, Tooltip, useTheme } from '@mui/material';
import { Settings, Delete, Add, Dashboard as DashboardIcon } from '@mui/icons-material';

// Import styles for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

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

  useEffect(() => {
    const loadDashboardState = async () => {
      const dashboardRef = doc(db, 'dashboards', DEFAULT_USER_ID);
      const docSnap = await getDoc(dashboardRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWidgets(data.widgets || []);
        setLayouts(data.layouts || {});
      } else {
        // Default initial state if nothing is saved
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
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveState = useCallback(
    debounce(async (currentWidgets: WidgetConfig[], currentLayouts: Layouts) => {
      try {
        const dashboardRef = doc(db, 'dashboards', DEFAULT_USER_ID);
        const payload = { widgets: currentWidgets, layouts: currentLayouts };
        const cleanedPayload = JSON.parse(JSON.stringify(payload)); // Deep copy and remove undefined
        await setDoc(dashboardRef, cleanedPayload);
      } catch (error) {
        console.error("Error saving dashboard state: ", error);
      }
    }, 1500),
    [] // The debounced function itself doesn't change, so dependencies are empty.
  );

  useEffect(() => {
    if (!isInitialLoad) {
      saveState(widgets, layouts);
    }
  }, [widgets, layouts, isInitialLoad, saveState]);

  const addWidget = () => {
    const newWidgetId = `widget-${Date.now()}`;
    const newWidget: WidgetConfig = {
      id: newWidgetId,
      metric: 'expenses_by_provider',
      title: 'Nuevo Widget',
      chartType: 'bar',
    };
    setWidgets(prev => [...prev, newWidget]);
    const newLayoutItem = findNextAvailablePosition(layouts.lg || [], newWidgetId);
    setLayouts(prev => ({ ...prev, lg: [...(prev.lg || []), newLayoutItem] }));
  };

  const removeWidget = (widgetIdToRemove: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetIdToRemove));
    setLayouts(prev => {
      const newLayouts = { ...prev };
      Object.keys(newLayouts).forEach(breakpoint => {
        newLayouts[breakpoint] = newLayouts[breakpoint].filter(l => l.i !== widgetIdToRemove);
      });
      return newLayouts;
    });
  };

  const findNextAvailablePosition = (layout: Layout[], newWidgetId: string): Layout => {
    const occupied = new Set<string>();
    layout.forEach(item => {
      for (let y = item.y; y < item.y + item.h; y++) {
        for (let x = item.x; x < item.x + item.w; x++) {
          occupied.add(`${x},${y}`);
        }
      }
    });
    let y = 0, x = 0;
    while (true) {
      let positionFound = true;
      for (let i = 0; i < 6; i++) { // Default width
        for (let j = 0; j < 2.5; j++) { // Default height
          if (occupied.has(`${x + i},${y + j}`)) {
            positionFound = false;
            break;
          }
        }
        if (!positionFound) break;
      }
      if (positionFound) {
        return { i: newWidgetId, x, y, w: 6, h: 2.5, isDraggable: true, isResizable: true, minW: 3, minH: 2 };
      }
      x++;
      if (x >= 12) { // 12 columns
        x = 0;
        y++;
      }
    }
  };

  const handleLayoutChange = (layout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
  };

  const handleSaveSettings = (newConfig: Omit<WidgetConfig, 'id'>) => {
    if (!editingWidgetId) return;
    setWidgets(prev => prev.map(w => w.id === editingWidgetId ? { ...w, ...newConfig } : w));
    setIsSettingsOpen(false);
    setEditingWidgetId(null);
  };

  const openSettingsModal = (widgetId: string) => {
    setEditingWidgetId(widgetId);
    setIsSettingsOpen(true);
  };

  const editingWidget = widgets.find(w => w.id === editingWidgetId);

  if (isInitialLoad) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">Dashboard Financiero</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={addWidget}>
          Añadir Widget
        </Button>
      </Box>

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
            <Paper 
              key={widget.id} 
              elevation={2} 
              sx={{ 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: 'background.paper' // Theme-aware background
              }}
            >
              <DashboardWidget config={widget} onOpenSettings={openSettingsModal} onRemove={removeWidget} />
            </Paper>
          ))}
        </ResponsiveGridLayoutWithWidth>
      ) : (
        <Paper 
          sx={{
            textAlign: 'center', 
            p: { xs: 4, md: 8 }, 
            border: '2px dashed', 
            borderColor: 'divider', // Theme-aware border color
            backgroundColor: 'transparent', // Make it blend with the background
            boxShadow: 'none'
          }}
        >
          <DashboardIcon sx={{ mx: 'auto', fontSize: 48, color: 'text.secondary' }} />
          <Typography variant="h6" component="h3" sx={{ mt: 2 }}>Dashboard Vacío</Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary' }}>
            Comienza añadiendo un widget desde el botón de arriba.
          </Typography>
        </Paper>
      )}

      {editingWidget && (
        <WidgetSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentConfig={editingWidget}
          onSave={handleSaveSettings}
        />
      )}
    </Box>
  );
};

const DashboardWidget = ({ config, onOpenSettings, onRemove }: { config: WidgetConfig; onOpenSettings: (id: string) => void; onRemove: (id: string) => void; }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme(); // Access theme for dynamic colors

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
        return <ExpensesByProviderChart data={data} theme={theme} />;
      case 'bar':
        return <BarChartComponent data={data} theme={theme} />;
      case 'line':
        return <LineChartComponent data={data} theme={theme} />;
      default:
        return <Typography sx={{ textAlign: 'center' }}>Tipo de gráfico no soportado</Typography>;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'text.primary' }}>
      <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" component="h2">{config.title}</Typography>
        <Box className="no-drag">
          <Tooltip title="Configurar Widget">
            <IconButton size="small" onClick={() => onOpenSettings(config.id)} sx={{ color: 'text.secondary' }}>
              <Settings fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar Widget">
            <IconButton size="small" onClick={() => onRemove(config.id)} sx={{ color: 'error.main' }}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {isLoading ? (
          <Skeleton variant="rectangular" width="100%" height="100%" sx={{ backgroundColor: 'background.default' }} />
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'error.main' }}>
            <Typography>{error}</Typography>
          </Box>
        ) : (
          renderChart()
        )}
      </Box>
    </Box>
  );
};

export default DashboardPage;
