'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig, ChartType, TimeRange } from '@/types';
import { 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box 
} from '@mui/material';

interface WidgetSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: WidgetConfig;
  onSave: (newConfig: Omit<WidgetConfig, 'id'>) => void;
}

const METRICS_MAP: Record<string, string> = {
  'expenses_by_provider': 'Gastos por Proveedor',
  'order_count_by_provider': 'Nº de Órdenes por Proveedor',
  'order_status_distribution': 'Distribución de Estados de Orden',
  'monthly_expense_trend': 'Tendencia de Gastos Mensual',
  'monthly_order_volume': 'Volumen de Órdenes Mensual',
  'total_amount_by_currency': 'Total por Moneda',
  'pending_payments': 'Total Pendiente de Pago',
  'payments_forecast': 'Previsión de Pagos',
};

export function WidgetSettings({ isOpen, onClose, currentConfig, onSave }: WidgetSettingsProps) {
  const [metric, setMetric] = useState(currentConfig.metric);
  const [chartType, setChartType] = useState(currentConfig.chartType);
  const [timeRange, setTimeRange] = useState(currentConfig.timeRange || 'all');

  useEffect(() => {
    if (isOpen) {
      setMetric(currentConfig.metric);
      setChartType(currentConfig.chartType);
      setTimeRange(currentConfig.timeRange || 'all');
    }
  }, [isOpen, currentConfig]);

  const handleSave = () => {
    const title = METRICS_MAP[metric] || 'Widget Personalizado';
    const configToSave: Omit<WidgetConfig, 'id'> = { metric, title, chartType, timeRange };
    onSave(configToSave);
    onClose(); // Close dialog on save
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configurar Widget</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Personaliza la métrica y la visualización de este widget.
        </DialogContentText>
        <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="metric-label">Métrica</InputLabel>
            <Select
              labelId="metric-label"
              value={metric}
              label="Métrica"
              onChange={(e) => setMetric(e.target.value)}
            >
              {Object.entries(METRICS_MAP).map(([key, value]) => (
                <MenuItem key={key} value={key}>{value}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="chart-type-label">Tipo de Gráfico</InputLabel>
            <Select
              labelId="chart-type-label"
              value={chartType}
              label="Tipo de Gráfico"
              onChange={(e) => setChartType(e.target.value as ChartType)}
            >
              <MenuItem value="pie">Torta</MenuItem>
              <MenuItem value="bar">Barras</MenuItem>
              <MenuItem value="line">Línea</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="time-range-label">Período</InputLabel>
            <Select
              labelId="time-range-label"
              value={timeRange}
              label="Período"
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            >
              <MenuItem value="7d">Últimos 7 días</MenuItem>
              <MenuItem value="30d">Últimos 30 días</MenuItem>
              <MenuItem value="90d">Últimos 90 días</MenuItem>
              <MenuItem value="all">Todo el tiempo</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Guardar Cambios</Button>
      </DialogActions>
    </Dialog>
  );
}
