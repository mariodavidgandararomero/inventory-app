import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { path: '/', icon: '◈', label: 'Panel de control', exact: true },
  { path: '/products', icon: '⊞', label: 'Inventario' },
  { path: '/categories', icon: '◉', label: 'Categorías' },
];

export default function Sidebar() {
  const { categories, sidebarOpen, setSidebarOpen } = useApp();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink-950/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen z-40 flex flex-col
        bg-ink-950 text-ink-200 transition-all duration-300
        ${sidebarOpen ? 'w-60' : 'w-16'}
        lg:relative lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-ink-800">
          <div className="w-8 h-8 bg-sage-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-800">i</span>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-display font-700 text-white text-sm leading-tight">Inventario</p>
              <p className="text-ink-500 text-xs">Multicanal</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-ink-500 hover:text-white transition-colors p-1 rounded"
          >
            {sidebarOpen ? '◂' : '▸'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-0.5 px-2">
            {NAV_ITEMS.map(item => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-ink-800 text-white'
                      : 'text-ink-400 hover:bg-ink-900 hover:text-white'
                    }
                    ${!sidebarOpen ? 'justify-center' : ''}
                  `}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>

          {/* Categories quick-nav */}
          {sidebarOpen && categories.length > 0 && (
            <div className="mt-6 px-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-widest text-ink-600 mb-2">
                Categorías
              </p>
              {categories.map(cat => (
                <NavLink
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className={({ isActive }) => `
                    flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all
                    ${location.search.includes(`category=${cat.id}`) && location.pathname === '/products'
                      ? 'bg-ink-800 text-white'
                      : 'text-ink-500 hover:bg-ink-900 hover:text-ink-300'
                    }
                  `}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                  <span className="ml-auto text-ink-600 font-mono text-xs">{cat.product_count}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-ink-800">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-sage-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-700">A</span>
              </div>
              <div>
                <p className="text-white text-xs font-medium">Admin</p>
                <p className="text-ink-500 text-xs">Gestor de inventario</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-7 h-7 bg-sage-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-700">A</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
