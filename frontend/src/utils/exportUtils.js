import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './formatters';

/**
 * Exporta datos del inventario a archivo Excel (.xlsx)
 * @param {Array} products - Array de productos a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export const exportToExcel = (products, filename = 'inventario') => {
  // Preparar datos para Excel
  const data = products.map(p => ({
    'SKU': p.sku,
    'Nombre': p.name,
    'Categoría': p.category_name,
    'Marca': p.brand || '—',
    'Proveedor': p.supplier || '—',
    'Stock Actual': p.stock,
    'Stock Mínimo': p.low_stock_threshold,
    'Costo Unitario': p.cost_price,
    'Precio Venta': p.sale_price,
    'Margen (%)': p.margin_percent,
    'Ganancia Unit.': p.margin_amount,
    'Estado Stock': p.is_low_stock ? 'Stock Bajo' : 'Normal',
    'Última Act.': formatDate(p.updated_at)
  }));

  // Crear worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajustar ancho de columnas
  const colWidths = [
    { wch: 12 }, // SKU
    { wch: 30 }, // Nombre
    { wch: 20 }, // Categoría
    { wch: 15 }, // Marca
    { wch: 20 }, // Proveedor
    { wch: 12 }, // Stock
    { wch: 12 }, // Stock Mínimo
    { wch: 15 }, // Costo
    { wch: 15 }, // Precio
    { wch: 10 }, // Margen
    { wch: 15 }, // Ganancia
    { wch: 12 }, // Estado
    { wch: 18 }  // Fecha
  ];
  ws['!cols'] = colWidths;

  // Estilos para el header
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '5DA280' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }

  // Crear workbook y agregar worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

  // Agregar metadata
  wb.Props = {
    Title: 'Inventario - Exportación',
    Author: 'Sistema de Inventario',
    CreatedDate: new Date()
  };

  // Descargar archivo
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Exporta datos del inventario a archivo CSV
 * @param {Array} products - Array de productos a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export const exportToCSV = (products, filename = 'inventario') => {
  // Encabezados CSV
  const headers = [
    'SKU',
    'Nombre',
    'Categoría',
    'Marca',
    'Proveedor',
    'Stock Actual',
    'Stock Mínimo',
    'Costo Unitario',
    'Precio Venta',
    'Margen (%)',
    'Ganancia Unit.',
    'Estado Stock',
    'Última Act.'
  ];

  // Convertir datos a formato CSV
  const csvRows = products.map(p => [
    p.sku,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${(p.category_name || '').replace(/"/g, '""')}"`,
    `"${(p.brand || '—').replace(/"/g, '""')}"`,
    `"${(p.supplier || '—').replace(/"/g, '""')}"`,
    p.stock,
    p.low_stock_threshold,
    p.cost_price,
    p.sale_price,
    p.margin_percent,
    p.margin_amount,
    p.is_low_stock ? 'Stock Bajo' : 'Normal',
    formatDate(p.updated_at)
  ]);

  // Unir headers y filas
  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  // Crear blob y descargar
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Genera un resumen estadístico del inventario para Excel
 * @param {Array} products - Array de productos
 */
export const generateInventorySummary = (products) => {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.cost_price * p.stock), 0);
  const totalPotentialRevenue = products.reduce((sum, p) => sum + (p.sale_price * p.stock), 0);
  const lowStockCount = products.filter(p => p.is_low_stock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const avgMargin = products.reduce((sum, p) => sum + p.margin_percent, 0) / totalProducts || 0;

  return {
    totalProducts,
    totalStock,
    totalValue,
    totalPotentialRevenue,
    lowStockCount,
    outOfStockCount,
    avgMargin: avgMargin.toFixed(2)
  };
};
