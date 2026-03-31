import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { email: 'admin@inventario.com',   password: 'admin123',   role: 'Admin',   color: 'bg-ink-900 text-white' },
  { email: 'manager@inventario.com', password: 'manager123', role: 'Manager', color: 'bg-sage-600 text-white' },
  { email: 'viewer@inventario.com',  password: 'viewer123',  role: 'Viewer',  color: 'bg-amber-500 text-white' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password });
  };

  return (
    <div className="min-h-screen bg-ink-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-ink-900 border-r border-ink-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sage-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-display font-800 text-base">i</span>
          </div>
          <span className="font-display font-700 text-white text-lg">Inventario Multicanal</span>
        </div>

        <div>
          <p className="font-display font-800 text-4xl text-white leading-tight mb-4">
            Gestiona tu inventario<br />
            <span className="text-sage-400">con total control.</span>
          </p>
          <p className="text-ink-400 text-sm leading-relaxed">
            Panel profesional para negocios multicanal. Productos, stock, márgenes
            y alertas — todo en un solo lugar.
          </p>

          <div className="mt-10 space-y-3">
            {[
              { icon: '📦', text: 'Inventario en tiempo real' },
              { icon: '📊', text: 'Márgenes de ganancia automáticos' },
              { icon: '⚠️', text: 'Alertas de stock bajo' },
              { icon: '👥', text: 'Múltiples usuarios y roles' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 text-ink-300 text-sm">
                <span className="text-base">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <p className="text-ink-600 text-xs">© 2024 Inventario Multicanal</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm mx-auto animate-slide-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-sage-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-800 text-sm">i</span>
            </div>
            <span className="font-display font-700 text-white">Inventario</span>
          </div>

          <h1 className="font-display font-700 text-2xl text-white mb-1">Iniciar sesión</h1>
          <p className="text-ink-400 text-sm mb-8">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-ink-800 border border-ink-700 rounded-xl text-white placeholder:text-ink-500 text-sm focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500 transition-all"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-12 bg-ink-800 border border-ink-700 rounded-xl text-white placeholder:text-ink-500 text-sm focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500 transition-all"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors text-sm px-1"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sage-500 hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verificando...</>
                : 'Ingresar al sistema →'
              }
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-ink-800" />
              <p className="text-ink-600 text-xs font-medium">Cuentas de demo</p>
              <div className="flex-1 h-px bg-ink-800" />
            </div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-ink-900 hover:bg-ink-800 border border-ink-800 hover:border-ink-700 rounded-xl transition-all group"
                >
                  <span className={`px-2 py-0.5 rounded text-xs font-700 ${acc.color}`}>{acc.role}</span>
                  <span className="text-ink-400 text-xs font-mono group-hover:text-ink-300 transition-colors">{acc.email}</span>
                  <span className="ml-auto text-ink-600 text-xs group-hover:text-ink-400">→</span>
                </button>
              ))}
            </div>
            <p className="text-center text-ink-600 text-xs mt-3">
              Haz clic en una cuenta para autocompletar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
