'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Provider, PlainOrder } from '@/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Mail, FileDown } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ReportCharts from '@/components/reports/ReportCharts';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ReportsPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
          startDate,
          endDate,
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
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'reporte.csv');
    link.style.visibility = 'hidden';
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
    if (!reportData) return;

    const email = prompt('Por favor, ingresa el correo electrónico del destinatario:');
    if (!email) {
      toast.error('No se ingresó un correo electrónico.');
      return;
    }

    const toastId = toast.loading('Enviando correo...');

    try {
      const response = await fetch('/api/reports/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reportData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al enviar el correo.');
      }

      toast.success('Correo enviado con éxito.', { id: toastId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Centro de Reportes</h1>
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="provider">Proveedor</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Seleccionar Proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Proveedores</SelectItem>
                  {providers.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Estado de la Orden</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccionar Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="endDate">Fecha de Fin</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="mt-6 w-full">
            {isLoading ? 'Generando...' : 'Generar Reporte'}
          </Button>
        </form>

        {isLoading && <div className="text-center"><p>Cargando resultados...</p></div>}

        {reportData && !isLoading && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Resultados del Reporte</h2>
              {reportData.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleDownloadCSV} variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar a CSV</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleDownloadExcel} variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar a Excel (.xlsx)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleSendEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar por Email
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enviar reporte por correo electrónico</p>
              </TooltipContent>
            </Tooltip>
          </div>
                </div>
              )}
            </div>
            {reportData.length > 0 ? (
              <>
                <ReportCharts reportData={reportData} />
                <p className="mb-4 text-gray-600">Se encontraron <span className="font-semibold">{reportData.length}</span> órdenes.</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Orden</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.providerName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: order.currency || 'CLP' }).format(order.totalAmount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'completada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{order.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p>No se encontraron órdenes con los filtros seleccionados.</p>
            )}
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
};

export default ReportsPage;
