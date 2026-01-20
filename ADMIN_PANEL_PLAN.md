# Plan Maestro: Panel de Administración Óolale "JAMConnect"

Este documento detalla la estructura completa y exhaustiva para el Panel de Administración, cubriendo todas las entidades de la base de datos y flujos de negocio identificados.

## 1. Arquitectura de Navegación (Sidebar)

El menú lateral se organizará por módulos lógicos para facilitar la gestión de las 17 entidades identificadas.

### 🏠 **Dashboard (General)**
*   **KPIs:** Ingresos, Usuarios Totales, Activos, Reportes Pendientes.
*   **Gráficos:** Crecimiento de usuarios, Ingresos vs Tiempo.
*   **Alertas:** Reportes sin resolver, Pagos fallidos recientes.

### 👥 **Gestión de Usuarios (Community)**
*   **Usuarios:** (`Usuario.js`) Lista maestra, bloquear/desbloquear, ver detalles completos.
*   **Perfiles:** (`Perfil.js`) Ver info artística, portfolios, editar info sensible.
*   **Conexiones:** (`Conexion.js`) Ver grafo de conexiones (quién sigue a quién).
*   **Bloqueos:** (`Bloqueo.js`) Auditoría de bloqueos entre usuarios.

### 🛡️ **Moderación y Seguridad (Trust & Safety)**
*   **Reportes:** (`Reporte.js`) **PRIORIDAD ALTA**. Bandeja de entrada de reportes de usuarios. Acciones: Ignorar, Advertir, Banear.
*   **Mensajes:** (`Mensaje.js`) Logs de chat (solo lectura por privacidad/seguridad) para investigar reportes.

### 🎵 **Contenido y Catálogos (Content)**
*   **Géneros:** (`Genero.js`) CRUD completo.
*   **Instrumentos:** (`Instrumento.js`) CRUD completo.
*   **Muestras:** (`Muestra.js`) Revisión de archivos subidos (audios/videos). Eliminar contenido ilegal/copyright.
*   **Eventos:** (`Evento.js`) Gestión de eventos creados por usuarios.
*   **Referencias:** (`Referencia.js`) Moderación de reseñas/reviews entre usuarios.

### 💰 **Negocio y Monetización (Business)**
*   **Pagos:** (`Pago.js`) Historial de transacciones. Filtros por estado (aprobado, fallido).
*   **Contrataciones:** (`Contratacion.js`) Monitor de contratos/gigs cerrados en la plataforma.
*   **Boosters:** (`Booster.js`) Gestión de promociones activas.
*   **Membresías:** Configuración de tiers (Free, Pro, Rockstar).

### ⚙️ **Sistema (System)**
*   **Configuración:** (`Configuracion.js`) Variables globales, feature flags (activar/desactivar funciones app), textos legales.
*   **Notificaciones:** (`Notificacion.js`) Enviar push notifications masivas o específicas desde el admin.
*   **Logs del Admin:** Auditoría de qué hizo cada administrador.

---

## 2. Hoja de Ruta de Implementación

### Fase 1: Cimientos y Usuarios (✅ Parcialmente Completo)
- [x] Autenticación de Admin (Login seguro).
- [x] Layout Base y Diseño Dark Mode.
- [x] Dashboard con métricas básicas.
- [x] **Habilitar Módulo Usuarios:** Tabla conectada a DB real.
- [ ] **Detalle de Usuario:** Vista profunda (`/admin/users/:id`) combinando datos de `Usuario` y `Perfil`.

### Fase 2: Catálogos y Contenido (🚧 En Progreso)
- [x] **Catálogos Simples:** Géneros, Instrumentos, Referencias (Vistas básicas listas).
- [ ] **CRUD Funcional:** Habilitar creación y edición real en estos catálogos.
- [ ] **Módulo Eventos:** Tabla de eventos con filtros por fecha y estado.

### Fase 3: Moderación (🔥 Crítico)
- [ ] **Sistema de Reportes:** Crear vista `/admin/reports` para gestionar denuncias.
- [ ] **Acciones de Moderación:** Botones funcionales para Banear Usuario o Eliminar Contenido directamente desde el reporte.

### Fase 4: Monetización y Negocio
- [ ] **Módulo Finanzas:** Tabla de `Pagos` y `Contrataciones`.
- [ ] **Vista de Ingresos:** Gráficos reales sumando totales de la tabla `Pagos`.

### Fase 5: Mantenimiento y Sistema
- [ ] **Configuración Global:** Interfaz para editar `Configuracion.js` sin tocar código.
- [ ] **Push Notifications:** Formulario para enviar alertas a la app móvil.

---

## 3. Acciones Inmediatas (Siguiente Prompt)

Recomendamos proceder en este orden para asegurar funcionalidad crítica:

1.  **Refinar Sidebar:** Actualizar `admin_layout.ejs` con la estructura de grupos arriba mencionada (Community, Moderation, Content, Business, System).
2.  **Crear Rutas Faltantes:** Generar los `router.get` placeholders para todas las 17 entidades para que los links no den 404.
3.  **Priorizar Usuarios + Perfil:** Crear la vista de detalle de usuario, ya que es la herramienta más usada por un admin (ver quién es, qué instrumentos toca, sus fotos, sus pagos).
