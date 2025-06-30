'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig, ChartType, TimeRange } from '@/types';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar Widget</DialogTitle>
          <DialogDescription>
            Personaliza la métrica y la visualización de este widget.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="metric" className="text-right">
              Métrica
            </Label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona una métrica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expenses_by_provider">Gastos por Proveedor</SelectItem>
                <SelectItem value="order_count_by_provider">Nº de Órdenes por Proveedor</SelectItem>
                <SelectItem value="order_status_distribution">Distribución de Estados de Orden</SelectItem>
                <SelectItem value="monthly_expense_trend">Tendencia de Gastos Mensual</SelectItem>
                <SelectItem value="monthly_order_volume">Volumen de Órdenes Mensual</SelectItem>
                <SelectItem value="total_amount_by_currency">Total por Moneda</SelectItem>
                <SelectItem value="pending_payments">Total Pendiente de Pago</SelectItem>
                <SelectItem value="payments_forecast">Previsión de Pagos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="chart-type" className="text-right">
              Tipo de Gráfico
            </Label>
            <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un tipo de gráfico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pie">Torta</SelectItem>
                <SelectItem value="bar">Barras</SelectItem>
                <SelectItem value="line">Línea</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time-range" className="text-right">
              Período
            </Label>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
                <SelectItem value="all">Todo el tiempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
