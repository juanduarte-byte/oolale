# 🧪 CHECKLIST DE TESTING COMPLETO - ADMIN PANEL
**Fecha:** 2026-01-19  
**URL Base:** http://localhost:4000

---

## ✅ FASE 1: LOGIN & AUTENTICACIÓN

### Test 1.1: Login con Credenciales Incorrectas
- [ ] Ir a `http://localhost:4000/admin/login`
- [ ] Ingresar email: `test@test.com`
- [ ] Ingresar password: `wrong123`
- [ ] Click "INGRESAR"
- [ ] **ESPERADO:** Mensaje de error "Credenciales inválidas. Verifica tu email y contraseña."
- [ ] **RESULTADO:** _______________

### Test 1.2: Login con Credenciales Correctas
- [ ] Ingresar email: `admin@oolale.com`
- [ ] Ingresar password: `admin123`
- [ ] Click "INGRESAR"
- [ ] **ESPERADO:** Redirección a `/admin/dashboard`
- [ ] **RESULTADO:** _______________

### Test 1.3: Verificar Sesión
- [ ] Verificar que en la esquina superior derecha aparece "Administrador Principal"
- [ ] **ESPERADO:** Nombre del admin visible con avatar
- [ ] **RESULTADO:** _______________

---

## 📊 FASE 2: DASHBOARD

### Test 2.1: Verificar KPIs
- [ ] Verificar que se muestran 4 tarjetas de estadísticas:
  - [ ] Total Usuarios (número)
  - [ ] Ingresos (número con $)
  - [ ] Activos Ahora (número)
  - [ ] Reportes Pendientes (número)
- [ ] **RESULTADO:** _______________

### Test 2.2: Tabla de Reportes Recientes
- [ ] Verificar que existe sección "Actividad de Moderación Reciente"
- [ ] Verificar que hay una tabla con columnas: ID, Tipo, Estado, Fecha
- [ ] **RESULTADO:** _______________

### Test 2.3: Navegación del Sidebar
- [ ] Verificar que el sidebar tiene 6 secciones:
  - [ ] Dashboard
  - [ ] COMUNIDAD (Usuarios, Perfiles, Conexiones)
  - [ ] MODERACIÓN (Reportes, Mensajes, Muestras, Referencias)
  - [ ] CONTENIDO (Eventos, Géneros, Instrumentos)
  - [ ] NEGOCIO (Pagos, Contrataciones, Boosters)
  - [ ] SISTEMA (Notas Admin, Audit Log, Notificaciones, Configuración)
- [ ] **RESULTADO:** _______________

---

## 👥 FASE 3: GESTIÓN DE USUARIOS

### Test 3.1: Listar Usuarios
- [ ] Click en "Usuarios" en el sidebar
- [ ] **ESPERADO:** Lista de usuarios con columnas: ID, Nombre, Email, Fecha Registro, Acciones
- [ ] Verificar que hay datos (100+ usuarios)
- [ ] **RESULTADO:** _______________

### Test 3.2: Búsqueda de Usuarios
- [ ] En el campo de búsqueda, escribir "Ana"
- [ ] Presionar Enter o click en buscar
- [ ] **ESPERADO:** Resultados filtrados que contengan "Ana"
- [ ] **RESULTADO:** _______________

### Test 3.3: Paginación
- [ ] Verificar que dice "Página X de Y"
- [ ] Click en botón de siguiente página (>)
- [ ] **ESPERADO:** Carga página 2 con diferentes usuarios
- [ ] **RESULTADO:** _______________

### Test 3.4: Crear Usuario
- [ ] Click en botón "Crear Usuario"
- [ ] **ESPERADO:** Formulario con campos: Nombre Completo, Correo Electrónico, Contraseña
- [ ] **RESULTADO:** _______________

### Test 3.5: Editar Usuario
- [ ] Volver a lista de usuarios
- [ ] Click en botón "Editar" (ícono de lápiz) de cualquier usuario
- [ ] **ESPERADO:** Formulario de edición con datos pre-poblados
- [ ] Verificar que existe checkbox "¿Es Administrador?"
- [ ] **RESULTADO:** _______________

### Test 3.6: Eliminar Usuario
- [ ] Click en botón "Eliminar" (ícono de basura) de cualquier usuario
- [ ] **ESPERADO:** Confirmación "¿Eliminar usuario?"
- [ ] Click "Cancelar" (no eliminar realmente)
- [ ] **RESULTADO:** _______________

---

## 🎵 FASE 4: CATÁLOGOS (GÉNEROS E INSTRUMENTOS)

### Test 4.1: Listar Géneros
- [ ] Click en "Géneros" en el sidebar
- [ ] **ESPERADO:** Lista de géneros musicales (Rock, Jazz, Pop, etc.)
- [ ] **RESULTADO:** _______________

### Test 4.2: Crear Género
- [ ] Click en "Agregar Género"
- [ ] **ESPERADO:** Formulario con campos: Nombre, Descripción
- [ ] **RESULTADO:** _______________

### Test 4.3: Editar Género
- [ ] Volver a lista de géneros
- [ ] Click en "Editar" de cualquier género
- [ ] **ESPERADO:** Formulario con datos pre-poblados
- [ ] **RESULTADO:** _______________

### Test 4.4: Listar Instrumentos
- [ ] Click en "Instrumentos" en el sidebar
- [ ] **ESPERADO:** Lista de instrumentos (Guitarra, Batería, etc.)
- [ ] **RESULTADO:** _______________

### Test 4.5: Crear Instrumento
- [ ] Click en "Agregar Instrumento"
- [ ] **ESPERADO:** Formulario con campos: Nombre, Tipo
- [ ] **RESULTADO:** _______________

---

## 📅 FASE 5: EVENTOS, PAGOS Y REPORTES

### Test 5.1: Eventos - Filtros de Fecha
- [ ] Click en "Eventos" en el sidebar
- [ ] **ESPERADO:** Barra de búsqueda con 2 campos de fecha (Desde/Hasta)
- [ ] Verificar que hay botón "Filtrar"
- [ ] **RESULTADO:** _______________

### Test 5.2: Eventos - Exportar CSV
- [ ] Click en botón "Exportar CSV"
- [ ] **ESPERADO:** Descarga de archivo `events_export_[timestamp].csv`
- [ ] **RESULTADO:** _______________

### Test 5.3: Eventos - Ver Datos
- [ ] Verificar tabla con columnas: ID, Título, Tipo, Fecha, Acciones
- [ ] Verificar que hay datos (120+ eventos)
- [ ] **RESULTADO:** _______________

### Test 5.4: Pagos - Filtro de Estado
- [ ] Click en "Pagos" en el sidebar
- [ ] **ESPERADO:** Dropdown "Todos los estados" con opciones:
  - [ ] Completado
  - [ ] Pendiente
  - [ ] Fallido
- [ ] **RESULTADO:** _______________

### Test 5.5: Pagos - Ver Datos
- [ ] Verificar tabla con columnas: ID, Monto, Estado, Método, Acciones
- [ ] Verificar que los montos se muestran con $ y moneda
- [ ] Verificar badges de color (verde=completado, rojo=fallido)
- [ ] **RESULTADO:** _______________

### Test 5.6: Reportes - Filtro de Estado
- [ ] Click en "Reportes" en el sidebar
- [ ] **ESPERADO:** Dropdown con opciones:
  - [ ] Todos
  - [ ] Pendiente
  - [ ] En Revisión
  - [ ] Resuelto
- [ ] **RESULTADO:** _______________

### Test 5.7: Reportes - Ver Datos
- [ ] Verificar tabla con columnas: ID, Motivo, Estado, Fecha, Acciones
- [ ] Verificar que hay datos (100+ reportes)
- [ ] **RESULTADO:** _______________

---

## 📝 FASE 6: NOTAS ADMINISTRATIVAS

### Test 6.1: Listar Notas
- [ ] Click en "Notas Admin" en el sidebar
- [ ] **ESPERADO:** Página con título "Notas Administrativas"
- [ ] Verificar botón "Nueva Nota"
- [ ] **RESULTADO:** _______________

### Test 6.2: Crear Nota
- [ ] Click en "Nueva Nota"
- [ ] **ESPERADO:** Formulario con campos:
  - [ ] Título
  - [ ] Prioridad (dropdown: Baja, Normal, Alta, Urgente)
  - [ ] Contenido (textarea)
- [ ] **RESULTADO:** _______________

### Test 6.3: Filtros de Notas
- [ ] Volver a lista de notas
- [ ] Verificar campo de búsqueda
- [ ] Verificar dropdown de prioridad
- [ ] Verificar botón "Filtrar"
- [ ] **RESULTADO:** _______________

### Test 6.4: Crear Nota de Prueba
- [ ] Click "Nueva Nota"
- [ ] Título: "Prueba de Testing"
- [ ] Prioridad: "Alta"
- [ ] Contenido: "Esta es una nota de prueba para verificar funcionalidad"
- [ ] Click "Crear Nota"
- [ ] **ESPERADO:** Redirección a lista con nueva nota visible
- [ ] **RESULTADO:** _______________

### Test 6.5: Editar Nota
- [ ] Click en "Editar" (lápiz) de la nota recién creada
- [ ] **ESPERADO:** Formulario con datos pre-poblados
- [ ] Cambiar prioridad a "Urgente"
- [ ] Click "Guardar Cambios"
- [ ] **ESPERADO:** Badge rojo de "URGENTE" en la nota
- [ ] **RESULTADO:** _______________

### Test 6.6: Eliminar Nota
- [ ] Click en "Eliminar" (basura) de la nota de prueba
- [ ] **ESPERADO:** Confirmación "¿Eliminar esta nota?"
- [ ] Click "Aceptar"
- [ ] **ESPERADO:** Nota eliminada de la lista
- [ ] **RESULTADO:** _______________

---

## 📊 FASE 7: AUDIT LOG (REGISTRO DE AUDITORÍA)

### Test 7.1: Ver Audit Log
- [ ] Click en "Audit Log" en el sidebar
- [ ] **ESPERADO:** Tabla con columnas:
  - [ ] Fecha/Hora
  - [ ] Administrador
  - [ ] Acción
  - [ ] Entidad
  - [ ] ID
  - [ ] Detalles
- [ ] **RESULTADO:** _______________

### Test 7.2: Verificar Registro de Acciones
- [ ] Verificar que aparecen las acciones recientes (crear/editar/eliminar nota)
- [ ] Verificar badges de color:
  - [ ] CREATE (verde)
  - [ ] UPDATE (gris)
  - [ ] DELETE (rojo)
- [ ] Verificar que muestra nombre del admin
- [ ] **RESULTADO:** _______________

---

## 👤 FASE 8: MENÚ DE PERFIL

### Test 8.1: Abrir Menú de Perfil
- [ ] Click en "Administrador Principal" (esquina superior derecha)
- [ ] **ESPERADO:** Dropdown con 3 opciones:
  - [ ] 🔑 Cambiar Contraseña
  - [ ] ⚙️ Configuración
  - [ ] 🚪 Cerrar Sesión (en rojo)
- [ ] **RESULTADO:** _______________

### Test 8.2: Cambiar Contraseña - Ver Formulario
- [ ] Click en "Cambiar Contraseña"
- [ ] **ESPERADO:** Formulario con 3 campos:
  - [ ] Contraseña Actual
  - [ ] Nueva Contraseña
  - [ ] Confirmar Nueva Contraseña
- [ ] Verificar que cada campo tiene ícono de ojo 👁️
- [ ] **RESULTADO:** _______________

### Test 8.3: Toggle Ver/Ocultar Contraseña
- [ ] Click en ícono de ojo del primer campo
- [ ] **ESPERADO:** Contraseña se muestra como texto visible
- [ ] **ESPERADO:** Ícono cambia a ojo tachado 👁️‍🗨️
- [ ] Click nuevamente
- [ ] **ESPERADO:** Contraseña se oculta (puntos)
- [ ] Repetir con los otros 2 campos
- [ ] **RESULTADO:** _______________

### Test 8.4: Cambiar Contraseña - Error de Contraseña Actual
- [ ] Contraseña Actual: "wrong123"
- [ ] Nueva Contraseña: "newpass123"
- [ ] Confirmar: "newpass123"
- [ ] Click "Cambiar Contraseña"
- [ ] **ESPERADO:** Error "La contraseña actual es incorrecta."
- [ ] **RESULTADO:** _______________

### Test 8.5: Cambiar Contraseña - Error de Confirmación
- [ ] Contraseña Actual: "admin123"
- [ ] Nueva Contraseña: "newpass123"
- [ ] Confirmar: "different123"
- [ ] Click "Cambiar Contraseña"
- [ ] **ESPERADO:** Error "Las contraseñas nuevas no coinciden."
- [ ] **RESULTADO:** _______________

### Test 8.6: Cambiar Contraseña - Éxito
- [ ] Contraseña Actual: "admin123"
- [ ] Nueva Contraseña: "testing123"
- [ ] Confirmar: "testing123"
- [ ] Click "Cambiar Contraseña"
- [ ] **ESPERADO:** Mensaje de éxito "Contraseña actualizada correctamente."
- [ ] **RESULTADO:** _______________

---

## 🚪 FASE 9: CERRAR SESIÓN

### Test 9.1: Logout
- [ ] Click en nombre del admin (esquina superior derecha)
- [ ] Click en "Cerrar Sesión"
- [ ] **ESPERADO:** Redirección a `/admin/login`
- [ ] **ESPERADO:** Sesión destruida (no se puede acceder a `/admin/dashboard` sin login)
- [ ] **RESULTADO:** _______________

### Test 9.2: Login con Nueva Contraseña
- [ ] Email: `admin@oolale.com`
- [ ] Password: `testing123` (la nueva contraseña)
- [ ] Click "INGRESAR"
- [ ] **ESPERADO:** Login exitoso
- [ ] **RESULTADO:** _______________

### Test 9.3: Restaurar Contraseña Original
- [ ] Cambiar contraseña de vuelta a `admin123` para futuros tests
- [ ] **RESULTADO:** _______________

---

## 🎨 FASE 10: UI/UX GENERAL

### Test 10.1: Diseño Dark Theme
- [ ] Verificar que todo el panel usa tema oscuro
- [ ] Verificar glassmorphism en tarjetas
- [ ] Verificar que los textos son legibles
- [ ] **RESULTADO:** _______________

### Test 10.2: Responsive del Sidebar
- [ ] Verificar que el sidebar tiene scroll vertical
- [ ] Scroll hasta el final del sidebar
- [ ] Verificar que "Salir" es visible
- [ ] **RESULTADO:** _______________

### Test 10.3: Badges de Estado
- [ ] Verificar colores de badges:
  - [ ] Verde = Activo/Completado/CREATE
  - [ ] Rojo = Inactivo/Fallido/DELETE/Urgente
  - [ ] Gris = Normal/UPDATE
  - [ ] Amarillo = Alta prioridad
- [ ] **RESULTADO:** _______________

### Test 10.4: Iconos Bootstrap
- [ ] Verificar que todos los iconos se muestran correctamente
- [ ] Verificar que los botones tienen iconos apropiados
- [ ] **RESULTADO:** _______________

---

## 📋 RESUMEN DE RESULTADOS

### Funcionalidades Principales
- [ ] Login/Logout: ___/3 tests
- [ ] Dashboard: ___/3 tests
- [ ] Usuarios: ___/6 tests
- [ ] Catálogos: ___/5 tests
- [ ] Eventos/Pagos/Reportes: ___/7 tests
- [ ] Notas Admin: ___/6 tests
- [ ] Audit Log: ___/2 tests
- [ ] Perfil/Contraseña: ___/6 tests
- [ ] UI/UX: ___/4 tests

### TOTAL: ___/42 tests pasados

### Problemas Encontrados:
1. _______________
2. _______________
3. _______________

### Funcionalidades Excelentes:
1. _______________
2. _______________
3. _______________

### Recomendaciones:
1. _______________
2. _______________
3. _______________

---

## ✅ CHECKLIST RÁPIDO (Para Testing Rápido)

**Funcionalidades Críticas:**
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Crear usuario funciona
- [ ] Editar usuario funciona
- [ ] Búsqueda funciona
- [ ] Paginación funciona
- [ ] Crear género funciona
- [ ] Editar género funciona
- [ ] Filtros de eventos funcionan
- [ ] Exportar CSV funciona
- [ ] Crear nota funciona
- [ ] Editar nota funciona
- [ ] Eliminar nota funciona
- [ ] Audit log muestra acciones
- [ ] Cambiar contraseña funciona
- [ ] Ver/ocultar contraseña funciona
- [ ] Menú de perfil funciona

**SCORE RÁPIDO: ___/17**

---

**NOTA:** Marca cada checkbox con ✅ cuando pase el test o ❌ si falla.
Anota cualquier error en consola o comportamiento inesperado.
