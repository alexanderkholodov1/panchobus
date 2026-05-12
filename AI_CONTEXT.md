# AI_CONTEXT.md — Lectura obligatoria para cualquier IA que continúe este proyecto

> **Leer COMPLETO antes de tocar cualquier archivo. Las secciones "Estado actual" y "Pendiente" son las más críticas.**

---

## Qué es esto

**Pancho Bus** es el servicio gratuito de transporte universitario de la **Universidad San Francisco de Quito (USFQ)**, Cumbayá, Ecuador. ~9.000 estudiantes lo usan a diario. Hoy vive embebido como pestaña en la app **Finder** (construida por Opinno EC), con UX primitiva, baja adopción (1K descargas, 3.0★) y procesos manuales (registro presencial en oficina PF104, formulario externo en OnTrack, comunicación informal con choferes).

**Este repositorio** es la reconstrucción completa: una plataforma web dedicada con tres roles (estudiante, admin, chofer/personal de ruta), reservas con QR, seguimiento operativo y analytics con IA.

---

## Contexto humano

- Producto oficial en fase de demostración para autoridades USFQ. Debe sonar a implementación real, no a trabajo académico.
- Cada decisión de diseño, copy y arquitectura debe sostener una lectura profesional y operativa.
- Voz de marca: **"Tu libertad, comienza aquí"**. Tono institucional moderno. Cero placeholder text.

---

## Stack y decisiones tomadas

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | Next.js 14 App Router | `"use client"` en todas las páginas privadas |
| UI | Tailwind CSS + design system USFQ | No cambiar los CSS variables de `globals.css` |
| Tipado | TypeScript | Tipos en `lib/types.ts`, no duplicar |
| Auth / DB | **Demo**: store memoria + localStorage · **Producción**: Supabase | Ver `lib/db/index.ts` y `components/providers/demo-session.tsx` |
| Iconos | lucide-react | No mezclar con otras librerías de iconos |
| Fuentes | Inter (sans) + Libre Baskerville (display) | Via `next/font` |
| Theming | next-themes + CSS variables | `class` strategy |

**TODO lo que se use debe ser gratuito.** No proponer servicios pagos sin permiso explícito.

---

## Identidad visual (anclada al Manual USFQ oficial)

**Paleta**:
- `#E11B22` Rojo USFQ (primario) → `text-primary`, `bg-primary`
- `#231F20` Negro USFQ
- `#939598` Gris USFQ
- `#F39200` Naranja Panchobus (del logo original)
- `#F9E8E8` Tint rojo · `#2A7D4F` Verde estado-ok · `#E89F1F` Warn · `#C13030` Error

**Tipografía**: `font-display` = Libre Baskerville · `font-sans` = Inter

**No usar emojis** en UI ni código salvo que el usuario los use primero.

---

## Modelo de datos — fuente de verdad

Definido en `lib/types.ts`. Tablas principales:

- `usuarios` — rol: `'estudiante'|'admin'|'chofer'`, estado: `'pendiente'|'activo'|'suspendido'`
- `rutas` — con `color_hex`, `dias_operacion[]`, `estado`
- `paradas` — con coordenadas lat/lng reales de Quito/Cumbayá, `tipo: origen|intermedia|destino`
- `buses` — placa, modelo, capacidad, estado
- `asignaciones` — qué bus+chofer corre qué ruta qué día, cupos disponibles/reservados
- `reservas` — `qr_token`, `posicion_waitlist`, estado: `confirmada|en_espera|cancelada|usada|no_show`
- `mensajes` — admin→usuario o admin→ruta completa
- `bus_locations` — GPS histórico (tipo definido en types.ts y tabla en Supabase, NO implementado en UI)
- `eventos` — analytics (tipo definido, tabla en Supabase, NO implementado en UI)

**Seed completo** en `lib/data/seed.ts`: 8 rutas reales del Pancho Bus USFQ, 47 paradas con coordenadas reales, 9 usuarios demo, asignaciones dinámicas por fecha actual.

---

## Roles y cuentas demo

| Rol | URL base | Cómo se crea | Label en UI |
|-----|----------|-------------|-------------|
| `estudiante` | `/app/` | Se registra solo, auto-aprobado | "Estudiante" |
| `admin` | `/admin/` | Admin crea desde `/admin/usuarios` | "Administración" |
| `chofer` | `/chofer/` | Admin crea desde `/admin/usuarios` | **"Personal de Ruta"** |

**⚠️ IMPORTANTE sobre el rol `"chofer"`**: En código es el string `"chofer"` pero en la UI se llama "Personal de Ruta" porque incluye tanto conductores como acompañantes. NO renombrar el string `"chofer"` en código sin actualizar `app-shell.tsx`, redirects y seed.

Cuentas demo predefinidas en seed:
- `demo-student` → Alexander Kholodov, ruta A1 Lumbisí, estudiante
- `demo-admin` → Jairo Carvajal, admin (coordinador real USFQ)
- `demo-driver` → Carlos Mendoza, chofer ruta A1

---

## Demo mode — cómo funciona la persistencia

Sin variables de entorno Supabase, la app corre en demo mode:
- `lib/db/index.ts` → store en memoria, inicializado con `structuredClone(SEED_*)`
- Cambios (reservas, mensajes, usuarios nuevos) → persisten en `localStorage['panchobus-store-overrides']`
- Sesión activa → `localStorage['panchobus-session-userid']`
- `components/providers/demo-session.tsx` → `register()` llama `db.addUsuario()` para persistir el usuario en el store

Para resetear a estado limpio: borrar localStorage en el navegador.

---

## Supabase — Estado de integración (mayo 2026)

**Proyecto**: `ycyzgmzwlbyirxbjqvuo` (panchobus) — ACTIVE_HEALTHY, region us-west-1  
**URL**: `https://ycyzgmzwlbyirxbjqvuo.supabase.co`  
**`.env.local`**: creado con URL + anon key (⚠️ no commitear — está en .gitignore)

### ✅ Hecho en Supabase

- 9 tablas con RLS activo: `rutas`, `paradas`, `buses`, `usuarios`, `asignaciones`, `reservas`, `mensajes`, `bus_locations`, `eventos`
- Función helper `get_user_rol()` — usada en todas las policies de RLS
- RLS por rol: estudiantes ven sus datos, choferes ven su ruta, admins ven todo
- Trigger `handle_new_user`: auto-crea fila en `public.usuarios` al registrarse en Auth
  - Mapea `raw_user_meta_data` → columnas de `usuarios`
  - Validación de dominio `@usfq.edu.ec` está **comentada** (para demo funciona cualquier email)
- `lib/db/index.ts`: branch Supabase completo con normalizers (`normalizeAsignacion`, `normalizeReserva`, `normalizeMensaje`)
- `components/providers/demo-session.tsx`: auth completo Supabase + demo mode con `IS_SUPABASE` flag

### ❌ NO hecho en Supabase / pendiente

- Seed de datos reales en las tablas Supabase (están vacías — demo usa el store en memoria)
- Dominio `@usfq.edu.ec`: descomentar en trigger cuando se vaya a producción
- Middleware real: `middleware.ts` actualmente pasa todo (`|| true`) — ver sección Pendiente

---

## Estado actual del código (mayo 2026) — LO QUE EXISTE Y FUNCIONA

### Infraestructura ✅
- Setup completo: package.json, tsconfig, tailwind, next.config, globals.css, layout.tsx
- Design system: CSS variables claro/oscuro, todos los componentes UI (Button, Input, Label, Select, Card, Badge, Skeleton, Toaster, ThemeToggle)
- `lib/types.ts` completo
- `lib/db/index.ts` con API completa (Supabase + demo mode)
- `lib/data/seed.ts` con datos realistas (8 rutas, 47 paradas, 9 usuarios)
- Auth dual: `components/providers/demo-session.tsx` — login por rol, credenciales, registro, logout, refresh

### AppShell ✅ (`components/layout/app-shell.tsx`)
- Sidebar fija 256px en desktop, dropdown en mobile
- Auto-redirect por rol: estudiante→`/app/inicio`, admin→`/admin/dashboard`, chofer→`/chofer/hoy`
- Redirige a `/login` si no hay sesión

### Middleware (`middleware.ts`) ⚠️ INCOMPLETO
- Scaffold funcional pero con `|| true` que bypasea toda la verificación
- En demo mode esto es intencional (AppShell maneja los redirects en cliente)
- Para producción con Supabase SSR necesita verificar cookies reales de sesión

### Landing page ✅ (`app/page.tsx`)
- Hero, cómo funciona, acceso/privacidad, diferenciadores, CTA

### Panel Admin — 9 páginas ✅ (`app/admin/`)
| Página | Ruta | Estado |
|--------|------|--------|
| Dashboard | `/admin/dashboard` | ✅ KPIs, salidas del día, top rutas |
| Rutas | `/admin/rutas` | ✅ CRUD con color picker y días |
| Buses | `/admin/buses` | ✅ Listado con estados |
| Personal de Ruta | `/admin/choferes` | ✅ Listado con asignación del día |
| Asignaciones | `/admin/asignaciones` | ✅ Calendario semanal |
| Reservas | `/admin/reservas` | ✅ Tabla + búsqueda + filtros + CSV + cancelar |
| Usuarios | `/admin/usuarios` | ✅ Tabs activo/pendiente/todos + crear chofer/admin + aprobar/suspender |
| Mensajes | `/admin/mensajes` | ✅ Enviar a usuario o ruta completa |
| Insights IA | `/admin/insights` | ✅ Análisis algorítmico (sin Gemini API) |

### Panel Estudiante — 8 páginas ✅ (`app/app/`)
| Página | Ruta | Estado | Notas |
|--------|------|--------|-------|
| Inicio | `/app/inicio` | ✅ | Saludo, próxima reserva, quick links |
| Rutas | `/app/rutas` | ✅ | Búsqueda por nombre/código/descripción — **NO busca por paradas** |
| Detalle ruta | `/app/rutas/[id]` | ✅ parcial | Paradas en timeline — **FALTA MAPA** (req. profesor) |
| Reservar | `/app/reservar` | ✅ | Wizard 3 pasos, lista de espera automática |
| Mis reservas | `/app/mis-reservas` | ✅ | Tabs próximas/historial, cancelar, ver QR |
| Mi QR | `/app/mi-qr` | ✅ | QR SVG determinístico 21×21, selector de reservas |
| Horarios | `/app/horarios` | ✅ | Calendario semanal navegable con filtro por ruta |
| Perfil | `/app/perfil` | ✅ | Edición de datos, selector de tema |

### Panel Personal de Ruta — 4 páginas ✅ (`app/chofer/`)
| Página | Ruta | Estado | Notas |
|--------|------|--------|-------|
| Hoy | `/chofer/hoy` | ✅ parcial | GPS mock con toast — **FALTA GPS real** |
| Pasajeros | `/chofer/pasajeros` | ✅ | Stats, barra ocupación, lista con estado QR |
| Escanear QR | `/chofer/escanear` | ✅ parcial | Input manual funciona — **FALTA cámara real** |
| Mensajes | `/chofer/mensajes` | ✅ | Inbox filtrado, indicador no leído |

### Páginas públicas ✅
- `/` Landing
- `/login` — Login por credenciales o acceso demo por rol
- `/registro` — Formulario registro estudiante

---

## ✅ IMPLEMENTADO POR EL AMIGO (antes de auditoría mayo 2026)

Las siguientes funcionalidades fueron añadidas en una sesión de trabajo:

1. **Mapa interactivo en `/app/app/rutas/[id]/page.tsx`** — Leaflet via CDN (unpkg), OpenStreetMap tiles, polilínea del recorrido + marcadores numerados con color de la ruta, popup con nombre y hora, `fitBounds` automático. Skeleton de carga mientras Leaflet inicializa. Leaflet CSS también inyectado dinámicamente.

2. **Búsqueda por paradas en `/app/app/rutas/page.tsx`** — `db.getAllParadas()` cargado en paralelo con rutas, filtrado cross-reference por `id_ruta`. Muestra hint "Parada: nombre" en la card cuando la coincidencia es por parada, no por nombre de ruta.

3. **Validación `@usfq.edu.ec` cliente en registro y login** — `/app/registro/page.tsx` y `/app/login/page.tsx` validan que el email termine en `@usfq.edu.ec` o `@estud.usfq.edu.ec` antes de llamar al backend. Login demo (loginAs) no pasa por esta validación.

4. **Validación banner 8 dígitos y teléfono** — regex en registro: `/^\d{8}$/` para banner, `/^[+\d\s-]{7,}$/` para teléfono.

5. **GPS real en `/app/chofer/hoy/page.tsx`** — `navigator.geolocation.watchPosition` con `enableHighAccuracy`, `timeout: 10000`, `maximumAge: 5000`. Envía posición cada 15 segundos via `fetch('/api/gps', ...)`. Muestra lat/lng/velocidad/precisión en tiempo real. Maneja errores de permiso, dispositivo no soportado y timeout.

6. **Endpoint `/api/gps/route.ts`** — Route Handler de Next.js. Demo mode acepta silenciosamente. Supabase mode inserta en `bus_locations`. Valida campos requeridos. `createClient` importado dinámicamente.

7. **Cámara QR en `/app/chofer/escanear/page.tsx`** — `jsQR` cargado dinámicamente desde CDN (jsdelivr 1.4.0). `getUserMedia({ facingMode: "environment" })` con resolución 640×480. Loop `requestAnimationFrame` con `canvas` para decodificar frames. Cleanup de stream y RAF en unmount. Input manual sigue disponible como fallback.

8. **Animación scan-line y estilos Leaflet en `globals.css`** — `@keyframes scan-line` para la línea que barre el viewfinder de la cámara. Estilos de popup de Leaflet adaptados a la fuente del proyecto.

9. **PWA manifest** — `public/manifest.json` completo con name, short_name, icons 192/512, theme_color `#E11B22`, display standalone, shortcuts ("Reservar cupo", "Mis reservas"). `app/layout.tsx` referencia `/manifest.json` en metadata y tiene `viewport.themeColor` con values por `prefers-color-scheme`.

10. **Metadatos OG en layout** — `openGraph.title`, `openGraph.description`, `appleWebApp`, `keywords`, `applicationName`.

### Bugs encontrados y corregidos en la auditoría

- `normalizeAsignacion()` incluía `cupos_totales` y `created_at` que no existen en el tipo `Asignacion` — eliminados (TS strict error)
- `normalizeMensaje()` usaba `id_ruta` y `leido` inexistentes en `Mensaje` — corregidos a `destinatario_ruta` y `leido_at`
- `normalizeReserva()` no incluía `qr_escaneado_at` ni `qr_escaneado_por` — añadidos
- `scanQR()` Supabase branch no guardaba `qr_escaneado_at`/`qr_escaneado_por` al marcar como usada — corregido
- `app/api/gps/route.ts` insertaba campo `timestamp` pero la tabla tiene `reportado_at` — corregido

---

## ❌ LO QUE FALTA — Pendiente para la próxima IA

### Alta prioridad

#### 1. Middleware real con Supabase SSR — `middleware.ts`
- Actualmente tiene `|| true` que bypasea toda verificación — no protege rutas en producción
- Para Supabase SSR se necesita `createServerClient` de `@supabase/ssr` dentro del middleware con las cookies de Next.js
- Ejemplo oficial: https://supabase.com/docs/guides/auth/server-side/nextjs
- **Cuidado**: en demo mode (sin `NEXT_PUBLIC_SUPABASE_URL`) debe seguir pasando todo sin error
- El `IS_SUPABASE` pattern ya funciona en `lib/db` y `demo-session.tsx` — aplicar el mismo en middleware

#### 2. Tracking en tiempo real para estudiantes
- El GPS del chofer ya envía posiciones a `bus_locations` en Supabase
- Falta: suscripción Supabase Realtime en la página del estudiante para ver el bus en el mapa
- Candidato: añadir un tab o sección en `/app/app/rutas/[id]/page.tsx`
- Requiere Supabase Realtime channel: `supabase.channel('bus-location').on('postgres_changes', ...)`

#### 3. Validación `@usfq.edu.ec` en Supabase trigger
- La validación cliente ya existe en login y registro (✅)
- En el trigger `handle_new_user` la validación está **comentada** — descomentar para producción
- Hacerlo via Supabase SQL Editor, no desde código

### Media prioridad

#### 4. Eliminar archivos legacy
Confirmar con el usuario primero:
- `functions/` (Firebase/Genkit — remanente de versión anterior)
- `firebase.json`, `apphosting.yaml`, `database.rules.json`
- Si Firebase Hosting ya no es el target de deploy, eliminar todo esto

#### 5. Insights con Gemini API — `app/admin/insights/page.tsx`
- Actualmente análisis puramente algorítmico (funciona bien para la demo)
- Cuando esté disponible `GEMINI_API_KEY`, añadir `POST /api/ai/insights`
- **No urgente** — el análisis actual cubre la rubrica

#### 6. Notificaciones email
- Confirmación de reserva y cancelación
- Resend via Supabase Edge Functions
- **Bajo prioridad** — no en rubrica del profesor

---

## Checklist rubrica del profesor

| Req | Estado | Notas |
|-----|--------|-------|
| Landing page pública | ✅ | `app/page.tsx` |
| Registro/Login — rutas privadas detrás de auth | ✅ | AppShell redirige, middleware scaffold |
| Home privado (dashboard por rol) | ✅ | 3 dashboards distintos |
| Página por ruta con horarios y paradas | ✅ | `/app/rutas/[id]` — timeline completo |
| Página por ruta con mapa | ✅ | Leaflet + OSM, polilínea + marcadores numerados |
| Buscador por rutas/código/descripción | ✅ | En `/app/rutas` |
| Buscador por paradas | ✅ | Cross-ref `getAllParadas()` con hint visual |
| Buscador por horarios | ⚠️ | Existe en `/app/horarios` separado, no integrado al buscador principal |
| Esquema SQL de base de datos | ✅ | En Supabase — 9 tablas con RLS |
| Trigger `handle_new_user` | ✅ | Implementado en Supabase |
| Validación dominio `@usfq.edu.ec` cliente | ✅ | En registro y login — regex `@usfq.edu.ec\|@estud.usfq.edu.ec` |
| Validación dominio `@usfq.edu.ec` Supabase | ⚠️ | En trigger pero comentado — descomentar para producción |
| Validaciones en formulario de registro | ✅ | Nombre, email, banner 8 dígitos, teléfono, password ≥ 6 |
| Código banner (campo en registro) | ✅ | `codigo_banner` en form, validado y guardado en DB |
| RLS en Supabase | ✅ | Policies completas por rol con `get_user_rol()` |
| Ruta personal del usuario (campo `id_ruta`) | ✅ | En registro y perfil |
| Rutas/paradas privadas (detrás de auth) | ✅ | AppShell redirige a /login |
| Responsive mobile | ✅ | Todas las páginas mobile-first |
| Soporte smartphone | ✅ | Responsive + PWA manifest |
| PWA / instalar en móvil | ✅ | `manifest.json` con icons 192/512, shortcuts |
| GPS en tiempo real (chofer) | ✅ | `watchPosition` → `POST /api/gps` → Supabase |
| Escaneo QR con cámara | ✅ | jsQR via CDN + fallback manual |

---

## Reglas críticas para la próxima IA

1. **Lee este archivo completo** antes de empezar.
2. **No hacer `git revert`** sin entender exactamente el efecto. En mayo 2026 un revert eliminó toda la carpeta `app/` y hubo que restaurar 21 páginas.
3. **No eliminar carpetas con bash** en el workspace montado de Windows.
4. **El sandbox Linux de Cowork no puede crear archivos en la carpeta Windows**: usa el `Write` tool de Cowork, nunca `touch`/`cp`/`echo >` para crear archivos nuevos.
5. **`npm install` desde Windows**, no desde el sandbox Linux (el mount no soporta node_modules correctamente).
6. **No inventar datos** que no estén en el seed (rutas, choferes, paradas, coordenadas).
7. **No proponer servicios pagos** sin permiso del usuario.
8. **Pregunta antes de salirte del plan**: si encontrás algo mejor, mencionarlo con justificación antes de implementar.
9. **Idioma**: UI y comentarios visibles en español. Variables y código en inglés. Commits en inglés.
10. **Quality bar**: cero pantallas en blanco, cero links rotos, cero "TODO" visibles en UI.
11. **`IS_SUPABASE` flag**: NUNCA eliminar el fallback a demo mode. La app debe funcionar sin variables de entorno.
12. **No commitear `.env.local`** — ya está en .gitignore, pero verificar antes de push.

---

## Estructura de archivos clave

```
panchobus/
├── app/
│   ├── page.tsx                    # Landing pública
│   ├── login/page.tsx              # Login (credenciales + demo por rol)
│   ├── registro/page.tsx           # Registro estudiante
│   ├── app/                        # Panel estudiante
│   │   ├── inicio/page.tsx
│   │   ├── rutas/
│   │   │   ├── page.tsx            # Explorador de rutas (búsqueda)
│   │   │   └── [id]/page.tsx       # Detalle ruta (FALTA MAPA)
│   │   ├── reservar/page.tsx       # Wizard reserva
│   │   ├── mis-reservas/page.tsx
│   │   ├── mi-qr/page.tsx
│   │   ├── horarios/page.tsx
│   │   └── perfil/page.tsx
│   ├── admin/                      # Panel admin (9 páginas)
│   └── chofer/                     # Panel personal de ruta (4 páginas)
├── components/
│   ├── layout/app-shell.tsx        # Sidebar + mobile nav (role-aware)
│   ├── providers/demo-session.tsx  # Auth provider (Supabase + demo)
│   └── ui/                         # Primitivos UI
├── lib/
│   ├── types.ts                    # Tipos TypeScript (fuente de verdad)
│   ├── db/index.ts                 # Data layer (Supabase + demo mode)
│   ├── data/seed.ts                # Datos demo
│   └── supabase/
│       ├── client.ts               # Browser client
│       └── server.ts               # Server client (SSR)
├── middleware.ts  