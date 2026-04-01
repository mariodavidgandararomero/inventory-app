# Inventario Multicanal

Sistema de gestión de inventario profesional para negocio multicanal de belleza, peluches, billeteras, gorras y pequeña electrónica.

![Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js) ![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite) ![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)

---

## Funcionalidades

| Modulo | Descripcion |
|---|---|
| **Panel de control** | KPIs en tiempo real, alertas de stock bajo, movimientos recientes, mejores margenes |
| **Inventario** | CRUD completo de productos con buscador global y filtros por categoria |
| **Stock** | Registro de entradas, salidas y ajustes con historial |
| **Categorias** | CRUD de categorias con icono y umbral de stock configurable |
| **Especificaciones dinamicas** | Atributos JSON por producto (voltaje, color, talla, etc.) |
| **Margenes** | Calculo automatico de margen de ganancia por producto |
| **Alertas** | Productos con stock bajo resaltados en rojo en toda la app |
| **Autenticacion** | Login seguro con JWT, refresh tokens y proteccion de rutas |
| **Usuarios y Roles** | Gestion de usuarios con roles y permisos granulares |

---

## Sistema de Autenticacion

El sistema implementa autenticacion robusta con JWT y refresh tokens:

### Flujo de Autenticacion
- **Access Token**: Token de corta duracion (8h por defecto) para autorizar peticiones API
- **Refresh Token**: Token de larga duracion (7 dias) para renovar sesiones sin re-login
- **Renovacion automatica**: El frontend detecta tokens expirados y los renueva transparentemente
- **Cierre de sesion**: Invalida los refresh tokens en el servidor para seguridad

### Caracteristicas de Seguridad
- Contraseñas hasheadas con bcrypt (10 rondas)
- Verificacion de usuario activo en cada peticion
- Rotacion de refresh tokens en cada uso
- Revocacion de tokens al cambiar contraseña
- Proteccion contra acceso no autorizado

---

## Control de Acceso (RBAC)

Sistema de permisos granulares basado en roles:

### Roles Disponibles

| Rol | Descripcion | Permisos |
|---|---|---|
| **Admin** | Acceso total al sistema | `dashboard.view`, `products.*`, `stock.move`, `categories.*`, `users.*` |
| **Manager** | Gestion de inventario sin administrar usuarios | `dashboard.view`, `products.view/create/edit`, `stock.move`, `categories.view/create/edit` |
| **Viewer** | Solo lectura del inventario | `dashboard.view`, `products.view`, `categories.view` |

### Permisos por Modulo

| Modulo | Ver | Crear | Editar | Eliminar |
|---|:---:|:---:|:---:|:---:|
| Dashboard | `dashboard.view` | - | - | - |
| Productos | `products.view` | `products.create` | `products.edit` | `products.delete` |
| Stock | - | `stock.move` | - | - |
| Categorias | `categories.view` | `categories.create` | `categories.edit` | `categories.delete` |
| Usuarios | `users.view` | `users.create` | `users.edit` | `users.delete` |

### Uso en el Frontend

```javascript
import { useAuth } from '../context/AuthContext';

function MiComponente() {
  const { can, isAdmin, isManager } = useAuth();
  
  // Verificar permiso especifico
  if (can('products.create')) {
    // Mostrar boton de crear producto
  }
  
  // Verificar rol
  if (isAdmin) {
    // Acciones solo para admin
  }
}
```

---

## Estructura del proyecto

```
inventory-app/
├── backend/
│   ├── server.js              # API REST con Express
│   ├── database.js            # Inicializacion SQLite + datos de prueba
│   ├── middleware/
│   │   └── auth.js            # Middlewares de autenticacion y autorizacion
│   ├── routes/
│   │   ├── auth.js            # Endpoints de autenticacion
│   │   └── users.js            # CRUD de usuarios
│   └── package.json
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Sidebar.jsx     # Navegacion lateral
│       │   ├── ProductModal.jsx
│       │   └── StockModal.jsx
│       ├── context/
│       │   ├── AppContext.jsx  # Estado global (categorias, sidebar)
│       │   └── AuthContext.jsx # Autenticacion, usuario y permisos
│       ├── pages/
│       │   ├── Dashboard.jsx   # Panel de control
│       │   ├── Products.jsx    # Lista de inventario
│       │   ├── Categories.jsx  # Gestion de categorias
│       │   ├── Users.jsx       # Gestion de usuarios (Admin)
│       │   └── Login.jsx       # Pagina de inicio de sesion
│       ├── services/
│       │   └── api.js          # Capa de comunicacion con backend
│       └── utils/
│           └── formatters.js   # Formatos de moneda, fecha, colores
└── package.json                # Scripts para arrancar todo junto
```

---

## Instalacion y puesta en marcha

### Prerrequisitos
- **Node.js** v18 o superior -> [descargar](https://nodejs.org)
- **npm** v9+ (viene con Node)

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/inventory-app.git
cd inventory-app
```

### 2. Instalar dependencias
```bash
# Opcion A - instalar todo de una vez
npm install
npm run install:all

# Opcion B - manualmente
cd backend && npm install
cd ../frontend && npm install
```

### 3. Arrancar en desarrollo

**Opcion A - ambos servidores juntos (recomendado):**
```bash
npm run dev
```

**Opcion B - por separado en terminales distintas:**
```bash
# Terminal 1 - Backend (puerto 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (puerto 3000)
cd frontend
npm start
```

### 4. Abrir en el navegador
```
http://localhost:3000
```

La base de datos SQLite se crea automaticamente en `backend/inventory.db` con datos de ejemplo.

---

## Cuentas de Demostracion

El sistema incluye usuarios de prueba para probar los diferentes roles:

| Email | Contrasena | Rol | Permisos |
|---|---|---|---|
| `admin@inventario.com` | `admin123` | Admin | Acceso total |
| `manager@inventario.com` | `manager123` | Manager | Gestión de inventario |
| `viewer@inventario.com` | `viewer123` | Viewer | Solo lectura |

> **Nota**: En la pantalla de login puedes hacer clic en las cuentas de demo para autocompletar las credenciales.

---

## Esquema de base de datos

```sql
roles              -- Roles con permisos granulares (JSON)
users              -- Usuarios con foreign key a roles
refresh_tokens     -- Tokens de renovacion de sesion
categories         -- Categorias con umbral de stock configurable
products           -- Productos con campo JSON 'specifications'
stock_movements     -- Historial de entradas, salidas y ajustes (con user_id)
sales_channels     -- Canales de venta (tienda, Instagram, web, WhatsApp)
```

### Tabla de Roles

```sql
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,           -- 'admin', 'manager', 'viewer'
  description TEXT,                    -- Descripcion del rol
  permissions TEXT NOT NULL DEFAULT '[]', -- JSON array de permisos
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla de Usuarios

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,         -- bcrypt hash
  role_id INTEGER NOT NULL,             -- FK a roles
  is_active INTEGER DEFAULT 1,         -- Usuario activo/inactivo
  last_login DATETIME,                 -- Ultimo acceso
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

### Campo `specifications` (JSON dinamico)

Cada categoria sugiere atributos predeterminados, pero puedes agregar cualquier atributo personalizado:

```json
// Maquina de afeitar (Electronica)
{ "voltaje": "100-240V", "tipo": "Rotativa", "cabezas": 3, "carga": "USB-C", "impermeable": "Si" }

// Gorra
{ "talla": "Unica ajustable", "color": "Negro", "estilo": "Snapback", "material": "100% algodon" }

// Labial (Belleza)
{ "color": "Rojo Pasion", "tono": "Calido", "acabado": "Matte" }
```

---

## API REST

Base URL: `http://localhost:3001/api`

### Autenticacion

| Metodo | Endpoint | Descripcion |
|---|---|---|
| POST | `/auth/login` | Iniciar sesion (retorna tokens y usuario) |
| POST | `/auth/refresh` | Renovar access token con refresh token |
| GET | `/auth/me` | Obtener usuario actual (requiere auth) |
| POST | `/auth/logout` | Cerrar sesion (revoca tokens) |
| POST | `/auth/change-password` | Cambiar contraseña (requiere auth) |

### Usuarios (requiere permiso `users.view`)

| Metodo | Endpoint | Descripcion |
|---|---|---|
| GET | `/users` | Listar usuarios |
| GET | `/users/roles` | Listar roles disponibles |
| POST | `/users` | Crear usuario (permiso `users.create`) |
| PUT | `/users/:id` | Actualizar usuario (permiso `users.edit`) |
| DELETE | `/users/:id` | Eliminar usuario (permiso `users.delete` + admin) |

### Dashboard

| Metodo | Endpoint | Descripcion |
|---|---|---|
| GET | `/dashboard` | KPIs, alertas, estadisticas |

### Productos

| Metodo | Endpoint | Descripcion |
|---|---|---|
| GET | `/products` | Lista con filtros (search, category_id, low_stock) |
| POST | `/products` | Crear producto |
| PUT | `/products/:id` | Actualizar producto |
| DELETE | `/products/:id` | Eliminar (soft delete) |
| POST | `/products/:id/stock` | Movimiento de stock |

### Categorias

| Metodo | Endpoint | Descripcion |
|---|---|---|
| GET | `/categories` | Listar categorias con conteo |
| POST | `/categories` | Crear categoria |
| PUT | `/categories/:id` | Actualizar categoria |
| DELETE | `/categories/:id` | Eliminar categoria |

---

## Tecnologias utilizadas

**Backend**
- [Express.js](https://expressjs.com/) - framework HTTP
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite sincrono de alto rendimiento
- [express-validator](https://express-validator.github.io/) - validacion de entradas
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - autenticacion JWT
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - hasheo de contraseñas
- [cors](https://github.com/expressjs/cors) - Cross-Origin Resource Sharing

**Frontend**
- [React 18](https://react.dev/) - UI declarativa
- [Tailwind CSS 3](https://tailwindcss.com/) - estilos utilitarios
- [React Router 6](https://reactrouter.com/) - navegacion SPA
- [Axios](https://axios-http.com/) - cliente HTTP
- [react-hot-toast](https://react-hot-toast.com/) - notificaciones
- Fuentes: [Syne](https://fonts.google.com/specimen/Syne) + [DM Sans](https://fonts.google.com/specimen/DM+Sans) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

---

## Proximas mejoras sugeridas

- [x] Autenticacion con JWT (multiples usuarios / roles)
- [ ] Exportar inventario a Excel / CSV
- [ ] Registro de ventas por canal
- [ ] Graficas de evolucion de stock (Recharts)
- [ ] Fotos de productos (upload a Cloudinary)
- [ ] API de notificaciones (email/WhatsApp cuando stock baja)
- [ ] Modo oscuro
- [ ] PWA para uso en movil offline
- [ ] Auditoria de acciones por usuario
- [ ] Backup automatico de base de datos

---

## Licencia

MIT - libre para uso personal y comercial.

---

> Desarrollado con React + Node.js + SQLite - Diseno de interfaz con Tailwind CSS