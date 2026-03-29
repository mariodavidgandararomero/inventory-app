# 📦 Inventario Multicanal

Sistema de gestión de inventario profesional para negocio multicanal de belleza, peluches, billeteras, gorras y pequeña electrónica.

![Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js) ![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite) ![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)

---

## ✨ Funcionalidades

| Módulo | Descripción |
|---|---|
| **Panel de control** | KPIs en tiempo real, alertas de stock bajo, movimientos recientes, mejores márgenes |
| **Inventario** | CRUD completo de productos con buscador global y filtros por categoría |
| **Stock** | Registro de entradas, salidas y ajustes con historial |
| **Categorías** | CRUD de categorías con ícono y umbral de stock configurable |
| **Especificaciones dinámicas** | Atributos JSON por producto (voltaje, color, talla, etc.) |
| **Márgenes** | Cálculo automático de margen de ganancia por producto |
| **Alertas** | Productos con stock bajo resaltados en rojo en toda la app |

---

## 🗂️ Estructura del proyecto

```
inventory-app/
├── backend/
│   ├── server.js          # API REST con Express
│   ├── database.js        # Inicialización SQLite + datos de prueba
│   └── package.json
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Sidebar.jsx       # Navegación lateral
│       │   ├── ProductModal.jsx  # Formulario crear/editar producto
│       │   └── StockModal.jsx    # Formulario movimientos de stock
│       ├── context/
│       │   └── AppContext.jsx    # Estado global (categorías, sidebar)
│       ├── pages/
│       │   ├── Dashboard.jsx     # Panel de control
│       │   ├── Products.jsx      # Lista de inventario
│       │   └── Categories.jsx    # Gestión de categorías
│       ├── services/
│       │   └── api.js            # Capa de comunicación con backend
│       └── utils/
│           └── formatters.js     # Formatos de moneda, fecha, colores
└── package.json           # Scripts para arrancar todo junto
```

---

## 🚀 Instalación y puesta en marcha

### Prerrequisitos
- **Node.js** v18 o superior → [descargar](https://nodejs.org)
- **npm** v9+ (viene con Node)

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/inventory-app.git
cd inventory-app
```

### 2. Instalar dependencias
```bash
# Opción A — instalar todo de una vez
npm install
npm run install:all

# Opción B — manualmente
cd backend && npm install
cd ../frontend && npm install
```

### 3. Arrancar en desarrollo

**Opción A — ambos servidores juntos (recomendado):**
```bash
npm run dev
```

**Opción B — por separado en terminales distintas:**
```bash
# Terminal 1 — Backend (puerto 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (puerto 3000)
cd frontend
npm start
```

### 4. Abrir en el navegador
```
http://localhost:3000
```

La base de datos SQLite se crea automáticamente en `backend/inventory.db` con **12 productos de ejemplo** en 5 categorías.

---

## 🗄️ Esquema de base de datos

```sql
categories       -- Categorías con umbral de stock configurable
products         -- Productos con campo JSON 'specifications' para atributos dinámicos
stock_movements  -- Historial de entradas, salidas y ajustes
sales_channels   -- Canales de venta (tienda, Instagram, web, WhatsApp)
```

### Campo `specifications` (JSON dinámico)

Cada categoría sugiere atributos predeterminados, pero puedes agregar cualquier atributo personalizado:

```json
// Máquina de afeitar (Electrónica)
{ "voltaje": "100-240V", "tipo": "Rotativa", "cabezas": 3, "carga": "USB-C", "impermeable": "Sí" }

// Gorra
{ "talla": "Única ajustable", "color": "Negro", "estilo": "Snapback", "material": "100% algodón" }

// Labial (Belleza)
{ "color": "Rojo Pasión", "tono": "Cálido", "acabado": "Matte" }
```

---

## 🌐 API REST

Base URL: `http://localhost:3001/api`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/dashboard` | KPIs, alertas, estadísticas |
| GET | `/products` | Lista con filtros (search, category_id, low_stock) |
| POST | `/products` | Crear producto |
| PUT | `/products/:id` | Actualizar producto |
| DELETE | `/products/:id` | Eliminar (soft delete) |
| POST | `/products/:id/stock` | Movimiento de stock |
| GET | `/categories` | Listar categorías con conteo |
| POST | `/categories` | Crear categoría |
| PUT | `/categories/:id` | Actualizar categoría |
| DELETE | `/categories/:id` | Eliminar categoría |

---

## 🛠️ Tecnologías utilizadas

**Backend**
- [Express.js](https://expressjs.com/) — framework HTTP
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — SQLite síncrono de alto rendimiento
- [express-validator](https://express-validator.github.io/) — validación de entradas

**Frontend**
- [React 18](https://react.dev/) — UI declarativa
- [Tailwind CSS 3](https://tailwindcss.com/) — estilos utilitarios
- [React Router 6](https://reactrouter.com/) — navegación SPA
- [Axios](https://axios-http.com/) — cliente HTTP
- [react-hot-toast](https://react-hot-toast.com/) — notificaciones
- Fuentes: [Syne](https://fonts.google.com/specimen/Syne) + [DM Sans](https://fonts.google.com/specimen/DM+Sans) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

---

## 📈 Próximas mejoras sugeridas

- [ ] Autenticación con JWT (múltiples usuarios / roles)
- [ ] Exportar inventario a Excel / CSV
- [ ] Registro de ventas por canal
- [ ] Gráficas de evolución de stock (Recharts)
- [ ] Fotos de productos (upload a Cloudinary)
- [ ] API de notificaciones (email/WhatsApp cuando stock baja)
- [ ] Modo oscuro
- [ ] PWA para uso en móvil offline

---

## 📄 Licencia

MIT — libre para uso personal y comercial.

---

> Desarrollado con React + Node.js + SQLite · Diseño de interfaz con Tailwind CSS
