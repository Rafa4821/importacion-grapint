'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Provider, PlainOrder } from '@/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ReportCharts from '@/components/reports/ReportCharts'; 
import {
  Container, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Button, Box, Stack, Tooltip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, SelectChangeEvent
} from '@mui/material';
import { Mail as MailIcon, FileDownload as FileDownIcon } from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';

const ReportsPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<PlainOrder[] | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      const providersSnapshot = await getDocs(collection(db, 'providers'));
      const providersList = providersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Provider));
      setProviders(providersList);
    };
    fetchProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setReportData(null);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider,
          status,
          startDate: startDate ? startDate.toISOString() : '',
          endDate: endDate ? endDate.toISOString() : '',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al generar el reporte.');
      }

      toast.success(result.message || 'Reporte generado.');
      setReportData(result.data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!reportData) return;
    const dataForCSV = reportData.map(order => ({
      'Nº Orden': order.orderNumber,
      'Proveedor': order.providerName,
      'Fecha Orden': new Date(order.orderDate).toLocaleDateString(),
      'Monto Total': order.totalAmount,
      'Moneda': order.currency,
      'Estado': order.status,
      'Fecha Factura': order.invoiceDate ? new Date(order.invoiceDate).toLocaleDateString() : 'N/A',
      'Nº Factura': order.invoiceNumber || 'N/A',
    }));
    const csv = Papa.unparse(dataForCSV);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'reporte.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcel = () => {
    if (!reportData) return;
    const dataForExcel = reportData.map(order => ({
      'Nº Orden': order.orderNumber,
      'Proveedor': order.providerName,
      'Fecha Orden': new Date(order.orderDate).toLocaleDateString(),
      'Monto Total': order.totalAmount,
      'Moneda': order.currency,
      'Estado': order.status,
      'Fecha Factura': order.invoiceDate ? new Date(order.invoiceDate).toLocaleDateString() : 'N/A',
      'Nº Factura': order.invoiceNumber || 'N/A',
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, "reporte.xlsx");
  };
  
  const handleSendEmail = async () => {
    if (!reportData) {
      toast.error('Primero debes generar un reporte.');
      return;
    }
    const toastId = toast.loading('Enviando correo...');
    try {
      const response = await fetch('/api/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Error al enviar el correo.');
      toast.success('Correo enviado exitosamente.', { id: toastId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Central de Reportes
        </Typography>

        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200, flexGrow: 1 }}>
              <InputLabel id="provider-label">Proveedor</InputLabel>
              <Select labelId="provider-label" value={selectedProvider} onChange={(e: SelectChangeEvent) => setSelectedProvider(e.target.value)} label="Proveedor">
                <MenuItem value="all">Todos los proveedores</MenuItem>
                {providers.map(p => <MenuItem key={p.id} value={p.id}>{p.companyName}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150, flexGrow: 1 }}>
              <InputLabel id="status-label">Estado</InputLabel>
              <Select labelId="status-label" value={status} onChange={(e: SelectChangeEvent) => setStatus(e.target.value)} label="Estado">
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="en_proceso">En Proceso</MenuItem>
                <MenuItem value="completada">Completada</MenuItem>
                <MenuItem value="cancelada">Cancelada</MenuItem>
              </Select>
            </FormControl>
            <DatePicker label="Fecha Inicio" value={startDate} onChange={setStartDate} />
            <DatePicker label="Fecha Fin" value={endDate} onChange={setEndDate} />
            <Button type="submit" variant="contained" disabled={isLoading} sx={{ height: '56px', ml: 'auto' }}>
              {isLoading ? <CircularProgress size={24} /> : 'Generar'}
            </Button>
          </Box>
        </Paper>

        {reportData && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">Resultados del Reporte</Typography>
              {reportData.length > 0 && (
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Exportar a CSV">
                    <Button onClick={handleDownloadCSV} variant="outlined" startIcon={<FileDownIcon />}>CSV</Button>
                  </Tooltip>
                  <Tooltip title="Exportar a Excel">
                    <Button onClick={handleDownloadExcel} variant="outlined" startIcon={<FileDownIcon />}>Excel</Button>
                  </Tooltip>
                  <Tooltip title="Enviar por Email">
                    <Button onClick={handleSendEmail} variant="contained" startIcon={<MailIcon />}>Email</Button>
                  </Tooltip>
                </Stack>
              )}
            </Box>
            {reportData.length > 0 ? (
              <>
                <ReportCharts reportData={reportData} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Se encontraron <strong>{reportData.length}</strong> órdenes.
                </Typography>
                <TableContainer>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nº Orden</TableCell>
                        <TableCell>Proveedor</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Monto</TableCell>
                        <TableCell>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.map((order) => (
                        <TableRow key={order.id} hover>
                          <TableCell>{order.orderNumber}</TableCell>
                          <TableCell>{order.providerName}</TableCell>
                          <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Intl.NumberFormat('es-CL', { style: 'currency', currency: order.currency || 'CLP' }).format(order.totalAmount)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={order.status}
                              color={order.status === 'completada' ? 'success' : order.status === 'pendiente' ? 'warning' : 'info'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Typography>No se encontraron órdenes con los filtros seleccionados.</Typography>
            )}
          </Paper>
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default ReportsPage;
