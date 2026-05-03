# Conversión a PWA — Gestor de PAME Mensual

Este documento describe los pasos realizados para convertir la aplicación React + Vite en una Progressive Web App (PWA) instalable.

---

## Requisitos previos

- Node.js 18+
- Proyecto base: React + TypeScript + Vite

---

## Paso 1 — Instalar el plugin PWA para Vite

```bash
npm install -D vite-plugin-pwa
```

El paquete `vite-plugin-pwa` genera automáticamente el Service Worker con Workbox y el Web App Manifest durante el build.

---

## Paso 2 — Crear los iconos de la aplicación

Se crearon cuatro archivos de ícono en la carpeta `public/`:

| Archivo | Uso |
|---|---|
| `public/icon.svg` | Ícono fuente SVG |
| `public/icon-192.png` | Ícono estándar Android (192×192) |
| `public/icon-512.png` | Ícono splash / maskable (512×512) |
| `public/apple-touch-icon.png` | Ícono para iOS (180×180) |

El SVG base utilizado (`public/icon.svg`):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1E40AF"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="260"
        font-weight="bold" text-anchor="middle" fill="white">P</text>
</svg>
```

Los PNG se generaron a partir de este SVG en los tamaños requeridos.

---

## Paso 3 — Configurar el plugin en `vite.config.ts`

Se importó `VitePWA` y se agregó al array de `plugins` con el manifiesto y la configuración de Workbox:

```ts
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
  manifest: {
    name: 'Gestor de PAME Mensual',
    short_name: 'PAME',
    description: 'Gestión de Planes de Actuación Mensual',
    theme_color: '#1E40AF',
    background_color: '#F3F4F6',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  },
  devOptions: {
    enabled: true,   // activa el SW también en modo desarrollo
  },
})
```

**Opciones clave:**

- `registerType: 'autoUpdate'` — el SW se actualiza automáticamente cuando hay una nueva versión del build.
- `globPatterns` — define qué archivos se precargan en caché (precaching).
- `devOptions.enabled: true` — permite probar el SW sin necesidad de hacer `npm run build`.

---

## Paso 4 — Registrar el Service Worker en `index.tsx`

Se importó y llamó `registerSW` al inicio de la aplicación:

```ts
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
```

- `immediate: true` activa el SW inmediatamente al cargar, sin esperar a que el usuario recargue la página.

---

## Paso 5 — Agregar meta tags PWA en `index.html`

Se añadieron las etiquetas necesarias para soporte en iOS/Android dentro del `<head>`:

```html
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="PAME" />
<meta name="theme-color" content="#1E40AF" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

---

## Paso 6 — Agregar los tipos de TypeScript en `vite-env.d.ts`

Se creó el archivo `vite-env.d.ts` en la raíz del proyecto:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

Esto evita errores de TypeScript al importar `virtual:pwa-register`.

---

## Verificación

### En desarrollo
```bash
npm run dev
```
Abrir DevTools → Application → Service Workers para verificar que el SW está registrado.

### En producción
```bash
npm run build
npm run preview
```
En Chrome DevTools → Application → Manifest se muestra el manifiesto completo y aparece el botón **"Install"** en la barra de direcciones.

---

## Resultado

La aplicación ahora:

- Es instalable en Android, iOS, Windows y macOS.
- Funciona offline gracias al precaching de Workbox.
- Muestra un ícono propio en la pantalla de inicio del dispositivo.
- Se abre en modo `standalone` (sin la barra del navegador).
- Se actualiza automáticamente cuando se despliega una nueva versión.
