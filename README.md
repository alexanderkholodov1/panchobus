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
NEXT_PUBLIC_SUPABASE_