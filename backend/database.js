const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
<<<<<<< HEAD
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'inventory.db');
let _db = null;

=======

const DB_PATH = path.join(__dirname, 'inventory.db');

let _db = null;

// Persiste el archivo en disco cada vez que se escribe
>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e
function saveDb() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initializeDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    _db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    _db = new SQL.Database();
  }

  _db.run('PRAGMA foreign_keys = ON;');

<<<<<<< HEAD
  // ── Tablas principales ────────────────────────────────────────────────────
  _db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      permissions TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

=======
  _db.run(`
>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT DEFAULT '📦',
      low_stock_threshold INTEGER DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
<<<<<<< HEAD

=======
>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      category_id INTEGER NOT NULL,
      description TEXT,
      cost_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      unit TEXT DEFAULT 'unidad',
      brand TEXT,
      supplier TEXT,
      specifications TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );
<<<<<<< HEAD

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER,
=======
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reason TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
<<<<<<< HEAD
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

=======
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e
    CREATE TABLE IF NOT EXISTS sales_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      platform TEXT,
      commission_rate REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );
  `);

<<<<<<< HEAD
  // ── Seed solo si está vacía ────────────────────────────────────────────────
  const roleCount = _db.exec('SELECT COUNT(*) c FROM roles')[0]?.values[0][0] || 0;

  if (roleCount === 0) {
    // ── Roles con permisos granulares ─────────────────────────────────────
    const adminPerms = JSON.stringify([
      'dashboard.view',
      'products.view', 'products.create', 'products.edit', 'products.delete',
      'stock.move',
      'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
      'users.view', 'users.create', 'users.edit', 'users.delete',
    ]);
    const managerPerms = JSON.stringify([
      'dashboard.view',
      'products.view', 'products.create', 'products.edit',
      'stock.move',
      'categories.view', 'categories.create', 'categories.edit',
      'users.view',
    ]);
    const viewerPerms = JSON.stringify([
      'dashboard.view',
      'products.view',
      'categories.view',
    ]);

    _db.run(`INSERT INTO roles (name, description, permissions) VALUES
      ('admin',   'Acceso total al sistema',                    '${adminPerms}'),
      ('manager', 'Gestión de inventario sin administrar usuarios', '${managerPerms}'),
      ('viewer',  'Solo lectura del inventario',                '${viewerPerms}');
    `);

    // ── Usuarios de prueba ─────────────────────────────────────────────────
    const hash = (pw) => bcrypt.hashSync(pw, 10);
    _db.run(`INSERT INTO users (name, email, password_hash, role_id) VALUES
      ('Administrador', 'admin@inventario.com',   '${hash('admin123')}',   1),
      ('Gerente Tienda', 'manager@inventario.com', '${hash('manager123')}', 2),
      ('Vendedor',       'viewer@inventario.com',  '${hash('viewer123')}',  3);
    `);

    // ── Categorías ─────────────────────────────────────────────────────────
=======
  // Seed solo si la base está vacía
  const catCount = _db.exec('SELECT COUNT(*) c FROM categories')[0]?.values[0][0] || 0;
  if (catCount === 0) {
>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e
    _db.run(`INSERT INTO categories (name,description,icon,low_stock_threshold) VALUES
      ('Belleza','Productos de cuidado personal y cosméticos','💄',5),
      ('Peluches','Juguetes de peluche y figuras blandas','🧸',3),
      ('Billeteras','Billeteras, monederos y accesorios de cuero','👛',4),
      ('Gorras','Gorras, sombreros y accesorios de cabeza','🧢',5),
<<<<<<< HEAD
      ('Electrónica','Pequeños dispositivos electrónicos y accesorios','🔌',3);
    `);

    // ── Productos ──────────────────────────────────────────────────────────
=======
      ('Electrónica','Pequeños dispositivos electrónicos y accesorios','🔌',3),
      ('Chatarra','Cobre, hierro, platino y plastico','🛞',3);
    `);

>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e
    const prods = [
      ['Labial Matte Premium','BEL-001',1,'Labial de larga duración con acabado matte',8500,18000,45,'Ruby Rose','Distribuidora Belleza Total',JSON.stringify({color:'Rojo Pasión',tono:'Cálido',duracion:'8 horas',acabado:'Matte'})],
      ['Base de maquillaje HD','BEL-002',1,'Base líquida con cobertura total y protección solar',22000,48000,12,"L'Oréal",'Distribuidora Belleza Total',JSON.stringify({tono:'Beige Natural',spf:'SPF 30',cobertura:'Total',tipo_piel:'Mixta'})],
      ['Paleta de sombras Smokey','BEL-003',1,'Paleta con 18 tonos para ojos ahumados',15000,32000,4,'NYX','Cosméticos del Norte',JSON.stringify({colores:18,acabado:'Mixto',tono:'Neutrales y oscuros'})],
      ['Oso Teddy Grande','PEL-001',2,'Peluche de oso suave con relleno premium 40cm',25000,55000,8,'Importaciones Ternura','Mayorista Juguetes SAS',JSON.stringify({tamanio:'40cm',material:'Peluche suave',color:'Marrón',edad_recomendada:'3+ años'})],
      ['Unicornio Arcoíris','PEL-002',2,'Peluche de unicornio colorido con cuerno brillante 30cm',18000,42000,2,'DreamToys','Mayorista Juguetes SAS',JSON.stringify({tamanio:'30cm',color:'Multicolor',caracteristica:'Cuerno brillante',material:'Ultra suave'})],
      ['Billetera Cuero Bifold','BIL-001',3,'Billetera clásica de cuero genuino con 8 compartimentos',30000,68000,15,'CueroArt','Marroquinería Nacional',JSON.stringify({material:'Cuero genuino',color:'Negro',compartimentos:8,estilo:'Bifold',dimensiones:'10x8cm'})],
      ['Monedero Mini Mujer','BIL-002',3,'Monedero compacto con cierre y espejo interno',12000,28000,22,'FashionBags','Distribuidora Accesorios Modernos',JSON.stringify({material:'Cuero sintético',color:'Rosado',cierre:'Cremallera',incluye:'Espejo pequeño'})],
      ['Gorra Snapback Negra','GOR-001',4,'Gorra estilo snapback ajustable, visera plana',14000,32000,18,'UrbanCap','Textiles y Accesorios Ltda',JSON.stringify({talla:'Única ajustable',color:'Negro',estilo:'Snapback',visera:'Plana',material:'100% algodón'})],
      ['Gorra Béisbol Bordada','GOR-002',4,'Gorra de béisbol con bordado personalizado',16000,38000,3,'SportsCap','Textiles y Accesorios Ltda',JSON.stringify({talla:'Única ajustable',color:'Azul marino',estilo:'Baseball',bordado:'Logo frontal',material:'Twill'})],
      ['Máquina de Afeitar Eléctrica Rotativa','ELE-001',5,'Afeitadora eléctrica de 3 cabezas con carga USB',45000,98000,7,'Philips','Electrónica Distribuciones SAS',JSON.stringify({voltaje:'100-240V',tipo:'Rotativa',cabezas:3,carga:'USB-C',autonomia:'45 min',impermeable:'Sí'})],
      ['Máquina de Afeitar Manual 5 Hojas','ELE-002',5,'Afeitadora manual con 5 hojas y banda lubricante',8000,18000,35,'Gillette','Electrónica Distribuciones SAS',JSON.stringify({hojas:5,banda:'Lubricante con aloe',mango:'Ergonómico',uso:'Desechable',paquete:'2 unidades'})],
      ['Depiladora Facial USB','ELE-003',5,'Mini depiladora facial recargable por USB',28000,62000,1,'Kemei','Electrónica Distribuciones SAS',JSON.stringify({voltaje:'5V USB',uso:'Facial',velocidades:2,carga:'USB',luz_led:'Sí',impermeable:'No'})],
    ];
<<<<<<< HEAD
=======

>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e
    prods.forEach(p => {
      _db.run(
        `INSERT INTO products (name,sku,category_id,description,cost_price,sale_price,stock,brand,supplier,specifications)
         VALUES (?,?,?,?,?,?,?,?,?,?)`, p
      );
    });

<<<<<<< HEAD
    // Movimientos de stock inicial
=======
    // Stock inicial movements
>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e
    const rows = _db.exec('SELECT id, stock FROM products');
    if (rows.length) {
      rows[0].values.forEach(([id, stock]) => {
        if (stock > 0) {
          _db.run(
            `INSERT INTO stock_movements (product_id,type,quantity,previous_stock,new_stock,reason)
             VALUES (?,?,?,?,?,?)`,
            [id, 'entrada', stock, 0, stock, 'Stock inicial']
          );
        }
      });
    }

    _db.run(`INSERT INTO sales_channels (name,platform,commission_rate) VALUES
      ('Tienda Física','Local',0),
      ('Instagram Shop','Instagram',5),
      ('Marketplace Web','WooCommerce',3.5),
      ('WhatsApp Business','WhatsApp',0);
    `);

    saveDb();
<<<<<<< HEAD
    console.log('✅ Base de datos inicializada con usuarios de prueba:');
    console.log('   admin@inventario.com   / admin123   (Admin)');
    console.log('   manager@inventario.com / manager123 (Manager)');
    console.log('   viewer@inventario.com  / viewer123  (Viewer)\n');
  } else {
    // Migración: agregar columna user_id a stock_movements si no existe
    try {
      _db.run('ALTER TABLE stock_movements ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL');
      saveDb();
    } catch (_) { /* columna ya existe */ }
=======
>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e
  }

  return _db;
}

<<<<<<< HEAD
// ── Helpers sincrónicos ────────────────────────────────────────────────────────
=======
// ── Helpers sincrónicos que usa server.js ─────────────────────────────────────
>>>>>>> 840a05bf8c887331db8dfd0079cd05881a25db9e

function all(sql, params = []) {
  if (!_db) throw new Error('DB no inicializada');
  const result = _db.exec(sql, params);
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
}

function get(sql, params = []) {
  return all(sql, params)[0];
}

function run(sql, params = []) {
  if (!_db) throw new Error('DB no inicializada');
  _db.run(sql, params);
  const lastId = _db.exec('SELECT last_insert_rowid() lid')[0].values[0][0];
  const changes = _db.getRowsModified();
  saveDb();
  return { lastInsertRowid: lastId, changes };
}

module.exports = { initializeDatabase, all, get, run, saveDb };
