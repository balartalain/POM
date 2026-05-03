# PAME Frontend

Aplicación React + PWA para la gestión de Planes de Actuación Mensual Estratégica (PAME).

---

## Tabla de contenido

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Implementación de Web Push Notifications](#implementación-de-web-push-notifications)
  - [Arquitectura general](#arquitectura-general)
  - [Paso 1 – Cambiar la estrategia del Service Worker](#paso-1--cambiar-la-estrategia-del-service-worker)
  - [Paso 2 – Crear el Service Worker personalizado](#paso-2--crear-el-service-worker-personalizado)
  - [Paso 3 – Hook `usePushNotifications`](#paso-3--hook-usepushnotifications)
  - [Paso 4 – Hook `useDataSync`](#paso-4--hook-usedatasync)
  - [Paso 5 – Integrar todo en `App.tsx`](#paso-5--integrar-todo-en-apptsx)
  - [Paso 6 – Usar `useDataSync` en componentes](#paso-6--usar-usedatasync-en-componentes)
- [Flujo completo de una notificación](#flujo-completo-de-una-notificación)

---

## Requisitos

- Node.js 18+
- Backend PAME corriendo en `http://localhost:8000`

## Instalación

```bash
npm install
npm run dev
```

## Variables de entorno

Crear un archivo `.env.local` en la raíz:

```env
VITE_API_BASE_URL=http://localhost:8000
GEMINI_API_KEY=tu_clave_gemini
```

---

## Implementación de Web Push Notifications

### Arquitectura general

Se implementó un sistema **dual** para cubrir dos escenarios:

| Escenario | Mecanismo | Resultado |
|-----------|-----------|-----------|
| App abierta en el navegador | **Pusher** (WebSocket) | Toast de aviso + re-fetch automático de datos |
| App cerrada o navegador minimizado | **Web Push VAPID** (service worker) | Notificación nativa del SO + re-fetch al reabrir |

```
Cambio en la BD
  │
  ├─► Señal Django ──► pusher_client.trigger('pame', 'UPDATE_PLANS')
  │                         └─► React recibe el evento
  │                               ├─► muestra toast
  │                               └─► window.dispatchEvent('pame:data-update')
  │                                         └─► componentes con useDataSync hacen fetch
  │
  └─► broadcast_push() ──► navegador del usuario (incluso con app cerrada)
                                └─► service worker recibe evento "push"
                                      ├─► app abierta  → guarda pending (Pusher ya notificó)
                                      └─► app cerrada  → notificación nativa + guarda pending
                                                              └─► usuario abre app
                                                                    └─► React lee pending → fetch
```

---

### Paso 1 – Cambiar la estrategia del Service Worker

**Archivo:** `vite.config.ts`

`vite-plugin-pwa` ofrece dos modos:

- `generateSW` _(modo anterior)_: Workbox genera el SW automáticamente. No permite añadir lógica personalizada (como manejar eventos `push`).
- `injectManifest` _(modo nuevo)_: Tú provees el archivo fuente del SW. Workbox solo inyecta el manifiesto de precache. Permite código 100 % personalizado.

```ts
// vite.config.ts
VitePWA({
  strategies: 'injectManifest',   // <- cambio clave
  srcDir: '.',
  filename: 'sw.ts',              // <- ruta al SW fuente
  registerType: 'autoUpdate',
  devOptions: {
    enabled: true,
    type: 'module',
  },
  // ... manifest igual que antes
})
```

---

### Paso 2 – Crear el Service Worker personalizado

**Archivo:** `sw.ts` (raíz del proyecto)

El service worker es la pieza que recibe notificaciones push **aunque la app esté cerrada**. Hace tres cosas:

#### 2a. Precaching (Workbox)

```ts
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST); // Workbox inyecta aquí el manifiesto
```

#### 2b. Evento `push` – recibe la notificación del backend

```ts
self.addEventListener('push', (event) => {
  const { type, title, body } = event.data.json();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      const appIsOpen = windowClients.length > 0;

      // Siempre guarda el tipo de cambio para que React lo consuma después
      const store = addPending(type);

      // Solo muestra notificación nativa si la app no está abierta
      // (si está abierta, Pusher ya habrá notificado)
      if (appIsOpen) return store;

      return Promise.all([
        store,
        self.registration.showNotification(title, { body, icon: '/icon-192.png' }),
      ]);
    })
  );
});
```

**¿Por qué no mostrar la notificación si la app está abierta?**  
Porque Pusher ya mostró un toast. Mostrar también la notificación nativa sería redundante.

#### 2c. Almacenamiento de "pending updates"

Se usa la **Cache API** del SW para persistir los tipos de cambio pendientes de consumir:

```ts
const PENDING_CACHE = 'pame-pending-updates-v1';

async function addPending(type: string) { /* guarda en cache */ }
async function getPending(): Promise<string[]> { /* lee de cache */ }
async function clearPending() { /* borra después de leer */ }
```

#### 2d. Evento `message` – comunicación con React

React necesita pedirle al SW los pendientes al abrirse:

```ts
self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_PENDING_UPDATES') {
    getPending().then((updates) => {
      event.ports[0].postMessage({ updates });
      clearPending();
    });
  }
});
```

---

### Paso 3 – Hook `usePushNotifications`

**Archivo:** `hooks/usePushNotifications.ts`

Este hook hace dos cosas: suscribir al usuario a Web Push y leer los pending updates del SW.

#### 3a. Suscripción VAPID

```ts
const subscribe = async () => {
  // 1. Pedir permiso de notificaciones
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  // 2. Obtener o crear suscripción en el navegador
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // 3. Enviar la suscripción al backend para que pueda mandar pushes
  await request('/api/v1/push/subscribe/', {
    method: 'POST',
    body: JSON.stringify(subscription.toJSON()),
  });
};
```

**¿Qué es VAPID?**  
Voluntary Application Server Identification. Es el estándar que autoriza a tu servidor a enviar notificaciones push. Requiere un par de claves pública/privada. El navegador verifica la clave pública antes de entregar la notificación.

**VAPID_PUBLIC_KEY** está hardcodeada en el hook. La clave privada correspondiente está en el backend (`settings.py`). Ambas fueron generadas con `pywebpush`.

#### 3b. Lectura de pending updates

```ts
const getPendingUpdates = async (): Promise<string[]> => {
  const registration = await navigator.serviceWorker.ready;

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => resolve(event.data.updates ?? []);
    registration.active.postMessage(
      { type: 'GET_PENDING_UPDATES' },
      [channel.port2]   // canal de respuesta privado
    );
    setTimeout(() => resolve([]), 1500); // timeout de seguridad
  });
};
```

Se usa `MessageChannel` para comunicación bidireccional entre React y el SW sin eventos globales.

---

### Paso 4 – Hook `useDataSync`

**Archivo:** `hooks/useDataSync.ts`

Permite que cualquier componente "escuche" un tipo de actualización y ejecute un callback (normalmente un re-fetch):

```ts
export type DataUpdateType = 'UPDATE_PLANS' | 'UPDATE_ACTIVITIES' | 'UPDATE_COMPLETIONS';

export function useDataSync(
  types: DataUpdateType | DataUpdateType[],
  callback: () => void
): void {
  useEffect(() => {
    const watched = Array.isArray(types) ? types : [types];
    const handler = (event: Event) => {
      const { type } = (event as CustomEvent<{ type: DataUpdateType }>).detail;
      if (watched.includes(type)) callback();
    };
    window.addEventListener('pame:data-update', handler);
    return () => window.removeEventListener('pame:data-update', handler);
  }, [types]);
}
```

El evento `pame:data-update` es despachado por el componente `RealtimeListener` en App.tsx cada vez que:
- Llega un evento Pusher (app activa), o
- Se leen pending updates del SW (app que acaba de abrirse).

---

### Paso 5 – Integrar todo en `App.tsx`

Se creó el componente interno `RealtimeListener` (se renderiza solo cuando hay usuario autenticado) que orquesta la lógica:

```tsx
const RealtimeListener: React.FC<{ user: User }> = ({ user }) => {
  const { addToast } = useToast();
  const { subscribe, getPendingUpdates } = usePushNotifications();

  // Al hacer login: suscribir al usuario a Web Push
  useEffect(() => { subscribe(); }, [user]);

  // Al abrir/enfocar la app: leer pending updates del SW
  const checkPending = useCallback(async () => {
    const updates = await getPendingUpdates();
    if (updates.length === 0) return;
    updates.forEach((type) => dispatch(type as DataUpdateType));
    addToast('Hay datos actualizados disponibles', 'info');
  }, [getPendingUpdates, addToast]);

  useEffect(() => {
    checkPending(); // al montar (startup)
    window.addEventListener('focus', checkPending);
    document.addEventListener('visibilitychange', checkPending);
    return () => { /* cleanup */ };
  }, [checkPending]);

  // Pusher: notificaciones en tiempo real mientras la app está activa
  useEffect(() => {
    const pusher = new Pusher('b23e7b8bf6ab3b8b19ff', { cluster: 'us2' });
    const channel = pusher.subscribe('pame');

    channel.bind('UPDATE_PLANS', () => {
      addToast('Los planes han sido actualizados', 'info');
      window.dispatchEvent(new CustomEvent('pame:data-update', {
        detail: { type: 'UPDATE_PLANS' }
      }));
    });
    // ... igual para UPDATE_ACTIVITIES y UPDATE_COMPLETIONS

    return () => { pusher.disconnect(); };
  }, [user]);

  return null;
};
```

---

### Paso 6 – Usar `useDataSync` en componentes

Para que un componente re-fetche sus datos automáticamente cuando llegue una notificación:

```tsx
import { useDataSync } from '../hooks/useDataSync';
import { PlanService } from '../services/PlanService';

function MiComponenteDePlanes() {
  const [plans, setPlans] = useState([]);

  const fetchPlans = useCallback(() => {
    PlanService.list().then(setPlans);
  }, []);

  // Carga inicial
  useEffect(() => { fetchPlans(); }, []);

  // Re-fetch automático cuando el backend notifique un cambio en planes
  useDataSync('UPDATE_PLANS', fetchPlans);

  // También puedes escuchar múltiples tipos:
  // useDataSync(['UPDATE_PLANS', 'UPDATE_ACTIVITIES'], reload);

  return <div>{/* ... */}</div>;
}
```

---

## Flujo completo de una notificación

### Caso 1: App abierta

```
1. Supervisor crea un Plan en el backend
2. Django signal post_save → pusher_client.trigger('pame', 'UPDATE_PLANS', {})
                           → broadcast_push({ type: 'UPDATE_PLANS', ... })
3. Pusher WebSocket llega a React
4. RealtimeListener.bind('UPDATE_PLANS') →
      addToast('Los planes han sido actualizados', 'info')   // toast visible
      window.dispatchEvent('pame:data-update', UPDATE_PLANS) // evento interno
5. Todos los componentes con useDataSync('UPDATE_PLANS', ...) ejecutan su re-fetch
6. Web Push también llega al SW → detecta que la app está abierta → no muestra notificación nativa
```

### Caso 2: App cerrada

```
1. Supervisor crea un Plan en el backend
2. Django signal → broadcast_push({ type: 'UPDATE_PLANS', title: '...', body: '...' })
3. El servidor push del navegador (FCM / Mozilla Push) entrega la notificación al SW
4. SW.addEventListener('push') →
      guarda 'UPDATE_PLANS' en Cache API
      self.registration.showNotification('PAME – Planes', { body: '...' })
5. Usuario ve la notificación nativa en su SO
6. Usuario hace click / abre la app
7. RealtimeListener monta → checkPending() →
      getPendingUpdates() le pregunta al SW por MessageChannel
      SW responde ['UPDATE_PLANS'] y borra el cache
      window.dispatchEvent('pame:data-update', UPDATE_PLANS)
8. Componentes re-fetchean datos actualizados
```
