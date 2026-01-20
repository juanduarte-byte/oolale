# Propuesta Integral: Ecosistema del Panel Administrativo "Óolale"

Este documento propone la estructura funcional y operativa del Panel de Administración (Backoffice) para la plataforma **Óolale (JAMConnect)**. Esta propuesta se basa en el análisis de los modelos de datos existentes y las necesidades operativas de una plataforma social y transaccional de músicos.

> **Objetivo:** Proporcionar control total, auditoría y capacidad de gestión sobre cada aspecto de la aplicación.

---

## 1. Estructura del Menú (Navegación)

El menú lateral se dividirá en **6 Módulos Estratégicos**:

### 🟢 A. Dashboard (Visión General)
*   **Resumen Ejecutivo:** Tarjetas con métricas en tiempo real (Usuarios Totales, Ingresos del Mes, Usuarios Activos, Alertas de Moderación).
*   **Gráficos de Tendencia:** Curva de registros nuevos, flujo de caja diario.
*   **Mapa de Calor:** (Futuro) Dónde están ubicados los músicos.
*   **Feed de Actividad:** Log en vivo de lo que está pasando (Fulanito se registró, Sultanito pagó, Menganito reportó).

### 👥 B. Comunidad (Gestión de Usuarios)
*   **Directorio de Usuarios:** Tabla maestra con búsqueda avanzada (por nombre, email, rol).
    *   *Acciones:* Ver Perfil Completo, Editar Datos, Cambiar Contraseña, Banear/Desbanear.
*   **Perfiles Artísticos:** Vista detallada de la "Bio" del músico, sus géneros, instrumentos y fotos.
*   **Conexiones:** Visualizador de quién sigue a quién o quién ha contactado a quién.
*   **Historial de Bloqueos:** Auditoría de conflictos entre usuarios (quién bloqueó a quién y cuándo).

### 🛡️ C. Moderación (Trust & Safety)
*   **Bandeja de Reportes:** **(CRÍTICO)** Lista de denuncias hechas por usuarios.
    *   *Funcionalidad:* Ver motivo, ver evidencia (chat/foto), tomar acción (Ignorar, Advertir, Banear).
*   **Auditoría de Mensajes:** Buscador de chats para investigar casos de acoso o fraude (acceso restringido).
*   **Moderación de Muestras:** Galería tipo "Tinder" para aprobar o rechazar fotos/audios/videos subidos antes de que sean públicos (o post-denuncia).
*   **Revision de Referencias:** Gestión de reviews/reseñas. Eliminar reseñas falsas o insultantes.

### 🎵 D. Contenido y Catálogos
*   **Eventos:** Gestión de los eventos creados por usuarios.
    *   *Acciones:* Destacar evento en Home, cancelar evento (si viola normas), ver asistentes.
*   **Catálogo de Géneros:** ABM (Alta, Baja, Modificación) de los géneros musicales disponibles.
*   **Catálogo de Instrumentos:** ABM de instrumentos seleccionables.
*   **Participantes:** Ver quién asiste a qué evento.

### 💰 E. Negocio y Finanzas
*   **Transacciones (Pagos):** Historial completo de pagos (Stripe/PayPal/MercadoPago).
    *   *Datos:* ID de transacción, Usuario, Monto, Fecha, Estado (Éxito/Fallido/Reembolso).
*   **Contrataciones:** Monitor de los "Deals" cerrados dentro de la app.
    *   *Estado:* En negociación, Aceptado, Finalizado, Cancelado.
*   **Boosters:** Gestión de usuarios que pagaron por visibilidad extra. Monitor de campañas activas.
*   **Membresías:** Configuración de precios y beneficios de los planes (Free, Pro, Rockstar).

### ⚙️ F. Sistema y Configuración
*   **Notificaciones Push:** Herramienta para redactar y enviar alertas a todos los usuarios o segmentos específicos.
*   **Configuración Global:** Interruptores para funcionalidades (ej. "Poner app en mantenimiento", "Desactivar registros nuevos").
*   **Logs de Administrador:** ¿Quién del equipo borró a este usuario? Historial de acciones del staff.

---

## 2. Acciones Específicas por Entidad

Aquí detallo qué se debe poder hacer con cada una de las tablas que tienes en base de datos:

| Entidad | Acciones Requeridas en Admin |
| :--- | :--- |
| **Usuario** | Crear, Editar, Soft-Delete, Banear, Reset Password, Ver Logs de Acceso. |
| **Perfil** | Ver Portfolio, Editar Bio/Tags (si son ofensivos), Ver Redes Sociales vinculadas. |
| **Generos/Instrumentos** | Crear nuevos, Editar nombres (corregir typos), Fusionar duplicados. |
| **Muestra** | Ver archivo (img/audio), Eliminar (por copyright/inapropiado). |
| **Evento** | Editar detalles, Cancelar, Destacar (Promocionar). |
| **ParticipanteEvento** | Ver lista de asistentes, Expulsar asistente. |
| **Conexion** | Ver grafo de relaciones. |
| **Mensaje** | Leer (solo superadmin), Exportar historial para legal. |
| **Notificacion** | Crear nueva (Push), Ver historial de envíos. |
| **Pago** | Ver detalle, Reenviar recibo, Emitir reembolso (si la API lo permite). |
| **Contratacion** | Ver términos, Intervenir en disputa (Arbitraje). |
| **Booster** | Ver métricas de alcance, Desactivar manualmente. |
| **Reporte** | Cambiar estado (Pendiente -> Resuelto), Vincular a sanción. |
| **Bloqueo** | Ver razón (si existe), Desbloquear (casos excepcionales). |
| **Referencia** | Ocultar/Eliminar comentario. |
| **Configuracion** | Editar valores Key-Value del sistema. |

---

## 3. Flujos de Trabajo Sugeridos

1.  **Flujo de Moderación Diaria:**
    *   El admin entra -> Revisa KPI "Reportes Pendientes".
    *   Va a "Moderación > Reportes".
    *   Revisa casos uno por uno -> Toma acción (Ban/Warn/Dismiss).
2.  **Flujo de Soporte a Pagos:**
    *   Usuario reclama "Pagué y no soy Pro".
    *   Admin va a "Finanzas > Pagos".
    *   Busca por email del usuario.
    *   Verifica estado de transacción -> Corrige manual o explica al usuario.
3.  **Flujo de Mantenimiento de Contenido:**
    *   Admin revisa "Catálogos".
    *   Agrega nuevos instrumentos solicitados por la comunidad.
    *   Borra géneros repetidos.

---

**¿Qué opinas?**
Por favor, indícame qué sobra, qué falta, o si algún flujo no se adapta a la realidad de tu negocio "Óolale". Con tu feedback ajustaré el código inmediatamente.
