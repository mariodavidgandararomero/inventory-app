import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Login from './pages/Login';

// ── Ruta protegida: redirige a /login si no hay sesión ────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-sage-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-display font-800 text-lg">i</span>
          </div>
          <div className="flex items-center gap-2 text-ink-400">
            <div className="w-4 h-4 border-2 border-ink-700 border-t-ink-400 rounded-full animate-spin" />
            <span className="text-sm">Verificando sesión...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ── Ruta con permiso requerido ─────────────────────────────────────────────────
function RequirePermission({ permission, children }) {
  const { can } = useAuth();

  if (!can(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <span className="text-5xl">🔒</span>
        <p className="font-display font-700 text-ink-700 text-lg">Acceso denegado</p>
        <p className="text-ink-400 text-sm">No tienes permiso para ver esta sección.</p>
      </div>
    );
  }

  return children;
}

// ── Layout principal con sidebar ───────────────────────────────────────────────
function AppLayout() {
  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6">
            <Routes>
              <Route path="/" element={
                <RequirePermission permission="dashboard.view"><Dashboard /></RequirePermission>
              } />
              <Route path="/products" element={
                <RequirePermission permission="products.view"><Products /></RequirePermission>
              } />
              <Route path="/categories" element={
                <RequirePermission permission="categories.view"><Categories /></RequirePermission>
              } />
              <Route path="/users" element={
                <RequirePermission permission="users.view"><Users /></RequirePermission>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </AppProvider>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginGuard />} />

          {/* Rutas protegidas */}
          <Route path="/*" element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          } />
        </Routes>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181a',
              color: '#f5f5f0',
              fontSize: '13px',
              fontFamily: 'DM Sans, sans-serif',
              borderRadius: '10px',
              padding: '10px 16px',
            },
            success: { iconTheme: { primary: '#5da280', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

// Si ya hay sesión y va a /login → redirigir al home
function LoginGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}
