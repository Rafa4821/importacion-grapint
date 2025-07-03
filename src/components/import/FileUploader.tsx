'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import { UploadFile as UploadFileIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';

type RowData = (string | number)[];

interface FileUploaderProps {
  onFileProcessed: (data: RowData[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileProcessed }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setFileName(null);

    if (acceptedFiles.length === 0) {
      setError('No se seleccionó ningún archivo o el tipo de archivo no es válido.');
      return;
    }

    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as RowData[];
        setFileName(file.name);
        onFileProcessed(data);
      } catch (e) {
        console.error(e);
        setError('Hubo un error al procesar el archivo. Asegúrate de que sea un archivo Excel o CSV válido.');
      }
    };

    reader.onerror = () => {
        setError('No se pudo leer el archivo.');
    };

    reader.readAsBinaryString(file);
  }, [onFileProcessed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  return (
    <Paper
      {...getRootProps()}
      variant="outlined"
      sx={{
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        borderStyle: 'dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.500',
        backgroundColor: isDragActive ? 'action.hover' : 'transparent',
        transition: 'border-color 0.2s, background-color 0.2s',
      }}
    >
      <input {...getInputProps()} />
      <IconButton color="primary" sx={{ mb: 2, pointerEvents: 'none' }}>
        <UploadFileIcon sx={{ fontSize: 60 }} />
      </IconButton>
      <Typography variant="h6">
        {isDragActive ? 'Suelta el archivo aquí...' : 'Arrastra y suelta un archivo, o haz clic para seleccionar'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Soportado: .xlsx, .csv
      </Typography>
      {fileName && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'success.main' }}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          <Typography variant="body1">Archivo cargado: {fileName}</Typography>
        </Box>
      )}
      {error && (
         <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'error.main' }}>
          <ErrorIcon sx={{ mr: 1 }} />
          <Typography variant="body1">{error}</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default FileUploader;
