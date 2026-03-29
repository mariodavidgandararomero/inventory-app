import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { formatCurrency, formatDate, getMarginBadge, getStockBadge, MOVEMENT_TYPES } from '../utils/formatters';

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className={`stat-card ${accent ? 'border-l-2 border-' + accent : ''}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="font-display text-2xl font-700 text-ink-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-ink-400">
        <div className="w-5 h-5 border-2 border-ink-300 border-t-ink-600 rounded-full animate-spin" />
        <span className="text-sm">Cargando panel...</span>
      </div>
    </div>
  );

  if (!data) return null;
  const { summary, low_stock_products, category_stats, recent_movements, top_margin_products } = data;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Panel de control</h1>
        <p className="text-ink-400 text-sm mt-1">Vista general de tu inventario multicanal</p>
      </div>

      {/* Low stock alert banner */}
      {summary.low_stock_count > 0 && (
        <div className="bg-coral-50 border border-coral-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-coral-700">
              {summary.low_stock_count} producto{summary.low_stock_count > 1 ? 's' : ''} con stock bajo
            </p>
            <p className="text-xs text-coral-500 mt-0.5">Revisa la sección de alertas abajo para más detalles</p>
          </div>
          <Link to="/products?low_stock=true" className="text-xs font-semibold text-coral-600 hover:text-coral-700 border border-coral-200 px-3 py-1.5 rounded-lg hover:bg-coral-100 transition-colors">
            Ver todos →
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total productos" value={summary.total_products} sub={`${summary.total_categories} categorías`} icon="📦" />
        <StatCard label="Stock bajo" value={summary.low_stock_count} sub="Requieren atención" accent="coral-400" icon="⚠️" />
        <StatCard label="Valor en costo" value={formatCurrency(summary.inventory_cost_value)} sub="Inversión actual" icon="💰" />
        <StatCard label="Ganancia potencial" value={formatCurrency(summary.potential_profit)} sub="Si vendes todo" accent="sage-400" icon="📈" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Low stock products */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-50 flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <span className="w-2 h-2 bg-coral-400 rounded-full"></span>
              Alertas de stock bajo
            </h2>
            <Link to="/products?low_stock=true" className="text-xs text-sage-600 hover:text-sage-700 font-medium">
              Ver todos →
            </Link>
          </div>
          {low_stock_products.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <span className="text-3xl">✅</span>
              <p className="text-sm text-ink-400 mt-2">Todo el inventario está bien abastecido</p>
            </div>
          ) : (
            <div className="divide-y divide-ink-50">
              {low_stock_products.map(p => {
                const stockBadge = getStockBadge(p.stock, p.low_stock_threshold);
                return (
                  <div key={p.id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-red-50/30 transition-colors ${p.stock === 0 ? 'bg-coral-50/40' : ''}`}>
                    <div className="w-8 h-8 bg-ink-100 rounded-lg flex items-center justify-center text-base shrink-0">
                      {p.category_icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">{p.name}</p>
                      <p className="text-xs text-ink-400">{p.category_name} · {p.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`badge ${stockBadge.cls} text-xs`}>
                        {p.stock} uds
                      </span>
                      <p className="text-xs text-ink-400 mt-0.5">mín: {p.low_stock_threshold}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category stats */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-50">
            <h2 className="section-title">Por categoría</h2>
          </div>
          <div className="divide-y divide-ink-50">
            {category_stats.map(cat => (
              <div key={cat.name} className="px-5 py-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <span>{cat.icon}</span>
                  <span className="text-sm font-medium text-ink-700">{cat.name}</span>
                  <span className="ml-auto text-xs font-mono text-ink-400">{cat.product_count} prods.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sage-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (cat.total_stock / 100) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-ink-400 shrink-0">{cat.total_stock || 0} uds</span>
                </div>
                {cat.avg_margin > 0 && (
                  <p className="text-xs text-ink-400 mt-1">
                    Margen prom: <span className={`font-medium ${cat.avg_margin >= 40 ? 'text-sage-600' : 'text-amber-600'}`}>{Math.round(cat.avg_margin)}%</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top margins */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-50">
            <h2 className="section-title">Mejores márgenes</h2>
          </div>
          <div className="divide-y divide-ink-50">
            {top_margin_products.map((p, i) => (
              <div key={p.sku} className="flex items-center gap-3 px-5 py-3">
                <span className="font-display text-xl font-700 text-ink-200 w-6 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{p.name}</p>
                  <p className="text-xs text-ink-400">{p.category_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`badge ${getMarginBadge(p.margin_percent)}`}>{p.margin_percent}%</span>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">{formatCurrency(p.margin_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent movements */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-50">
            <h2 className="section-title">Movimientos recientes</h2>
          </div>
          <div className="divide-y divide-ink-50">
            {recent_movements.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-400">Sin movimientos registrados</p>
            ) : recent_movements.map(m => {
              const mt = MOVEMENT_TYPES[m.type];
              return (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`w-7 h-7 rounded-full ${mt.bg} ${mt.color} flex items-center justify-center text-sm font-700 shrink-0`}>
                    {mt.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate">{m.product_name}</p>
                    <p className="text-xs text-ink-400">{m.reason || mt.label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-mono font-medium ${mt.color}`}>
                      {m.type === 'salida' ? '-' : '+'}{m.quantity}
                    </p>
                    <p className="text-xs text-ink-300 font-mono">{m.new_stock} total</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
