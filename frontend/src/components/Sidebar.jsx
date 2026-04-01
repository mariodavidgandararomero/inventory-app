import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin:   'bg-ink-700 text-white',
  manager: 'bg-sage-600 text-white',
  viewer:  'bg-amber-500 text-white',
};

export default function Sidebar() {
  const { categories, sidebarOpen, setSidebarOpen } = useApp();
  const { user, logout, can } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { path: '/',           icon: '◈', label: 'Panel de control', perm: 'dashboard.view',  exact: true },
    { path: '/products',   icon: '⊞', label: 'Inventario',        perm: 'products.view' },
    { path: '/categories', icon: '◉', label: 'Categorías',         perm: 'categories.view' },
    { path: '/users',      icon: '👥', label: 'Usuarios',           perm: 'users.view' },
  ].filter(item => can(item.perm));

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-ink-950/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
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
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive ? 'bg-ink-800 text-white' : 'text-ink-400 hover:bg-ink-900 hover:text-white'}
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
              <p className="px-3 text-xs font-semibold uppercase tracking-widest text-ink-600 mb-2">Categorías</p>
              {categories.map(cat => (
                <NavLink
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className={`
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

        {/* User footer */}
        <div className="p-3 border-t border-ink-800 space-y-2">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="w-8 h-8 bg-sage-600 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-700">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-medium truncate">{user?.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${ROLE_COLORS[user?.role] || 'bg-ink-700 text-white'}`}>
                    {user?.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-ink-500 hover:text-coral-400 hover:bg-ink-900 rounded-lg text-xs transition-all"
              >
                <span>⎋</span>
                <span>Cerrar sesión</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 bg-sage-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-700">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <button onClick={handleLogout} className="text-ink-500 hover:text-coral-400 text-xs transition-colors" title="Cerrar sesión">
                ⎋
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}