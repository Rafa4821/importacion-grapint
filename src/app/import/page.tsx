'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import FileUploader from '@/components/import/FileUploader';
import ImportInstructions from '@/components/import/ImportInstructions';

// Define more specific types to avoid 'any'
type RowData = (string | number)[];

interface Installment {
  dueDate?: string;
  amount?: number;
  status: 'PENDIENTE';
}

interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: string[];
}

const ImportPage = () => {
  const [data, setData] = useState<RowData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileProcessed = (processedData: RowData[]) => {
    setImportResult(null); // Reset result when a new file is loaded
    if (processedData.length > 0) {
      setHeaders(processedData[0] as string[]);
      setData(processedData.slice(1));
    } else {
      setHeaders([]);
      setData([]);
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    setImportResult(null);

    const headerMap = headers.reduce((acc, header, index) => {
      acc[header.trim()] = index;
      return acc;
    }, {} as Record<string, number>);

    const ordersToImport = data.map(row => {
      const installmentsRaw = (row[headerMap['installments']] as string) || '';
      const installments = installmentsRaw
        .split(',')
        .map((inst: string): Installment => {
          const [dueDate, amount] = inst.split(':');
          return {
            dueDate: dueDate?.trim(),
            amount: parseFloat(amount?.trim()),
            status: 'PENDIENTE',
          };
        })
        .filter(
          (inst): inst is Required<Installment> =>
            !!inst.dueDate && !!inst.amount && !isNaN(inst.amount)
        );

      return {
        orderNumber: row[headerMap['orderNumber']],
        providerName: row[headerMap['providerName']],
        totalAmount: parseFloat(row[headerMap['totalAmount']] as string),
        issueDate: row[headerMap['issueDate']],
        status: row[headerMap['status']],
        installments,
      };
    });

    try {
      const response = await fetch('/api/orders/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders: ordersToImport }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ocurrió un error en el servidor.');
      }

      setImportResult(result);
    } catch (error) {
      setImportResult({
        successCount: 0,
        errorCount: data.length,
        errors: [error instanceof Error ? error.message : 'Error de conexión.'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Importación Masiva de Pedidos
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        <ImportInstructions />
        <FileUploader onFileProcessed={handleFileProcessed} />
      </Box>

      {importResult && (
        <Box sx={{ mt: 4 }}>
          <Alert
            severity={
              importResult.errorCount === 0
                ? 'success'
                : importResult.successCount > 0
                ? 'warning'
                : 'error'
            }
          >
            <AlertTitle>
              {importResult.errorCount === 0
                ? 'Importación Exitosa'
                : 'Resultado de la Importación'}
            </AlertTitle>
            Se procesaron {importResult.successCount + importResult.errorCount} registros.
            <br />
            <b>{importResult.successCount}</b> exitosos y <b>{importResult.errorCount}</b> con errores.
            {importResult.errors && importResult.errors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Detalle de errores:</Typography>
                <List dense sx={{ maxHeight: 200, overflow: 'auto', listStyleType: 'disc', pl: 2 }}>
                  {importResult.errors.map((error, index) => (
                    <ListItem key={index} sx={{ display: 'list-item', p: 0 }}>
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Alert>
        </Box>
      )}

      {data.length > 0 && (
        <Paper sx={{ mt: 4, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Vista Previa de Datos
          </Typography>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{String(cell)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleImport}
              disabled={isLoading || data.length === 0}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading ? 'Importando...' : `Confirmar e Importar ${data.length} Registros`}
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default ImportPage;
