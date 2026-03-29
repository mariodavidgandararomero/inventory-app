export const formatCurrency = (value, currency = 'COP') => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-CO').format(value);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateStr));
};

export const getMarginColor = (margin) => {
  if (margin >= 50) return 'text-sage-600';
  if (margin >= 30) return 'text-amber-600';
  if (margin >= 15) return 'text-amber-500';
  return 'text-coral-500';
};

export const getMarginBadge = (margin) => {
  if (margin >= 50) return 'bg-sage-100 text-sage-700';
  if (margin >= 30) return 'bg-amber-100 text-amber-700';
  if (margin >= 15) return 'bg-amber-50 text-amber-600';
  return 'bg-coral-100 text-coral-600';
};

export const getStockBadge = (stock, threshold) => {
  if (stock === 0) return { label: 'Sin stock', cls: 'bg-coral-100 text-coral-700' };
  if (stock <= threshold) return { label: 'Stock bajo', cls: 'bg-amber-100 text-amber-700' };
  return { label: 'En stock', cls: 'bg-sage-100 text-sage-700' };
};

export const generateSKU = (categoryName) => {
  const prefix = categoryName?.slice(0, 3).toUpperCase() || 'PRD';
  return `${prefix}-${Date.now().toString().slice(-6)}`;
};

export const MOVEMENT_TYPES = {
  entrada: { label: 'Entrada', color: 'text-sage-600', bg: 'bg-sage-100', icon: '↑' },
  salida: { label: 'Salida', color: 'text-coral-500', bg: 'bg-coral-100', icon: '↓' },
  ajuste: { label: 'Ajuste', color: 'text-amber-600', bg: 'bg-amber-100', icon: '⟳' },
};
