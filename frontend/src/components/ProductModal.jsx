import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { productsApi } from '../services/api';
import { generateSKU } from '../utils/formatters';
import toast from 'react-hot-toast';
import bwipjs from 'bwip-js';

const DEFAULT_SPECS = {
  'Belleza': [
    { key: 'color', label: 'Color', placeholder: 'Ej: Rojo Pasión' },
    { key: 'tono', label: 'Tono', placeholder: 'Ej: Cálido' },
    { key: 'acabado', label: 'Acabado', placeholder: 'Ej: Matte' },
  ],
  'Gorras': [
    { key: 'talla', label: 'Talla', placeholder: 'Ej: Única ajustable' },
    { key: 'color', label: 'Color', placeholder: 'Ej: Negro' },
    { key: 'estilo', label: 'Estilo', placeholder: 'Ej: Snapback' },
    { key: 'material', label: 'Material', placeholder: 'Ej: 100% algodón' },
  ],
  'Billeteras': [
    { key: 'material', label: 'Material', placeholder: 'Ej: Cuero genuino' },
    { key: 'color', label: 'Color', placeholder: 'Ej: Negro' },
    { key: 'compartimentos', label: 'Compartimentos', placeholder: 'Ej: 8' },
  ],
  'Peluches': [
    { key: 'tamanio', label: 'Tamaño', placeholder: 'Ej: 40cm' },
    { key: 'color', label: 'Color', placeholder: 'Ej: Marrón' },
    { key: 'material', label: 'Material', placeholder: 'Ej: Peluche suave' },
  ],
  'Electrónica': [
    { key: 'voltaje', label: 'Voltaje', placeholder: 'Ej: 100-240V' },
    { key: 'tipo', label: 'Tipo', placeholder: 'Ej: Rotativa' },
    { key: 'carga', label: 'Carga', placeholder: 'Ej: USB-C' },
    { key: 'impermeable', label: 'Impermeable', placeholder: 'Sí / No' },
  ],
};

export default function ProductModal({ product, onClose, onSaved }) {
  const { categories } = useApp();
  const isEdit = !!product?.id;

  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: categories[0]?.id || '',
    description: '',
    cost_price: '',
    sale_price: '',
    stock: '',
    unit: 'unidad',
    brand: '',
    supplier: '',
    specifications: {},
  });

  const [specKeys, setSpecKeys] = useState([]);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [barcodePreview, setBarcodePreview] = useState(null);
  const barcodeCanvasRef = useRef(null);

  const selectedCategory = categories.find(c => c.id === parseInt(form.category_id));
  const categorySpecs = DEFAULT_SPECS[selectedCategory?.name] || [];

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category_id: product.category_id || categories[0]?.id || '',
        description: product.description || '',
        cost_price: product.cost_price || '',
        sale_price: product.sale_price || '',
        stock: product.stock ?? '',
        unit: product.unit || 'unidad',
        brand: product.brand || '',
        supplier: product.supplier || '',
        specifications: product.specifications || {},
      });
      setSpecKeys(Object.keys(product.specifications || {}));
    }
  }, [product, categories]);

  useEffect(() => {
    if (!isEdit) {
      setForm(f => ({ ...f, sku: generateSKU(selectedCategory?.name) }));
      const defaultKeys = categorySpecs.map(s => s.key);
      setSpecKeys(defaultKeys);
      setForm(f => ({
        ...f,
        specifications: Object.fromEntries(defaultKeys.map(k => [k, f.specifications[k] || '']))
      }));
    }
  }, [form.category_id, isEdit]);

  // Generar vista previa del código de barras
  useEffect(() => {
    if (form.barcode && barcodeCanvasRef.current) {
      try {
        bwipjs.toCanvas(barcodeCanvasRef.current, {
          bcid: 'code128',
          text: form.barcode,
          scale: 3,
          height: 10,
          includetext: true,
          textxalign: 'center',
        });
        setBarcodePreview(true);
      } catch (err) {
        setBarcodePreview(false);
      }
    } else {
      setBarcodePreview(null);
    }
  }, [form.barcode]);

  const generateBarcode = () => {
    // Generar código basado en timestamp + números aleatorios (12 dígitos)
    const base = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const code = base + random;
    setForm(f => ({ ...f, barcode: code }));
  };

  const margin = form.sale_price && form.cost_price
    ? Math.round(((form.sale_price - form.cost_price) / form.sale_price) * 100)
    : null;

  const handleSpec = (key, value) => {
    setForm(f => ({ ...f, specifications: { ...f.specifications, [key]: value } }));
  };

  const addCustomSpec = () => {
    if (!newSpecKey.trim()) return;
    const k = newSpecKey.trim().toLowerCase().replace(/\s+/g, '_');
    if (!specKeys.includes(k)) {
      setSpecKeys(prev => [...prev, k]);
      setForm(f => ({ ...f, specifications: { ...f.specifications, [k]: '' } }));
    }
    setNewSpecKey('');
  };

  const removeSpec = (key) => {
    setSpecKeys(prev => prev.filter(k => k !== key));
    setForm(f => {
      const specs = { ...f.specifications };
      delete specs[key];
      return { ...f, specifications: specs };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        category_id: parseInt(form.category_id),
        cost_price: parseFloat(form.cost_price),
        sale_price: parseFloat(form.sale_price),
        stock: parseInt(form.stock),
        specifications: Object.fromEntries(
          Object.entries(form.specifications).filter(([, v]) => v !== '')
        ),
      };

      if (isEdit) {
        await productsApi.update(product.id, payload);
        toast.success('Producto actualizado');
      } else {
        await productsApi.create(payload);
        toast.success('Producto creado');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
          <div>
            <h2 className="font-display font-700 text-lg text-ink-900">
              {isEdit ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <p className="text-ink-400 text-xs mt-0.5">
              {isEdit ? `SKU: ${product.sku}` : 'Completa los datos del producto'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost text-ink-400 hover:text-ink-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre del producto *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Labial Matte Premium"
                required
              />
            </div>

            <div>
              <label className="label">SKU</label>
              <input
                className="input-field font-mono text-xs"
                value={form.sku}
                onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                placeholder="Ej: BEL-001"
              />
            </div>

            <div className="col-span-2">
              <label className="label">Código de barras (Code 128)</label>
              <div className="flex gap-2">
                <input
                  className="input-field font-mono text-xs flex-1"
                  value={form.barcode}
                  onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                  placeholder="Ej: 123456789012"
                />
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="btn-secondary text-xs whitespace-nowrap"
                  title="Generar código automáticamente"
                >
                  🔄 Generar
                </button>
              </div>
              {barcodePreview !== null && form.barcode && (
                <div className="mt-2 flex items-center justify-center bg-white border border-ink-100 rounded-lg p-2">
                  <canvas ref={barcodeCanvasRef} className={barcodePreview ? '' : 'hidden'} />
                  {!barcodePreview && (
                    <p className="text-xs text-coral-500">Código inválido para Code 128</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="label">Categoría *</label>
              <select
                className="input-field"
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                required
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Marca</label>
              <input
                className="input-field"
                value={form.brand}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                placeholder="Ej: L'Oréal"
              />
            </div>

            <div>
              <label className="label">Proveedor</label>
              <input
                className="input-field"
                value={form.supplier}
                onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                placeholder="Ej: Distribuidora X"
              />
            </div>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción del producto..."
            />
          </div>

          {/* Pricing */}
          <div className="bg-ink-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Precios y stock</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Costo *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-xs">$</span>
                  <input
                    type="number"
                    className="input-field pl-6"
                    value={form.cost_price}
                    onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Precio venta *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-xs">$</span>
                  <input
                    type="number"
                    className="input-field pl-6"
                    value={form.sale_price}
                    onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Stock {!isEdit && '*'}</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="0"
                  min="0"
                  required={!isEdit}
                />
              </div>
            </div>

            {margin !== null && (
              <div className={`mt-3 inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg ${margin >= 40 ? 'bg-sage-100 text-sage-700' : margin >= 20 ? 'bg-amber-100 text-amber-700' : 'bg-coral-100 text-coral-700'}`}>
                <span>Margen de ganancia:</span>
                <span className="font-700 font-mono">{margin}%</span>
                {margin < 20 && <span>⚠️ Margen bajo</span>}
              </div>
            )}
          </div>

          {/* Dynamic specifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                Especificaciones {selectedCategory && `· ${selectedCategory.icon} ${selectedCategory.name}`}
              </p>
            </div>

            {specKeys.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {specKeys.map(key => {
                  const preset = categorySpecs.find(s => s.key === key);
                  return (
                    <div key={key} className="relative">
                      <label className="label">{preset?.label || key}</label>
                      <div className="flex gap-1">
                        <input
                          className="input-field"
                          value={form.specifications[key] || ''}
                          onChange={e => handleSpec(key, e.target.value)}
                          placeholder={preset?.placeholder || `Valor para ${key}`}
                        />
                        {!preset && (
                          <button type="button" onClick={() => removeSpec(key)} className="text-ink-300 hover:text-coral-500 px-2">✕</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <input
                className="input-field text-xs"
                value={newSpecKey}
                onChange={e => setNewSpecKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSpec())}
                placeholder="Nombre del atributo personalizado..."
              />
              <button type="button" onClick={addCustomSpec} className="btn-secondary text-xs shrink-0">
                + Agregar
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-ink-100">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
              ) : (
                <>{isEdit ? '✓ Actualizar' : '+ Crear producto'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
