# AI_CONTEXT.md — Lectura obligatoria para cualquier IA que continúe este proyecto

> **Leer COMPLETO antes de tocar cualquier archivo. Las secciones de "reglas" y "estado actual" son las más críticas.**

---

## Qué es esto

**Pancho Bus** es el servicio gratuito de transporte universitario de la **Universidad San Francisco de Quito (USFQ)**, Cumbayá, Ecuador. ~9.000 estudiantes lo usan a diario. Hoy vive embebido como pestaña en la app **Finder** (construida por Opinno EC), con UX primitiva, baja adopción (1K descargas, 3.0★) y procesos manuales (registro presencial en oficina PF104, formulario externo en OnTrack, comunicación informal con choferes).

**Este repositorio** es la reconstrucción completa: una plataforma web dedicada con tres roles (estudiante, admin, chofer/personal de ruta), reservas con QR, seguimiento operativo y analytics con IA.

---

## Contexto humano — léelo antes de tocar nada

- Es un producto oficial en fase de demostración para autoridades USFQ. Debe sonar a implementación real, no a trabajo académico.
- Cada decisión de diseño, copy y arquitectura debe sostener una lectura profesional y operativa.
- Voz de marca: **"Tu libertad, comienza aquí"**. Tono institucional moderno. Cero placeholder text.

---

## Stack y decisiones tomadas

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | Next.js 14 App Router | `"use client"` en todas las páginas privadas |
| UI | Tailwind CSS + design system USFQ | No cambiar los CSS variables de `globals.css` |
| Tipado | TypeScript | Tipos en `lib/types.ts`, no duplicar |
| Auth / DB | **Demo**: store memoria + localStorage · **Producción**: Supabase | Ver `lib/db/index.ts` |
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
- `bus_locations` — GPS histórico (tipo definido, no implementado aún)
- `eventos` — analytics (tipo definido, no implementado aún)

**Seed completo** en `lib/data/seed.ts`: 8 rutas reales del Pancho Bus USFQ, 47 paradas con coordenadas reales, 9 usuarios demo, asignaciones dinámicas por fecha actual.

---

## Roles y cuentas demo

| Rol | URL base | Cómo se crea | Label en UI |
|-----|----------|-------------|-------------|
| `estudiante` | `/app/` | Se registra solo, auto-aprobado | "Estudiante" |
| `admin` | `/admin/` | Admin crea desde `/admin/usuarios` | "Administración" |
| `chofer` | `/chofer/` | Admin crea desde `/admin/usuarios` | **"Personal de Ruta"** |

**⚠️ IMPORTANTE sobre el rol `"chofer"`**: En código es el string `"chofer"` pero en la UI se llama "Personal de Ruta" porque incluye tanto conductores como acompañantes (las señoras que verifican QRs en la fila de abordaje). NO renombrar el string `"chofer"` en código sin actualizar `app-shell.tsx`, redirects y seed.

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
- `components/providers/demo-session.tsx` → `register()` llama `db.addUsuario()` para persistir el usuario en el store (fix mayo 2026 — sin esto, los usuarios registrados aparecían como "Desconocido" en admin)

Para resetear a estado limpio: borrar localStorage en el navegador.

---

## Estado actual del código (mayo 2026)

### ✅ Implementado y funcional

**Infraestructura:**
- Setup completo: package.json, tsconfig, tailwind, next.config, globals.css, layout.tsx
- Design system: CSS variables claro/oscuro, todos los componentes UI
- `lib/types.ts` completo, `lib/db/index.ts` con API completa, `lib/data/seed.ts` con datos realistas
- Auth demo: login por rol, login por credenciales, registro, logout, refresh

**AppShell** (`components/layout/app-shell.tsx`):
- Sidebar fija 256px en desktop, dropdown en mobile
- Auto-redirect por rol: estudiante→`/app/inicio`, admin→`/admin/dashboard`, chofer→`/chofer/hoy`
- Redirige a `/login` si no hay sesión

**Landing page** (`app/page.tsx`): hero, cómo funciona, acceso/privacidad, diferenciadores, CTA

**Panel Admin** (9 páginas en `app/admin/`):
- `dashboard` — KPIs (reservas hoy, ocupación %, rutas activas, pendientes), salidas del día, top rutas
- `rutas` — CRUD con color picker y días de operación
- `buses` — listado con estados
- `choferes` — listado con asignación del día destacada
- `asignaciones` — calendario semanal con nav prev/next
- `reservas` — tabla con búsqueda por nombre/QR, filtro estado/ruta, export CSV, cancelar
- `usuarios` — lista completa + formulario crear conductor/admin + aprobar/suspender
- `mensajes` — enviar a usuario específico o a ruta completa
- `insights` — análisis algorítmico de demanda (sin Gemini API — puro client-side)

**Panel Estudiante** (8 páginas en `app/app/`):
- `inicio` — saludo por hora, próxima reserva, quick links, mi ruta, stats
- `rutas` — explorador con búsqueda y filtro activa/suspendida
- `rutas/[id]` — detalle con hero de color, operador, timeline de paradas, próximas salidas
- `reservar` — wizard 3 pasos con lista de espera automática, pre-selección por query params
- `mis-reservas` — tabs próximas/historial, cancelar, ver QR
- `mi-qr` — QR SVG determinístico (21×21), selector si hay varias reservas activas
- `horarios` — calendario semanal navegable con filtro por ruta
- `perfil` — edición de datos + selector de tema (claro/oscuro/sistema)

**Panel Personal de Ruta** (4 páginas en `app/chofer/`):
- `hoy` — asignación del día, GPS mock (produce toast "GPS activo"), timeline de paradas
- `pasajeros` — stats abordaron/esperando/lista espera, barra de ocupación, lista con estado QR
- `escanear` — UI de cámara (placeholder visual) + input manual, llama `db.scanQR()`, muestra resultado
- `mensajes` — inbox filtrado para este usuario, indicador de no leído

**Middleware** (`middleware.ts`): scaffold de protección de rutas (actualmente pass-through — los redirects los hace AppShell en cliente)

---

### 🔧 Pendiente — próximas IAs deben abordar esto

**Alta prioridad (necesario para producción):**

1. **Supabase — schema SQL**
   - Crear migrations para todas las tablas de `lib/types.ts`
   - Trigger `handle_new_user` en `auth.users` → insert en `public.usuarios` con rol `'estudiante'` y estado `'activo'`
   - Validar dominios `@usfq.edu.ec` y `@estud.usfq.edu.ec` en trigger o policy
   - RLS: estudiantes ven sus propias reservas, choferes ven su ruta, admins ven todo
   - Añadir branch Supabase en `lib/db/index.ts` (la abstracción ya está preparada)

2. **GPS real** — `app/chofer/hoy/page.tsx`
   - Reemplazar mock con `navigator.geolocation.watchPosition`
   - Endpoint `POST /api/gps` → insert en `bus_locations`
   - Supabase Realtime para que la posición llegue a estudiantes en tiempo real

3. **Cámara QR** — `app/chofer/escanear/page.tsx`
   - Integrar `jsQR` o `@zxing/browser` (requiere HTTPS + permisos de cámara)
   - El backend ya está: `db.scanQR(token, idChofer)` devuelve la reserva actualizada

4. **Email transaccional**
   - Confirmación de reserva al crear
   - Notificación de cancelación
   - Resend o SendGrid via Supabase Edge Functions

**Media prioridad (mejoras UX):**

5. **Mapa de paradas** en `app/app/rutas/[id]/page.tsx`
   - Usar MapLibre GL JS + tiles OpenStreetMap (gratuito, sin API key)
   - Las coordenadas ya están en el seed (lat/lng reales de cada parada)
   - Polilínea entre paradas + marcadores numerados

6. **Tracking en tiempo real** para estudiantes
   - Nueva página o sección en detalle de ruta que muestre posición del bus
   - Consume `bus_locations` via Supabase Realtime

7. **PWA**: `manifest.json` + service worker para instalación en móvil

8. **Push notifications**: alertas de cambio de estado de reserva

**Deuda técnica:**

9. Eliminar archivos legacy que no se usan:
   - `functions/` (Firebase/Genkit)
   - `firebase.json`, `apphosting.yaml`, `database.rules.json`
   *(Primero confirmar con el usuario si Firebase Hosting sigue siendo el target de deploy)*

10. `middleware.ts`: cuando se integre Supabase, verificar cookie `sb-access-token` y redirigir a `/login` si no existe o expiró

11. `app/admin/insights/page.tsx`: actualmente hace análisis puramente algorítmico. Cuando esté disponible `GEMINI_API_KEY`, añadir llamada a `POST /api/ai/insights` que agregue datos y use Gemini API para generar recomendaciones en lenguaje natural

---

## Requisitos del profesor (checklist)

1. ✅ Landing page pública
2. ✅ Registro/Login — rutas privadas detrás de auth
3. ✅ Home privado (dashboard por rol)
4. ✅ Página por ruta con horarios y paradas — **falta mapa** (pendiente #5)
5. ✅ Buscador por rutas/código/descripción
6. ⏳ Esquema SQL de base de datos — pendiente (Supabase migrations)
7. ⏳ Trigger `handle_new_user` — pendiente
8. ⏳ Validación de dominio `@usfq.edu.ec` — pendiente (en demo: cualquier correo funciona)
9. ✅ Validaciones en formulario de registro
10. ✅ Password ≥ 6 caracteres (validado en cliente)
11. ⏳ RLS en Supabase — pendiente
12. ✅ Ruta personal del usuario (campo `id_ruta` en `usuarios`)
13. ✅ Rutas/paradas privadas (detrás de auth — AppShell redirige a /login)
14. ✅ Responsive mobile

---

## Reglas críticas para la próxima IA

1. **Lee el README.md** antes de empezar — tiene la estructura de archivos actualizada.
2. **No hacer `git revert`** sin entender exactamente el efecto. En mayo 2026 un revert eliminó toda la carpeta `app/` y hubo que restaurar 21 páginas.
3. **No eliminar carpetas con bash** en el workspace montado de Windows.
4. **El sandbox Linux de Cowork no puede crear archivos en la carpeta Windows**: usa el `Write` tool de Cowork, nunca `touch`/`cp`/`echo >` para crear archivos nuevos.
5. **`npm install` desde Windows**, no desde el sandbox Linux (el mount no soporta node_modules correctamente).
6. **No inventar datos** que no estén en el seed (rutas, choferes, paradas, coordenadas).
7. **No proponer servicios pagos** sin permiso del usuario.
8. **Pregunta antes de salirte del plan**: si encontrás algo mejor, mencionarlo con justificación antes de implementar.
9. **Idioma**: UI y comentarios visibles en español. Variables y código en inglés. Commits en inglés.
10. **Quality bar**: cero pantallas en blanco, cero links rotos, cero "TODO" visibles en UI.

---

## Contactos reales

- `panchobus@usfq.edu.ec` — correo oficial del servicio
- Jairo Carvajal · `jcarvajal@usfq.edu.ec` · Coordinador de movilidad · Oficina PF104, Campus Cumbayá
- Sistema actual de referencia: app **Finder** (Opinno EC) — no integrar
- Sistema previo: **OnTrack** — no integrar

---

## Memoria persistente del usuario (Claude Cowork)

Archivos de memoria en:
`C:\Users\AlexAmaze\AppData\Roaming\Claude\local-agent-mode-sessions\...\memory\`
- `project_panchobus.md` — contexto completo del servicio real
- `user_alexander.md` — perfil de Alexander y preferencias de colaboración

Leerlos al iniciar sesión nueva en Cowork.
