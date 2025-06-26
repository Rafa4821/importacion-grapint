import Link from 'next/link';
import { Home, Truck, ShoppingCart, Calendar, LayoutGrid } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800 text-white p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-center">Impor-Cami</h2>
      </div>
      <nav className="flex-grow">
        <ul>
          <li className="mb-4">
            <Link href="/" className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
          </li>
          <li className="mb-4">
            <Link href="/providers" className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
              <Truck className="mr-3 h-5 w-5" />
              Proveedores
            </Link>
          </li>
          <li className="mb-4">
            <Link href="/orders" className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
              <ShoppingCart className="mr-3 h-5 w-5" />
              Pedidos
            </Link>
          </li>
          <li className="mb-4">
            <Link href="/kanban" className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
              <LayoutGrid className="mr-3 h-5 w-5" />
              Kanban
            </Link>
          </li>
          <li className="mb-4">
            <Link href="/calendar" className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
              <Calendar className="mr-3 h-5 w-5" />
              Calendario
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
