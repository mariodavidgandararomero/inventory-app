import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '../services/api';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getMarginBadge, getStockBadge } from '../utils/formatters';
import ProductModal from '../components/ProductModal';
import StockModal from '../components/StockModal';
import toast from 'react-hot-toast';

export default function Products() {
  const { categories } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [lowStockFilter, setLowStockFilter] = useState(searchParams.get('low_stock') === 'true');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const searchRef = useRef(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category_id = categoryFilter;
      if (lowStockFilter) params.low_stock = 'true';

      const res = await productsApi.getAll(params);
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Error cargando productos');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, lowStockFilter]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const handleDelete = async (id) => {
    try {
      await productsApi.delete(id);
      toast.success('Producto eliminado');
      loadProducts();
    } catch (err) {
      toast.error(err.message);
    }
    setDeleteConfirm(null);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleStockUpdate = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setLowStockFilter(false);
  };

  const hasFilters = search || categoryFilter || lowStockFilter;

  return (
    <div className="space-y-5 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="text-ink-400 text-sm mt-0.5">
            {pagination.total} producto{pagination.total !== 1 ? 's' : ''} total{pagination.total !== 1 ? 'es' : ''}
            {hasFilters && <span className="text-sage-600"> · Filtros activos</span>}
          </p>
        </div>
        <button
          onClick={() => { setSelectedProduct(null); setShowProductModal(true); }}
          className="btn-primary"
        >
          + Nuevo producto
        </button>
      </div>

      {/* Search & Filters bar */}
      <div className="card p-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 text-sm">⌕</span>
            <input
              ref={searchRef}
              className="input-field pl-9 bg-ink-50 border-transparent focus:bg-white focus:border-ink-300"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU, marca..."
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600"
              >✕</button>
            )}
          </div>

          {/* Category filter */}
          <select
            className="input-field w-auto min-w-36"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>

          {/* Low stock toggle */}
          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              lowStockFilter
                ? 'bg-coral-50 border-coral-200 text-coral-700'
                : 'bg-white border-ink-200 text-ink-500 hover:border-ink-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            Stock bajo
          </button>

          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-xs text-ink-400">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Products table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-ink-400">
            <div className="w-5 h-5 border-2 border-ink-200 border-t-ink-500 rounded-full animate-spin" />
            <span className="text-sm">Cargando...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-3">📦</span>
            <p className="font-medium text-ink-600">Sin productos</p>
            <p className="text-sm text-ink-400 mt-1">
              {hasFilters ? 'Intenta con otros filtros' : 'Crea tu primer producto'}
            </p>
            {!hasFilters && (
              <button
                onClick={() => { setSelectedProduct(null); setShowProductModal(true); }}
                className="btn-primary mt-4"
              >
                + Crear producto
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-ink-50/50 text-xs font-semibold text-ink-400 uppercase tracking-wider border-b border-ink-100">
              <div className="col-span-4">Producto</div>
              <div className="col-span-1 text-center">Stock</div>
              <div className="col-span-2 text-right">Costo</div>
              <div className="col-span-2 text-right">Precio</div>
              <div className="col-span-1 text-center">Margen</div>
              <div className="col-span-2 text-right">Acciones</div>
            </div>

            <div className="divide-y divide-ink-50">
              {products.map(p => {
                const stockBadge = getStockBadge(p.stock, p.low_stock_threshold);
                const isExpanded = expandedProduct === p.id;
                const isLowStock = p.is_low_stock;

                return (
                  <div key={p.id} className={isLowStock ? 'low-stock-row' : ''}>
                    <div
                      className={`grid grid-cols-12 gap-3 px-5 py-3.5 table-row items-center cursor-pointer`}
                      onClick={() => setExpandedProduct(isExpanded ? null : p.id)}
                    >
                      {/* Product info */}
                      <div className="col-span-6 md:col-span-4 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${isLowStock ? 'bg-coral-50' : 'bg-ink-50'}`}>
                          {p.category_icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink-800 truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs text-ink-400">{p.sku}</span>
                            {p.brand && <span className="text-xs text-ink-300">· {p.brand}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Stock */}
                      <div className="col-span-2 md:col-span-1 flex justify-center">
                        <span className={`badge ${stockBadge.cls} font-mono`}>{p.stock}</span>
                      </div>

                      {/* Prices */}
                      <div className="hidden md:block col-span-2 text-right">
                        <p className="text-sm font-mono text-ink-600">{formatCurrency(p.cost_price)}</p>
                      </div>
                      <div className="hidden md:block col-span-2 text-right">
                        <p className="text-sm font-mono font-medium text-ink-800">{formatCurrency(p.sale_price)}</p>
                      </div>

                      {/* Margin */}
                      <div className="hidden md:flex col-span-1 justify-center">
                        <span className={`badge ${getMarginBadge(p.margin_percent)}`}>
                          {p.margin_percent}%
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleStockUpdate(p)}
                          className="btn-ghost text-xs py-1 px-2"
                          title="Mover stock"
                        >
                          ⇅
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          className="btn-ghost text-xs py-1 px-2"
                          title="Editar"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p.id)}
                          className="btn-ghost text-xs py-1 px-2 hover:text-coral-500"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-5 pb-4 bg-ink-50/30 border-t border-ink-50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                          <div>
                            <p className="text-xs text-ink-400 mb-1">Categoría</p>
                            <p className="text-sm font-medium">{p.category_icon} {p.category_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-400 mb-1">Proveedor</p>
                            <p className="text-sm">{p.supplier || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-400 mb-1">Ganancia por unidad</p>
                            <p className="text-sm font-mono font-medium text-sage-600">{formatCurrency(p.margin_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-400 mb-1">Actualizado</p>
                            <p className="text-xs text-ink-500">{formatDate(p.updated_at)}</p>
                          </div>
                        </div>

                        {/* Specifications */}
                        {Object.keys(p.specifications || {}).length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Especificaciones</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(p.specifications).map(([k, v]) => v && (
                                <span key={k} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-ink-100 rounded-lg text-xs text-ink-600">
                                  <span className="text-ink-400 capitalize">{k}:</span>
                                  <span className="font-medium">{v}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {p.description && (
                          <p className="mt-3 text-xs text-ink-500 italic">{p.description}</p>
                        )}
                      </div>
                    )}

                    {/* Delete confirm */}
                    {deleteConfirm === p.id && (
                      <div className="px-5 py-3 bg-coral-50 border-t border-coral-100 flex items-center justify-between gap-3">
                        <p className="text-sm text-coral-700 font-medium">
                          ¿Eliminar "{p.name}"? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-xs">Cancelar</button>
                          <button onClick={() => handleDelete(p.id)} className="btn-danger text-xs">Eliminar</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setShowProductModal(false)}
          onSaved={loadProducts}
        />
      )}
      {showStockModal && selectedProduct && (
        <StockModal
          product={selectedProduct}
          onClose={() => setShowStockModal(false)}
          onSaved={loadProducts}
        />
      )}
    </div>
  );
}
