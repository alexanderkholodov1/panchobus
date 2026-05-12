# Pancho Bus · USFQ

Plataforma web de gestión de transporte universitario para la Universidad San Francisco de Quito (USFQ).
Centraliza reservas de cupos, abordaje por QR, seguimiento operativo y comunicación entre estudiantes, personal de ruta y administración.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router, `"use client"` en páginas) |
| UI | Tailwind CSS + design system USFQ personalizado |
| Tipado | TypeScript |
| Auth / DB | **Demo mode**: store en memoria + localStorage · **Producción**: Supabase (Postgres + Auth + RLS) |
| Iconos | lucide-react |
| Fuentes | Inter (sans) + Libre Baskerville (display) |

## Estructura de directorios

```
panchobus/
├── app/
│   ├── page.tsx                  # Landing page pública
│   ├── login/page.tsx            # Login
│   ├── registro/page.tsx         # Registro de estudiantes
│   ├── layout.tsx                # Root layout (providers, fuentes, metadata)
│   ├── globals.css               # Variables CSS del design system
│   ├── admin/                    # Panel de administración (rol: admin)
│   │   ├── dashboard/page.tsx    # KPIs + salidas del día + top rutas
│   │   ├── rutas/page.tsx        # CRUD rutas
│   │   ├── buses/page.tsx        # Listado de buses y estados
│   │   ├── choferes/page.tsx     # Listado de personal de ruta
│   │   ├── asignaciones/page.tsx # Calendario semanal de salidas
│   │   ├── reservas/page.tsx     # Todas las reservas + búsqueda + CSV export
│   │   ├── usuarios/page.tsx     # Gestión de usuarios + crear conductores/admins
│   │   ├── mensajes/page.tsx     # Mensajes a usuarios o rutas completas
│   │   └── insights/page.tsx     # Análisis algorítmico de demanda
│   ├── app/                      # Panel de estudiante (rol: estudiante)
│   │   ├── inicio/page.tsx       # Dashboard personal con próxima reserva
│   │   ├── rutas/page.tsx        # Explorador de rutas con búsqueda
│   │   ├── rutas/[id]/page.tsx   # Detalle: paradas, operador, próximas salidas
│   │   ├── reservar/page.tsx     # Wizard 3 pasos: ruta → fecha → confirmar
│   │   ├── mis-reservas/page.tsx # Historial + próximas + cancelar
│   │   ├── mi-qr/page.tsx        # QR de abordaje activo
│   │   ├── horarios/page.tsx     # Calendario semanal de salidas
│   │   └── perfil/page.tsx       # Edición de perfil + preferencias de tema
│   └── chofer/                   # Panel de personal de ruta (rol: chofer)
│       ├── hoy/page.tsx          # Asignación del día + GPS mock + paradas
│       ├── pasajeros/page.tsx    # Lista de pasajeros de la asignación actual
│       ├── escanear/page.tsx     # Escáner QR (placeholder + input manual)
│       └── mensajes/page.tsx     # Inbox de mensajes de administración
├── components/
│   ├── brand/logo.tsx            # Logo SVG
│   ├── layout/
│   │   ├── app-shell.tsx         # Shell con sidebar (desktop) + dropdown (mobile)
│   │   ├── public-header.tsx     # Header de landing
│   │   └── public-footer.tsx     # Footer de landing
│   ├── providers/
│   │   ├── demo-session.tsx      # Contexto de sesión demo (base para Supabase)
│   │   └── theme-provider.tsx    # next-themes
│   └── ui/
│       ├── badge.tsx             # Variantes: success/warning/error/info/default
│       ├── button.tsx            # Con loading state y variantes
│       ├── card.tsx              # Card + CardBody
│       ├── input.tsx             # Input, Label, Select
│       ├── skeleton.tsx          # Skeleton loader
│       ├── theme-toggle.tsx      # Toggle claro/oscuro/sistema
│       └── toaster.tsx           # Toast notifications
├── lib/
│   ├── types.ts                  # Todos los tipos TypeScript del dominio
│   ├── utils.ts                  # cn(), initials(), formatDate()
│   ├── data/seed.ts              # Datos demo: 8 rutas, 47 paradas, 9 usuarios
│   ├── db/index.ts               # API de datos unificada (demo / Supabase)
│   └── supabase/                 # Clientes browser y server de Supabase
└── middleware.ts                 # Scaffold de protección de rutas
```

## Roles y acceso

| Rol | Ruta base | Cómo se crea |
|-----|-----------|-------------|
| `estudiante` | `/app/` | Se registra solo. Auto-aprobado al registrarse. |
| `admin` | `/admin/` | Creado manualmente por un admin desde `/admin/usuarios`. |
| `chofer` | `/chofer/` | Personal de ruta (conductores + acompañantes). Creado por admin. |

**Importante**: El rol `"chofer"` en código representa **todo el personal de ruta** — conductores y acompañantes que verifican QRs. En la UI se muestra como "Personal de Ruta". No renombrar el string `"chofer"` en código sin actualizar AppShell, redirects y seeds.

## Demo mode

Sin variables de entorno de Supabase, la app corre en modo demo completo:
- Store en memoria inicializado desde `lib/data/seed.ts`
- Reservas, mensajes y usuarios nuevos persisten en `localStorage` → clave `panchobus-store-overrides`
- Sesión persiste en `localStorage` → clave `panchobus-session-userid`
- Cuentas demo predefinidas: `demo-student` / `demo-admin` / `demo-driver` (accesibles desde login)

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=        # Opcional — activa modo Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Opcional
```

Sin estas variables, todo funciona en demo mode.

## Desarrollo local

```bash
cd panchobus
npm install
npm run dev     # http://localhost:3000
npm run build   # Verifica compilación TypeScript
npm run lint
```

## Design system

**Colores** (definidos en `tailwind.config.ts` + `globals.css`):
- `primary` → Rojo USFQ `#E11B22`
- `surface` / `surface-2` / `background` → capas de fondo (claro/oscuro automático)
- `state-ok` `#2A7D4F` · `state-warn` `#E89F1F` · `state-error` `#C13030`
- `usfq-red-tint` `#F9E8E8` → fondo suave para acentos rojos

**Tipografía**:
- `font-display` → Libre Baskerville (titulares, números grandes)
- `font-sans` → Inter (cuerpo)

Modo oscuro: strategy `class` via next-themes. Siempre soportar ambos modos.

---

## Estado actual (mayo 2026)

### ✅ Implementado y funcional

- Landing page pública
- Auth demo (login + registro + logout + refresh)
- AppShell responsive: sidebar desktop 256px + dropdown mobile
- Modo claro / oscuro / sistema
- **Admin** (9 páginas): dashboard KPIs, rutas CRUD, buses, conductores, calendario de asignaciones, reservas con búsqueda y export CSV, gestión de usuarios con creación de conductores/admins, mensajes, insights IA
- **Estudiante** (8 páginas): inicio, explorador de rutas, detalle de ruta, wizard de reserva con lista de espera automática, mis reservas, QR de abordaje, horarios semanales, perfil
- **Personal de ruta** (4 páginas): ruta de hoy con GPS mock, pasajeros, escáner QR (manual), mensajes
- Seed de datos realistas: 8 rutas de Quito/Cumbayá, 47 paradas con coordenadas reales, asignaciones dinámicas basadas en fecha actual

### 🔧 Pendiente — próximas IAs deben abordar esto

**Alta prioridad (producción):**
1. **Supabase**: crear schema SQL con las tablas de `lib/types.ts`, configurar RLS por rol, conectar auth real. La capa `lib/db/index.ts` está preparada para esta migración — solo añadir el branch Supabase al lado del demo.
2. **GPS real**: `chofer/hoy/page.tsx` tiene un mock. Reemplazar con `navigator.geolocation.watchPosition` → `POST /api/gps` → guardar en tabla `bus_locations`.
3. **Cámara QR**: `chofer/escanear/page.tsx` tiene placeholder de cámara. Integrar `jsQR` o `@zxing/browser`. Requiere HTTPS y permisos de cámara en producción.
4. **Email transaccional**: confirmación de reserva, cambios de estado (Resend o SendGrid vía Supabase Edge Functions).

**Media prioridad (UX):**
5. **Mapa interactivo** en `app/rutas/[id]`: mostrar paradas en mapa (Mapbox GL JS o Leaflet). Las coordenadas ya están en `lib/data/seed.ts`.
6. **Tracking en tiempo real**: página para estudiantes que muestra la ubicación del bus de su ruta.
7. **PWA**: añadir `manifest.json` y service worker para instalación en móvil.
8. **Push notifications**: Supabase Realtime para alertas de cambio de estado de reserva.

**Deuda técnica:**
9. Eliminar carpeta `functions/` (Firebase/Genkit legacy), `firebase.json`, `apphosting.yaml`, `database.rules.json` — no se usan.
10. `middleware.ts`: actualmente pass-through. Con Supabase, verificar cookie `sb-access-token` y redirigir a `/login`.
11. Añadir `createRuta` / `deleteBus` / etc. al `lib/db/index.ts` según crezca la funcionalidad admin.

---

## Historial crítico — leer antes de tocar el repo

- **NO hacer `git revert` sin entender exactamente qué hace**: en mayo 2026 un revert eliminó toda la carpeta `app/` y hubo que restaurar 21 páginas desde `origin/main`.
- **NO eliminar carpetas enteras** con bash en el workspace montado.
- **El sandbox Linux de Cowork no puede crear archivos en la carpeta Windows montada** — usar siempre el `Write` tool de Cowork, nunca `touch`/`echo >`/`cp` para crear archivos nuevos en el proyecto.
- **`npm install` debe correrse desde Windows** (terminal nativa), no desde el sandbox Linux.
- **El store en memoria se reinicia en cada recarga de servidor**: es por diseño del demo mode. Los datos solo persisten via `localStorage` en el cliente.
- **Los usuarios registrados se persisten en `db.addUsuario()`** (fix aplicado mayo 2026). Si ves "Desconocido" en admin/reservas, limpiar localStorage del navegador para resetear el store.
