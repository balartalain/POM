# Guía de Usuario — PAME

**Gestor de Plan de Actividades Mensual Estratégica**

---

## Tabla de Contenido

1. [¿Qué es PAME?](#1-qué-es-pame)
2. [Acceso a la aplicación](#2-acceso-a-la-aplicación)
3. [Funcionalidades comunes](#3-funcionalidades-comunes)
4. [Vista del Empleado](#4-vista-del-empleado)
5. [Vista del Supervisor](#5-vista-del-supervisor)
6. [Indicadores visuales](#6-indicadores-visuales)
7. [Instalación como app (PWA)](#7-instalación-como-app-pwa)

---

## 1. ¿Qué es PAME?

PAME es una aplicación web para gestionar **Planes de Actividades Mensuales Estratégicas**. Permite a los supervisores crear planes con actividades asignadas a sus empleados, y a los empleados completar esas actividades adjuntando evidencia documental.

### Roles de usuario

| Rol | Descripción |
|-----|-------------|
| **Supervisor** | Crea y administra planes y actividades. Monitorea el progreso de todos los empleados. |
| **Empleado** | Ve los planes que le corresponden y completa las actividades subiendo evidencia. |

---

## 2. Acceso a la aplicación

### Iniciar sesión

1. Abre la aplicación en tu navegador.
2. Haz clic en el botón **"Iniciar sesión con Google"**.
3. Selecciona tu cuenta institucional de Google.
4. La aplicación cargará automáticamente tu panel según tu rol (Supervisor o Empleado).

> La sesión se mantiene activa automáticamente. Si expira, la app te redirigirá a la pantalla de inicio de sesión.

### Cerrar sesión

Haz clic en el ícono de **cerrar sesión** en la esquina superior derecha del encabezado.

---

## 3. Funcionalidades comunes

Estas funcionalidades están disponibles para todos los usuarios, independientemente del rol.

### Encabezado

El encabezado de la app muestra:
- El título de la aplicación: **Plan de Actividades**
- Tu nombre de usuario
- El indicador de estado de conexión
- El botón de cerrar sesión

### Indicador de conexión

Un ícono en el encabezado indica si estás conectado a internet:
- 🟢 **En línea** — la app funciona con datos en tiempo real
- ⚫ **Sin conexión** — no hay conectividad en este momento

### Notificaciones

La app puede enviarte notificaciones cuando ocurran cambios importantes (nuevas actividades, actualizaciones de planes):

- **App abierta**: aparece un mensaje emergente (toast) en la esquina superior derecha.
- **App cerrada o en segundo plano**: recibirás una notificación del sistema operativo en tu dispositivo.

Al abrir la app después de recibir notificaciones, los datos se actualizan automáticamente.

---

## 4. Vista del Empleado

### Panel principal

Al iniciar sesión como empleado verás todos los planes que te han sido asignados, organizados por mes.

**Elementos del panel:**
- **Selector de año** — filtra los planes por año (puedes navegar hasta 5 años atrás o adelante).
- **Secciones por mes** — cada mes (Enero, Febrero, etc.) agrupa sus planes correspondientes.
- **Tarjetas de plan** — cada tarjeta muestra el nombre del plan, la fecha límite y el progreso actual.

### Tarjeta de plan

Cada tarjeta de plan muestra:

| Elemento | Descripción |
|----------|-------------|
| Título | Nombre del plan |
| Fecha límite | Fecha de vencimiento del plan |
| Barra de progreso | Porcentaje de actividades completadas |
| Porcentaje | Número exacto de avance |

> Si la fecha de vencimiento ya pasó, se muestra en **rojo** como aviso.

### Detalle del plan

Haz clic sobre una tarjeta de plan para ver sus actividades.

La pantalla de detalle muestra:
- Nombre y fecha límite del plan
- Métricas: actividades **Completadas**, **Pendientes** y **Total**
- Barra de progreso general
- Lista de actividades con su estado individual

### Completar una actividad

Para registrar que completaste una actividad:

1. En el detalle del plan, localiza la actividad pendiente (aparece con ícono de reloj 🕐).
2. Haz clic en el botón **"Subir evidencia"**.
3. En el panel lateral que se abre:
   - Selecciona el archivo de evidencia (PDF, imagen u otro documento).
   - Opcionalmente, escribe observaciones o comentarios en el campo de texto.
4. Haz clic en **"Completar actividad"**.
5. Aparecerá una confirmación y la actividad quedará marcada como completada (✅).

Una vez completada, podrás ver:
- La fecha en que fue completada
- Un enlace para abrir el archivo de evidencia subido

> Las actividades completadas **no se pueden deshacer** desde la vista del empleado.

---

## 5. Vista del Supervisor

La vista del supervisor tiene dos secciones principales accesibles desde el menú lateral: **Planes** y **Empleados**.

---

### 5a. Gestión de Planes

#### Ver planes

El panel de planes muestra todos los planes agrupados por mes para el año seleccionado. Usa el **selector de año** para cambiar el período.

#### Crear un plan

1. Haz clic en el botón **"+ Añadir Nuevo Plan"**.
2. En el panel lateral que se abre, completa:
   - **Nombre del plan** (obligatorio)
   - **Fecha de vencimiento** (obligatorio)
3. Haz clic en **"Crear Plan"**.
4. El nuevo plan aparecerá en el mes correspondiente a su fecha de vencimiento.

#### Editar un plan

1. En la tarjeta del plan, haz clic en el ícono de **lápiz** ✏️.
2. Modifica el nombre o la fecha de vencimiento.
3. Haz clic en **"Guardar"**.

#### Eliminar un plan

1. En la tarjeta del plan, haz clic en el ícono de **papelera** 🗑️.
2. Confirma la eliminación en el diálogo de confirmación.

> ⚠️ Esta acción es **irreversible**. Eliminar un plan también eliminará todas sus actividades y registros asociados.

---

### 5b. Gestión de Actividades

Para gestionar las actividades de un plan, haz clic sobre la tarjeta del plan para acceder a su detalle.

#### Vista del detalle del plan

Muestra:
- Métricas generales: total de actividades, completadas, pendientes y porcentaje global
- Lista de actividades con su progreso (cuántos empleados las completaron)

#### Crear una actividad

1. Haz clic en **"+ Añadir Actividad"**.
2. En el panel lateral, completa:
   - **Título** (obligatorio)
   - **Descripción** (obligatorio)
3. Haz clic en **"Crear Actividad"**.

#### Editar una actividad

1. En la actividad, haz clic en el ícono de **lápiz** ✏️.
2. Modifica el título o la descripción.
3. Haz clic en **"Guardar"**.

#### Eliminar una actividad

1. En la actividad, haz clic en el ícono de **papelera** 🗑️.
2. Confirma la eliminación.

> ⚠️ Esta acción es **irreversible**.

#### Ver quién completó una actividad

Haz clic sobre el nombre de una actividad para seleccionarla. En el panel de la derecha verás la lista de empleados que la completaron, incluyendo:
- Nombre del empleado
- Fecha de completación
- Enlace a la evidencia subida
- Observaciones o comentarios escritos por el empleado

---

### 5c. Seguimiento de Empleados

Accede a la sección **"Empleados"** desde el menú lateral.

#### Panel de empleados

Permite monitorear el progreso de todos los empleados en un plan específico.

**Controles disponibles:**
- **Selector de año** — filtra por año
- **Selector de plan** — elige el plan a analizar (agrupados por mes)
- **Buscador** — filtra empleados por nombre o nombre de usuario en tiempo real

#### Lista de empleados

Cada fila muestra:
- Avatar con iniciales del empleado (con color según su progreso)
- Nombre y nombre de usuario
- Porcentaje de completación
- Barra de progreso (actividades completadas vs. total)

#### Detalle de un empleado

Haz clic sobre un empleado para ver el detalle de sus actividades en el plan seleccionado:

- Tarjeta resumen: actividades completadas, pendientes y porcentaje global
- Lista de actividades con:
  - ✅ Completada — muestra fecha, enlace a evidencia y observaciones
  - 🕐 Pendiente — indica que aún no ha sido completada

**En móvil**, el detalle se abre en pantalla completa. Usa el botón **"← Volver"** para regresar a la lista.

---

## 6. Indicadores visuales

### Barras de progreso

El color de las barras indica el nivel de avance:

| Color | Porcentaje | Significado |
|-------|-----------|-------------|
| 🟢 Verde | 70% o más | Buen progreso |
| 🟡 Ámbar | 30% – 69% | Progreso moderado |
| 🔴 Rojo | Menos del 30% | Progreso bajo |

### Fechas vencidas

Las fechas límite que ya han pasado se muestran en **rojo** como advertencia visual.

### Avatares

Los avatares de los empleados muestran sus iniciales y tienen el mismo código de color que las barras de progreso según el porcentaje de completación del empleado.

### Mensajes emergentes (Toasts)

Las acciones generan notificaciones breves en la esquina superior derecha de la pantalla:

- ✅ **Verde** — operación exitosa (plan creado, actividad completada, etc.)
- ❌ **Rojo** — error en la operación
- ℹ️ **Azul** — información del sistema (sesión expirada, datos actualizados)

Los mensajes desaparecen automáticamente después de 5 segundos o puedes cerrarlos manualmente.

---

## 7. Instalación como app (PWA)

PAME es una **Progressive Web App (PWA)**, lo que significa que puedes instalarla en tu dispositivo como si fuera una aplicación nativa.

### En Android (Chrome)

1. Abre la app en Chrome.
2. Toca el menú (⋮) y selecciona **"Añadir a pantalla de inicio"**.
3. Confirma el nombre y toca **"Añadir"**.

### En iOS (Safari)

1. Abre la app en Safari.
2. Toca el botón de compartir (📤).
3. Selecciona **"Añadir a pantalla de inicio"**.
4. Confirma el nombre y toca **"Añadir"**.

### En escritorio (Chrome / Edge)

1. Abre la app en tu navegador.
2. Haz clic en el ícono de instalación que aparece en la barra de direcciones.
3. Confirma la instalación.

Una vez instalada, la app se abre en modo pantalla completa sin la barra del navegador y puede recibir **notificaciones del sistema** incluso cuando está cerrada.

---

*PAME — Gestor de Plan de Actividades Mensual Estratégica*
