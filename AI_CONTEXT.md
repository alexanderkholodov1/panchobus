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

## ❌ LO QUE FALTA — Pendiente para la próxima IA

### Alta prioridad (requisitos del profesor)

#### 1. MAPA en detalle de ruta — `app/app/rutas/[id]/page.tsx`
**Requisito explícito del profesor**: "Página para cada ruta contiene: horarios, paradas y mapa"
- Las coordenadas ya existen en el seed/DB (lat/lng reales de cada parada)
- Usar **Leaflet** via CDN (gratuito, sin API key) con tiles OpenStreetMap
- Mostrar polilínea entre paradas + marcadores numerados con el color de la ruta
- Implementar con `<Script>` tag y div con `id="map"` — Leaflet no soporta SSR/import normal
- NO usar MapLibre (requiere configuración más compleja)

#### 2. Búsqueda por paradas — `app/app/rutas/page.tsx`
**Parcialmente pendiente**: La búsqueda actual filtra por `nombre`, `codigo`, `descripcion` de la ruta.
- El profesor pide búsqueda por paradas también ("buscador por rutas/horas/paradas")
- Solución: en `useEffect`, cargar también `db.getParadas()` y hacer join manual para filtrar rutas que tengan una parada cuyo nombre coincida con `q`

#### 3. Validación `@usfq.edu.ec` — `app/registro/page.tsx`
**Parcialmente hecho**:
- El trigger en Supabase ya tiene la validación comentada
- En el cliente (`app/registro/page.tsx`) hay que agregar validación de formato antes de llamar a `register()`
- Dominio válido: `@usfq.edu.ec` o `@estud.usfq.edu.ec`
- Solo para producción — en demo mode se acepta cualquier email

#### 4. Middleware real con Supabase SSR — `middleware.ts`
- Actualmente tiene `|| true` que bypasea todo — no protege rutas en producción
- Para Supabase SSR se necesita `createServerClient` dentro del middleware con cookies de Next.js
- Referencia: `@supabase/ssr` tiene un ejemplo de middleware específico para Next.js
- Cuidado: en demo mode (sin env vars) debe seguir pasando todo sin error

#### 5. GPS real — `app/chofer/hoy/page.tsx`
- Reemplazar mock con `navigator.geolocation.watchPosition`
- Crear endpoint `POST /api/gps` → insert en `bus_locations` en Supabase
- Supabase Realtime para que la posición llegue a estudiantes en tiempo real
- Requiere HTTPS en producción para geolocation API

#### 6. Cámara QR — `app/chofer/escanear/page.tsx`
- Input manual ya funciona y llama `db.scanQR()`
- Agregar cámara real con `jsQR` (gratuito, sin dependencias) o `@zxing/browser`
- Requiere HTTPS + permisos de cámara
- El backend ya está completo: `db.scanQR(token, idChofer)` devuelve la reserva actualizada

### Media prioridad (mejoras UX / rubrica)

#### 7. PWA manifest — `app/layout.tsx` y `public/`
- Crear `public/manifest.json` con nombre, iconos, theme_color (#E11B22), display standalone
- Agregar `<link rel="manifest">` en layout
- Iconos: al menos 192x192 y 512x512 PNG
- Sin service worker por ahora (solo manifest para "instalar en móvil")

#### 8. Tracking tiempo real para estudiantes
- Nueva sección en `/app/rutas/[id]` o página `/app/tracking/[id]`
- Consume `bus_locations` via Supabase Realtime subscription
- Requiere GPS real en el chofer primero (item #5)

#### 9. Notificaciones email
- Confirmación de reserva al crear
- Notificación de cancelación
- Resend o SendGrid via Supabase Edge Functions
- **Bajo prioridad** — no en rubrica explícita del profesor

### Deuda técnica

#### 10. Eliminar archivos legacy
Confirmar con el usuario primero:
- `functions/` (Firebase/Genkit — remanente de versión anterior)
- `firebase.json`, `apphosting.yaml`, `database.rules.json`
- Si Firebase Hosting ya no es el target de deploy, eliminar todo esto

#### 11. Insights con Gemini API — `app/admin/insights/page.tsx`
- Actualmente análisis puramente algorítmico (funciona bien)
- Cuando esté disponible `GEMINI_API_KEY`, añadir llamada a `POST /api/ai/insights`
- **No urgente** — el análisis actual es suficiente para la presentación

---

## Checklist rubrica del profesor

| Req | Estado | Notas |
|-----|--------|-------|
| Landing page pública | ✅ | `app/page.tsx` |
| Registro/Login — rutas privadas detrás de auth | ✅ | AppShell redirige, middleware scaffold |
| Home privado (dashboard por rol) | ✅ | 3 dashboards distintos |
| Página por ruta con horarios y paradas | ✅ parcial | Horarios y paradas ✅ — **FALTA MAPA** ❌ |
| Página por ruta con mapa | ❌ | Pendiente #1 arriba |
| Buscador por rutas/código/descripción | ✅ | En `/app/rutas` |
| Buscador por paradas | ❌ | Pendiente #2 arriba |
| Buscador por horarios | ⚠️ | Existe en `/app/horarios` pero no en el buscador principal |
| Esquema SQL de base de datos | ✅ | En Supabase migrations — 9 tablas |
| Trigger `handle_new_user` | ✅ | Implementado en Supabase |
| Validación dominio `@usfq.edu.ec` | ⚠️ | En trigger (comentado para demo) — falta validación cliente |
| Validaciones en formulario de registro | ✅ | Nombre, email, banner, password ≥ 6 |
| Código banner (campo en registro) | ✅ | `codigo_banner` en form y DB |
| RLS en Supabase | ✅ | Policies completas por rol |
| Ruta personal del usuario (campo `id_ruta`) | ✅ | En registro y perfil |
| Rutas/paradas privadas (detrás de auth) | ✅ | AppShell redirige a /login |
| Responsive mobile | ✅ | Todas las páginas responsive |
| Soporte smartphone | ✅ | Mobile-first, responsive |
| PWA / instalar en móvil | ❌ | Pendiente #7 arriba |

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
├── middleware.ts                   # Route protection (scaffold — ver pendiente #4)
├── .env.local                      # Variables de entorno (NO commitear)
└── AI_CONTEXT.md                   # Este archivo
```

---

## Supabase — Detalles técnicos

**Migrations aplicadas** (en orden):
1. `initial_schema` — 9 tablas + indexes
2. `handle_new_user_trigger` — trigger + función
3. `rls_policies` — función `get_user_rol()` + policies por tabla

**Campos del trigger `handle_new_user`** (mapea desde `raw_user_meta_data`):
```sql
nombre, correo_electronico, codigo_banner, telefono, direccion, id_ruta, rol
```
El `signUp` en `demo-session.tsx` pasa exactamente esos keys en `options.data`.

**Para activar validación de dominio**: en Supabase SQL Editor, editar la función `handle_new_user` y descomentar el bloque que verifica `@usfq.edu.ec` o `@estud.usfq.edu.ec`.

---

## Seed data summary

8 rutas (A1 Lumbisí, B1 El Bosque, C1 Sur Atahualpa, D1 Carcelén, E1 Conocoto, F1 CC San Luis, G1 Urb. Condado, H1 Machala Granados [suspendida])  
47 paradas con coordenadas reales de Quito/Cumbayá  
USFQ campus: lat -0.196528, lng -78.435944  
9 usuarios, 8 buses, 8 asignaciones (fechas dinámicas desde hoy), 5 reservas, 3 mensajes

---

## Contactos reales

- `panchobus@usfq.edu.ec` — correo oficial del servicio
- Jairo Carvajal · `jcarvajal@usfq.edu.ec` · Coordinador de movilidad · Oficina PF104, Campus Cumbayá
- Sistema actual de referencia: app **Finder** (Opinno EC) — no integrar
- Sistema previo: **OnTrack** — no integrar

---

## Memoria persistente (Claude Cowork)

Archivos de memoria en:
`C:\Users\AlexAmaze\AppData\Roaming\Claude\local-agent-mode-sessions\...\memory\`
- `project_panchobus.md` — contexto del proyecto
- `user_alexander.md` — perfil de Alexander y preferencias

Leerlos al iniciar sesión nueva en Cowork.
