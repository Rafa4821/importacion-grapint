'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import Link from 'next/link';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Abierto por defecto en desktop

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* El Sidebar ahora se pasará aquí */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header unificado para todo */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700"
              aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Título que solo aparece en móvil */}
            <div className="md:hidden">
                <Link href="/" className="text-xl font-bold text-gray-800">Impor-Cami</Link>
            </div>
            
            {/* Placeholder para mantener el botón de menú a la izquierda */}
            <div className="w-6 md:hidden"></div>
          </div>
        </header>

        {/* Contenido principal con scroll */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
