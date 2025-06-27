'use client';

import Link from 'next/link';
import { Home, Truck, ShoppingCart, Calendar, LayoutGrid, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const pathname = usePathname();

  const linkClasses = (path: string) =>
    `flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 ${
      pathname === path ? 'bg-gray-900' : ''
    }`;

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
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white p-4 flex flex-col z-30
                   transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Impor-Cami</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-grow">
          <ul>
            <li className="mb-4">
              <Link href="/" className={linkClasses('/')} onClick={() => setIsOpen(false)}>
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/providers" className={linkClasses('/providers')} onClick={() => setIsOpen(false)}>
                <Truck className="mr-3 h-5 w-5" />
                Proveedores
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/orders" className={linkClasses('/orders')} onClick={() => setIsOpen(false)}>
                <ShoppingCart className="mr-3 h-5 w-5" />
                Pedidos
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/kanban" className={linkClasses('/kanban')} onClick={() => setIsOpen(false)}>
                <LayoutGrid className="mr-3 h-5 w-5" />
                Seguimiento
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/calendar" className={linkClasses('/calendar')} onClick={() => setIsOpen(false)}>
                <Calendar className="mr-3 h-5 w-5" />
                Calendario
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
