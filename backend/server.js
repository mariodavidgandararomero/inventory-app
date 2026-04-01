require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { body, param, validationResult } = require('express-validator');
const { initializeDatabase, all, get, run } = require('./database');
const { authenticate, authorize } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// Rutas públicas (sin auth)
app.use('/api/auth', authRoutes);

// Middleware de autenticación global para todo lo demás
app.use('/api', authenticate);

// Rutas de usuarios (solo admin/manager)
app.use('/api/users', usersRoutes);

// CATEGORIES
app.get('/api/categories', authorize('categories.view'), (req, res) => {
  try {
    const categories = all(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      GROUP BY c.id ORDER BY c.name
    `);
    res.json({ success: true, data: categories });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/categories',
  authorize('categories.create'),
  body('name').trim().notEmpty(),
  body('low_stock_threshold').optional().isInt({ min: 0 }),
  validate,
  (req, res) => {
    try {
      const { name, description, icon, low_stock_threshold } = req.body;
      const { lastInsertRowid } = run(
        `INSERT INTO categories (name,description,icon,low_stock_threshold) VALUES (?,?,?,?)`,
        [name, description || null, icon || '📦', low_stock_threshold || 5]
      );
      res.status(201).json({ success: true, data: get('SELECT * FROM categories WHERE id=?', [lastInsertRowid]) });
    } catch (err) {
      if (err.message.includes('UNIQUE')) return res.status(409).json({ success: false, error: 'Nombre de categoría duplicado' });
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

app.put('/api/categories/:id', authorize('categories.edit'), param('id').isInt(), validate, (req, res) => {
  try {
    const { name, description, icon, low_stock_threshold } = req.body;
    if (!get('SELECT id FROM categories WHERE id=?', [req.params.id]))
      return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    run(`UPDATE categories SET
      name=COALESCE(?,name), description=COALESCE(?,description),
      icon=COALESCE(?,icon), low_stock_threshold=COALESCE(?,low_stock_threshold)
      WHERE id=?`, [name, description, icon, low_stock_threshold, req.params.id]);
    res.json({ success: true, data: get('SELECT * FROM categories WHERE id=?', [req.params.id]) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/categories/:id', authorize('categories.delete'), param('id').isInt(), validate, (req, res) => {
  try {
    const { count } = get('SELECT COUNT(*) as count FROM products WHERE category_id=?', [req.params.id]);
    if (count > 0) return res.status(409).json({ success: false, error: 'La categoría tiene productos asociados' });
    run('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Categoría eliminada' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PRODUCTS
app.get('/api/products', authorize('products.view'), (req, res) => {
  try {
    const { search, category_id, low_stock } = req.query;
    let where = ['p.is_active = 1'];
    let params = [];

    if (search) {
      where.push(`(p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)`);
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (category_id) { where.push('p.category_id = ?'); params.push(category_id); }
    if (low_stock === 'true') where.push('p.stock <= c.low_stock_threshold');

    const w = `WHERE ${where.join(' AND ')}`;
    const products = all(`
      SELECT p.*, c.name as category_name, c.icon as category_icon, c.low_stock_threshold,
        ROUND((p.sale_price - p.cost_price) / MAX(p.sale_price,0.01) * 100, 2) as margin_percent,
        ROUND(p.sale_price - p.cost_price, 2) as margin_amount,
        CASE WHEN p.stock <= c.low_stock_threshold THEN 1 ELSE 0 END as is_low_stock
      FROM products p JOIN categories c ON c.id = p.category_id
      ${w} ORDER BY p.updated_at DESC
    `, params).map(p => ({ ...p, specifications: JSON.parse(p.specifications || '{}') }));

    res.json({ success: true, data: products, pagination: { total: products.length, page: 1, limit: products.length, pages: 1 } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/products/:id', authorize('products.view'), param('id').isInt(), validate, (req, res) => {
  try {
    const product = get(`
      SELECT p.*, c.name as category_name, c.icon as category_icon, c.low_stock_threshold,
        ROUND((p.sale_price-p.cost_price)/MAX(p.sale_price,0.01)*100,2) as margin_percent,
        ROUND(p.sale_price-p.cost_price,2) as margin_amount
      FROM products p JOIN categories c ON c.id=p.category_id
      WHERE p.id=? AND p.is_active=1
    `, [req.params.id]);
    if (!product) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    const movements = all(
      `SELECT sm.*, u.name as user_name FROM stock_movements sm
       LEFT JOIN users u ON u.id = sm.user_id
       WHERE sm.product_id=? ORDER BY sm.created_at DESC LIMIT 20`,
      [req.params.id]
    );
    res.json({ success: true, data: { ...product, specifications: JSON.parse(product.specifications || '{}'), movements } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/products',
  authorize('products.create'),
  body('name').trim().notEmpty(),
  body('category_id').isInt(),
  body('cost_price').isFloat({ min: 0 }),
  body('sale_price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  validate,
  (req, res) => {
    try {
      const { name, sku, category_id, description, cost_price, sale_price, stock, unit, brand, supplier, specifications } = req.body;
      const skuVal = sku || `PRD-${Date.now()}`;
      const { lastInsertRowid } = run(
        `INSERT INTO products (name,sku,category_id,description,cost_price,sale_price,stock,unit,brand,supplier,specifications)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [name, skuVal, category_id, description||null, parseFloat(cost_price), parseFloat(sale_price),
         parseInt(stock), unit||'unidad', brand||null, supplier||null, JSON.stringify(specifications||{})]
      );
      if (parseInt(stock) > 0) {
        run(`INSERT INTO stock_movements (product_id,user_id,type,quantity,previous_stock,new_stock,reason)
             VALUES (?,?,?,?,?,?,?)`,
          [lastInsertRowid, req.user.id, 'entrada', parseInt(stock), 0, parseInt(stock), 'Stock inicial']);
      }
      const created = get(`SELECT p.*, c.name as category_name, c.icon as category_icon
        FROM products p JOIN categories c ON c.id=p.category_id WHERE p.id=?`, [lastInsertRowid]);
      res.status(201).json({ success: true, data: { ...created, specifications: JSON.parse(created.specifications||'{}') } });
    } catch (err) {
      if (err.message.includes('UNIQUE')) return res.status(409).json({ success: false, error: 'El SKU ya existe' });
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

app.put('/api/products/:id', authorize('products.edit'), param('id').isInt(), validate, (req, res) => {
  try {
    if (!get('SELECT id FROM products WHERE id=? AND is_active=1', [req.params.id]))
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    const { name, sku, category_id, description, cost_price, sale_price, unit, brand, supplier, specifications } = req.body;
    run(`UPDATE products SET
      name=COALESCE(?,name), sku=COALESCE(?,sku), category_id=COALESCE(?,category_id),
      description=COALESCE(?,description),
      cost_price=COALESCE(?,cost_price), sale_price=COALESCE(?,sale_price),
      unit=COALESCE(?,unit), brand=COALESCE(?,brand), supplier=COALESCE(?,supplier),
      specifications=COALESCE(?,specifications),
      updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [name, sku, category_id ? parseInt(category_id) : null, description,
       cost_price!=null ? parseFloat(cost_price) : null,
       sale_price!=null ? parseFloat(sale_price) : null,
       unit, brand, supplier,
       specifications!=null ? JSON.stringify(specifications) : null,
       req.params.id]);
    const updated = get(`SELECT p.*, c.name as category_name, c.icon as category_icon, c.low_stock_threshold,
      ROUND((p.sale_price-p.cost_price)/MAX(p.sale_price,0.01)*100,2) as margin_percent
      FROM products p JOIN categories c ON c.id=p.category_id WHERE p.id=?`, [req.params.id]);
    res.json({ success: true, data: { ...updated, specifications: JSON.parse(updated.specifications||'{}') } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/products/:id', authorize('products.delete'), param('id').isInt(), validate, (req, res) => {
  try {
    if (!get('SELECT id FROM products WHERE id=? AND is_active=1', [req.params.id]))
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    run('UPDATE products SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// STOCK MOVEMENTS
app.post('/api/products/:id/stock',
  authorize('stock.move'),
  param('id').isInt(),
  body('type').isIn(['entrada', 'salida', 'ajuste']),
  body('quantity').isInt({ min: 1 }),
  validate,
  (req, res) => {
    try {
      const product = get('SELECT * FROM products WHERE id=? AND is_active=1', [req.params.id]);
      if (!product) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
      const { type, quantity, reason, notes } = req.body;
      const qty = parseInt(quantity);
      let newStock = product.stock;
      if (type === 'entrada') newStock += qty;
      else if (type === 'salida') {
        if (qty > product.stock) return res.status(400).json({ success: false, error: `Stock insuficiente. Disponible: ${product.stock}` });
        newStock -= qty;
      } else { newStock = qty; }
      run('UPDATE products SET stock=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [newStock, req.params.id]);
      run(`INSERT INTO stock_movements (product_id,user_id,type,quantity,previous_stock,new_stock,reason,notes)
           VALUES (?,?,?,?,?,?,?,?)`,
        [req.params.id, req.user.id, type, qty, product.stock, newStock, reason||null, notes||null]);
      res.json({ success: true, data: { previous_stock: product.stock, new_stock: newStock, type, quantity: qty } });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }
);

// DASHBOARD
app.get('/api/dashboard', authorize('dashboard.view'), (req, res) => {
  try {
    const { count: total_products } = get('SELECT COUNT(*) count FROM products WHERE is_active=1');
    const { count: total_categories } = get('SELECT COUNT(*) count FROM categories');
    const iv = get('SELECT SUM(stock*cost_price) total_cost, SUM(stock*sale_price) total_sale FROM products WHERE is_active=1');

    const low_stock_products = all(`
      SELECT p.*, c.name as category_name, c.icon as category_icon, c.low_stock_threshold,
        ROUND((p.sale_price-p.cost_price)/MAX(p.sale_price,0.01)*100,2) as margin_percent
      FROM products p JOIN categories c ON c.id=p.category_id
      WHERE p.is_active=1 AND p.stock <= c.low_stock_threshold
      ORDER BY p.stock ASC LIMIT 10
    `).map(p => ({ ...p, specifications: JSON.parse(p.specifications||'{}') }));

    const category_stats = all(`
      SELECT c.name, c.icon, COUNT(p.id) as product_count,
        SUM(p.stock) as total_stock, SUM(p.stock*p.cost_price) as inventory_value,
        AVG(ROUND((p.sale_price-p.cost_price)/MAX(p.sale_price,0.01)*100,2)) as avg_margin
      FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.is_active=1
      GROUP BY c.id ORDER BY inventory_value DESC
    `);

    const recent_movements = all(`
      SELECT sm.*, p.name as product_name, p.sku, u.name as user_name
      FROM stock_movements sm
      JOIN products p ON p.id=sm.product_id
      LEFT JOIN users u ON u.id=sm.user_id
      ORDER BY sm.created_at DESC LIMIT 10
    `);

    const top_margin_products = all(`
      SELECT p.name, p.sku, p.sale_price, p.cost_price, p.stock, c.name as category_name,
        ROUND((p.sale_price-p.cost_price)/MAX(p.sale_price,0.01)*100,2) as margin_percent,
        ROUND(p.sale_price-p.cost_price,2) as margin_amount
      FROM products p JOIN categories c ON c.id=p.category_id
      WHERE p.is_active=1 AND p.sale_price>0
      ORDER BY margin_percent DESC LIMIT 5
    `);

    res.json({ success: true, data: {
      summary: {
        total_products, total_categories,
        low_stock_count: low_stock_products.length,
        inventory_cost_value: iv.total_cost || 0,
        inventory_sale_value: iv.total_sale || 0,
        potential_profit: (iv.total_sale||0) - (iv.total_cost||0)
      },
      low_stock_products, category_stats, recent_movements, top_margin_products
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/health', (_, res) => res.json({ success: true, message: 'API funcionando', timestamp: new Date().toISOString() }));

// Boot
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🔐 JWT Auth activo`);
    console.log(`🌐 API: http://localhost:${PORT}/api\n`);
  });
}).catch(err => {
  console.error('Error iniciando:', err);
  process.exit(1);
});