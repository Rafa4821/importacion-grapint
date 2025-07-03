'use client';

import React from 'react';
import { Box, Button, Paper, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { FileDownload as FileDownloadIcon, ArrowRight as ArrowRightIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ImportInstructions = () => {

  const handleDownloadTemplate = () => {
    const headers = [
      'orderNumber',
      'providerName',
      'totalAmount',
      'issueDate',
      'status',
      'installments'
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    saveAs(blob, 'plantilla_importacion_pedidos.xlsx');
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>Instrucciones de Importación</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Sigue estos pasos para importar tus pedidos desde un archivo Excel. ¡Es muy fácil!
      </Typography>
      <List dense>
        <ListItem>
          <ListItemIcon><ArrowRightIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={<b>orderNumber</b>} secondary="El código o número que usas para identificar cada pedido. Ej: PED-001" />
        </ListItem>
        <ListItem>
          <ListItemIcon><ArrowRightIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={<b>providerName</b>} secondary="El nombre completo de tu proveedor, tal como lo tienes guardado en el sistema." />
        </ListItem>
        <ListItem>
          <ListItemIcon><ArrowRightIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={<b>totalAmount</b>} secondary="El costo total del pedido. Escribe solo el número, usando un punto para los decimales. Ej: 1500.50" />
        </ListItem>
        <ListItem>
          <ListItemIcon><ArrowRightIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={<b>issueDate</b>} secondary="La fecha en que se emitió el pedido. Usa el formato AÑO-MES-DÍA. Ej: 2024-08-25" />
        </ListItem>
        <ListItem>
          <ListItemIcon><ArrowRightIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={<b>status</b>} secondary="El estado actual del pedido. Elige una de estas opciones: PENDIENTE, EN_PRODUCCION, EN_TRANSITO, EN_ADUANA, EN_BODEGA, ENTREGADO." />
        </ListItem>
        <ListItem>
          <ListItemIcon><ArrowRightIcon fontSize="small" /></ListItemIcon>
          <ListItemText 
            primary={<b>installments</b>} 
            secondaryTypographyProps={{ component: 'div' }}
            secondary={
              <Box>
                <Typography variant="body2">Las cuotas del pedido. Si no hay cuotas, déjalo en blanco.</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  Formato: <b>FECHA:MONTO</b>, separando cada cuota con una coma.
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Ejemplo para dos cuotas: <b>2024-09-15:750.25,2024-10-15:750.25</b>
                </Typography>
              </Box>
            }
          />
        </ListItem>
      </List>
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          startIcon={<FileDownloadIcon />}
          onClick={handleDownloadTemplate}
        >
          Descargar Plantilla
        </Button>
      </Box>
    </Paper>
  );
};

export default ImportInstructions;
