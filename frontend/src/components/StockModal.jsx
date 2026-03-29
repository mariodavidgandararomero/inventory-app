import React, { useState } from 'react';
import { productsApi } from '../services/api';
import { formatCurrency, MOVEMENT_TYPES } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function StockModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({ type: 'entrada', quantity: '', reason: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const previewStock = () => {
    if (!form.quantity) return product.stock;
    const qty = parseInt(form.quantity);
    if (form.type === 'entrada') return product.stock + qty;
    if (form.type === 'salida') return product.stock - qty;
    return qty; // ajuste
  };

  const REASONS = {
    entrada: ['Compra a proveedor', 'Devolución de cliente', 'Ajuste de inventario', 'Otro'],
    salida: ['Venta', 'Muestra/Promoción', 'Pérdida/Daño', 'Ajuste de inventario', 'Otro'],
    ajuste: ['Conteo físico', 'Corrección de error', 'Otro'],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.type === 'salida' && parseInt(form.quantity) > product.stock) {
      toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }
    setLoading(true);
    try {
      await productsApi.updateStock(product.id, {
        type: form.type,
        quantity: parseInt(form.quantity),
        reason: form.reason,
        notes: form.notes,
      });
      toast.success('Movimiento de stock registrado');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const preview = previewStock();
  const mt = MOVEMENT_TYPES[form.type];

  return (
    <div className="modal-overlay animate-fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-md animate-slide-in">
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
          <div>
            <h2 className="font-display font-700 text-lg text-ink-900">Movimiento de stock</h2>
            <p className="text-ink-400 text-xs mt-0.5 truncate max-w-xs">{product.name}</p>
          </div>
          <button onClick={onClose} className="btn-ghost">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Current stock display */}
          <div className="bg-ink-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-400">Stock actual</p>
              <p className="font-display font-700 text-2xl text-ink-900">{product.stock}</p>
            </div>
            {form.quantity && (
              <>
                <span className={`text-xl font-300 ${mt.color}`}>→</span>
                <div>
                  <p className="text-xs text-ink-400">Nuevo stock</p>
                  <p className={`font-display font-700 text-2xl ${preview < 0 ? 'text-coral-500' : preview <= product.low_stock_threshold ? 'text-amber-500' : 'text-sage-600'}`}>
                    {preview < 0 ? '⚠️' : preview}
                  </p>
                </div>
              </>
            )}
            <div className="text-right">
              <p className="text-xs text-ink-400">{product.category_icon}</p>
              <p className="text-xs text-ink-400">{product.sku}</p>
            </div>
          </div>

          {/* Movement type */}
          <div>
            <label className="label">Tipo de movimiento</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(MOVEMENT_TYPES).map(([type, info]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type, reason: '' }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                    form.type === type
                      ? `border-current ${info.bg} ${info.color}`
                      : 'border-ink-100 text-ink-400 hover:border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  <span className="text-lg">{info.icon}</span>
                  {info.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="label">
              {form.type === 'ajuste' ? 'Nuevo total de stock' : 'Cantidad'}
            </label>
            <input
              type="number"
              className="input-field text-lg font-mono"
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              placeholder="0"
              min="1"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="label">Motivo</label>
            <select
              className="input-field"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            >
              <option value="">Selecciona un motivo...</option>
              {REASONS[form.type].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Notas (opcional)</label>
            <textarea
              className="input-field resize-none text-sm"
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Información adicional..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-ink-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading || !form.quantity} className="btn-primary">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                : `${mt.icon} Registrar ${mt.label.toLowerCase()}`
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
