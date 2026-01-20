# 🎵 JAMConnect Web Admin Panel

**JAMConnect Web** es el panel administrativo centralizado para la plataforma JAMConnect. Permite la gestión integral de usuarios, moderación de contenido, control financiero y configuración del sistema mediante una interfaz moderna y segura.

---

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una arquitectura **MVC (Modelo-Vista-Controlador)** adaptada para Node.js con Express y EJS.

### 📂 Estructura de Directorios

```bash
JAMConnect_Web/
├── src/
│   ├── config/             # Configuración de base de datos y servicios
│   │   └── db.js           # Cliente de Supabase
│   ├── public/             # Archivos estáticos
│   │   ├── css/            # Estilos (admin.css, landing.css)
│   │   └── img/            # Imágenes y assets
│   ├── routes/             # Lógica de rutas (Controladores)
│   │   ├── admin.js        # 🧠 Núcleo del Admin Panel (700+ líneas)
│   │   └── index.js        # Rutas públicas (Landing)
│   ├── scripts/            # Scripts de utilidad (Seeding, Admin Creation)
│   ├── views/              # Plantillas EJS (Vistas)
│   │   ├── admin/          # Vistas específicas del admin
│   │   ├── partials/       # Fragmentos reutilizables
│   │   ├── admin_layout.ejs # Layout maestro del admin
│   │   └── layout.ejs      # Layout maestro público
│   └── app.js              # Punto de entrada de la aplicación
├── .env                    # Variables de entorno (NO SUBIR A REPO)
├── package.json            # Dependencias y scripts
└── SETUP_ADMIN_TABLES.sql  # Scripts SQL de inicialización
```

---

## 🧠 Núcleo del Sistema: `src/routes/admin.js`

Este archivo contiene la lógica principal del panel. Implementa patrones avanzados para reducir la redundancia de código.

### 🔑 Funciones Clave

#### 1. `createCatalogCRUD(path, title, entity, tableName, fields)`
Generador dinámico de rutas CRUD. Crea automáticamente 6 rutas para cualquier entidad:
- `GET /` (Listar con paginación y búsqueda)
- `GET /create` (Formulario de creación)
- `POST /create` (Acción de creación)
- `GET /edit/:id` (Formulario de edición)
- `POST /edit/:id` (Acción de edición)
- `POST /delete/:id` (Acción de eliminado)

#### 2. `logAdminAction(req, accion, entidad, idEntidad, detalles)`
Sistema centralizado de auditoría.
- Registra automáticamente quién hizo qué, cuándo y dónde.
- Guarda los detalles del cambio en formato JSON en la tabla `Audit_Log`.

#### 3. Middleware de Seguridad
- **`isAdmin`**: Verifica sesión y rol de administrador.
- **Protección**: Rate Limiting (fuerza bruta), Helmet (HTTP Headers), Bcrypt (Hashing).

---

## 🔒 Seguridad Implementada

| Módulo | Función |
|--------|---------|
| **bcrypt** | Hashing de contraseñas (Salt rounds: 10). |
| **helmet** | Protección de cabeceras HTTP seguras. |
| **express-rate-limit** | Protección contra fuerza bruta en login. |
| **node-cache** | Caché en memoria para optimizar dashboard. |
| **express-session** | Gestión de sesiones seguras. |

---

## 🛠️ Instalación y Despliegue

### Requisitos
- Node.js v14+
- Proyecto en Supabase configurado

### 1. Clonar Repositorio
```bash
git clone https://github.com/Lysande2902/JAMConnect_Web.git
cd JAMConnect_Web
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Entorno
Crear archivo `.env`:
```env
SUPABASE_URL=tu_url_supabase
SUPABASE_KEY=tu_key_supabase
SESSION_SECRET=tu_secreto_seguro
PORT=4000
```

### 4. Inicializar Base de Datos
Ejecutar el script SQL proporcionado en `SETUP_ADMIN_TABLES.sql` y `OPTIMIZE_DB.sql` en tu panel de Supabase.

### 5. Crear Primer Admin
```bash
node src/scripts/create_admin.js
```

### 6. Ejecutar
```bash
npm start
```

---

## 📚 Stack Tecnológico

- **Backend:** Node.js, Express
- **Frontend:** EJS, CSS3 (Variables, Flexbox/Grid), Bootstrap Icons
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Custom + Supabase Auth + Bcrypt

---

**Desarrollado por [Lysande2902](https://github.com/Lysande2902)**
