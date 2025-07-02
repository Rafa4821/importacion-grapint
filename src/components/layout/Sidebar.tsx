'use client';

import Link from 'next/link';
import { Truck, ShoppingCart, Calendar, LayoutGrid, X, Bell, FileText } from 'lucide-react';
import { usePathname } from 'next/navigation';


interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const pathname = usePathname();

  const linkClasses = (path: string) =>
    `flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 ${
      pathname === path ? 'bg-gray-900' : ''
    } ${!isOpen ? 'md:justify-center' : ''}`;

  // Clases para controlar el tamaño y la visibilidad en móvil
  const sidebarContainerClasses = `
    bg-gray-800 text-white flex flex-col h-full z-40
    fixed md:static
    w-64
    transition-all duration-300 ease-in-out
    transform
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    md:w-16 md:translate-x-0
    ${isOpen && 'md:w-64'}
  `;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={sidebarContainerClasses}>
        <div className={`flex items-center p-4 mb-6 ${isOpen ? 'justify-between' : 'md:justify-center'}`}>
          <span className={`text-2xl font-bold whitespace-nowrap transition-opacity ${!isOpen && 'md:hidden'}`}>
            Impor-Cami
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-grow px-2">
          <ul>
            {/* Se añade 'title' para tooltips cuando esté colapsado */}
            <li><Link href="/" className={linkClasses('/')} title="Central de Reportes"><FileText className="h-6 w-6 flex-shrink-0" /><span className={`ml-4 ${!isOpen && 'md:hidden'}`}>Central de Reportes</span></Link></li>
            <li className="mt-2"><Link href="/dashboard" className={linkClasses('/dashboard')} title="Dashboard Financiero"><LayoutGrid className="h-6 w-6 flex-shrink-0" /><span className={`ml-4 ${!isOpen && 'md:hidden'}`}>Dashboard Financiero</span></Link></li>
            <li className="mt-2"><Link href="/providers" className={linkClasses('/providers')} title="Proveedores"><Truck className="h-6 w-6 flex-shrink-0" /><span className={`ml-4 ${!isOpen && 'md:hidden'}`}>Proveedores</span></Link></li>
            <li className="mt-2"><Link href="/notifications" className={linkClasses('/notifications')} title="Notificaciones"><Bell className="h-6 w-6 flex-shrink-0" /><span className={`ml-4 ${!isOpen && 'md:hidden'}`}>Notificaciones</span></Link></li>
            <li className="mt-2"><Link href="/orders" className={linkClasses('/orders')} title="Pedidos"><ShoppingCart className="h-6 w-6 flex-shrink-0" /><span className={`ml-4 ${!isOpen && 'md:hidden'}`}>Pedidos</span></Link></li>
            <li className="mt-2"><Link href="/kanban" className={linkClasses('/kanban')} title="Seguimiento"><LayoutGrid className="h-6 w-6 flex-shrink-0" /><span className={`ml-4 ${!isOpen && 'md:hidden'}`}>Seguimiento</span></Link></li>
            <li className="mt-2"><Link href="/calendar" className={linkClasses('/calendar')} title="Calendario"><Calendar className="h-6 w-6 flex-shrink-0" /><span className={`ml-4 ${!isOpen && 'md:hidden'}`}>Calendario</span></Link></li>

          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
