import React, { useState } from 'react';
import { categoriesApi } from '../services/api';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const ICONS = ['💄', '🧸', '👛', '🧢', '🔌', '👗', '💍', '👟', '🎒', '📱', '🧴', '🪮', '🕶️', '⌚', '📦'];

function CategoryForm({ cat, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: cat?.name || '',
    description: cat?.description || '',
    icon: cat?.icon || '📦',
    low_stock_threshold: cat?.low_stock_threshold || 5,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (cat?.id) {
        await categoriesApi.update(cat.id, form);
        toast.success('Categoría actualizada');
      } else {
        await categoriesApi.create(form);
        toast.success('Categoría creada');
      }
      onSave();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nombre *</label>
        <input
          className="input-field"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Ej: Bisutería"
          required
        />
      </div>

      <div>
        <label className="label">Ícono</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {ICONS.map(icon => (
            <button
              key={icon}
              type="button"
              onClick={() => setForm(f => ({ ...f, icon }))}
              className={`w-9 h-9 text-xl rounded-lg border-2 transition-all ${
                form.icon === icon ? 'border-ink-700 bg-ink-50' : 'border-transparent hover:border-ink-200'
              }`}
            >
              {icon}
            </button>
          ))}
          <input
            className="w-14 h-9 input-field text-center text-xl p-1"
            value={form.icon}
            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
            maxLength={2}
          />
        </div>
      </div>

      <div>
        <label className="label">Descripción</label>
        <input
          className="input-field"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Descripción breve de la categoría..."
        />
      </div>

      <div>
        <label className="label">Umbral de stock bajo</label>
        <input
          type="number"
          className="input-field w-32"
          value={form.low_stock_threshold}
          onChange={e => setForm(f => ({ ...f, low_stock_threshold: parseInt(e.target.value) }))}
          min="0"
          max="100"
        />
        <p className="text-xs text-ink-400 mt-1">Se mostrará alerta cuando el stock sea ≤ este número</p>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-ink-100">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
            : cat?.id ? '✓ Actualizar' : '+ Crear categoría'
          }
        </button>
      </div>
    </form>
  );
}

export default function Categories() {
  const { categories, loadCategories } = useApp();
  const [editing, setEditing] = useState(null); // null = no form, -1 = new, id = edit
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDelete = async (id) => {
    try {
      await categoriesApi.delete(id);
      toast.success('Categoría eliminada');
      loadCategories();
    } catch (err) {
      toast.error(err.message);
    }
    setDeleteConfirm(null);
  };

  const handleSaved = () => {
    loadCategories();
    setEditing(null);
  };

  return (
    <div className="space-y-5 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="text-ink-400 text-sm mt-0.5">{categories.length} categorías configuradas</p>
        </div>
        <button
          onClick={() => setEditing(-1)}
          className="btn-primary"
          disabled={editing === -1}
        >
          + Nueva categoría
        </button>
      </div>

      {/* New category form */}
      {editing === -1 && (
        <div className="card p-5 animate-slide-in">
          <h2 className="section-title mb-4">Nueva categoría</h2>
          <CategoryForm onSave={handleSaved} onCancel={() => setEditing(null)} />
        </div>
      )}

      {/* Categories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="card overflow-hidden">
            {editing === cat.id ? (
              <div className="p-5">
                <h2 className="section-title mb-4">Editar {cat.name}</h2>
                <CategoryForm cat={cat} onSave={handleSaved} onCancel={() => setEditing(null)} />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 p-5">
                  <div className="w-12 h-12 bg-ink-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                    {cat.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-ink-800">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-xs text-ink-400 mt-0.5">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(cat.id)} className="btn-ghost text-xs py-1 px-2">✎</button>
                    <button
                      onClick={() => setDeleteConfirm(cat.id)}
                      className="btn-ghost text-xs py-1 px-2 hover:text-coral-500"
                    >✕</button>
                  </div>
                </div>

                <div className="flex items-center gap-0 border-t border-ink-50">
                  <div className="flex-1 px-5 py-3 text-center border-r border-ink-50">
                    <p className="font-display font-700 text-xl text-ink-900">{cat.product_count}</p>
                    <p className="text-xs text-ink-400">Productos</p>
                  </div>
                  <div className="flex-1 px-5 py-3 text-center">
                    <p className="font-display font-700 text-xl text-ink-900">{cat.low_stock_threshold}</p>
                    <p className="text-xs text-ink-400">Umbral mínimo</p>
                  </div>
                </div>

                {deleteConfirm === cat.id && (
                  <div className="px-5 py-3 bg-coral-50 border-t border-coral-100 flex items-center justify-between gap-3">
                    <p className="text-sm text-coral-700 font-medium">¿Eliminar categoría?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-xs">Cancelar</button>
                      <button onClick={() => handleDelete(cat.id)} className="btn-danger text-xs">Eliminar</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
