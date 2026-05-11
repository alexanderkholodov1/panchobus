# Pancho Bus · USFQ

> **Tu libertad, comienza aquí.**

Plataforma web dedicada para el servicio de transporte universitario **Pancho Bus** de la Universidad San Francisco de Quito. Reservas con QR, tracking en tiempo real, gestión administrativa y analytics con IA — todo en una sola experiencia.

## ¿Qué resuelve?

Hoy el servicio Pancho Bus vive embebido como una pestaña en la app general **Finder**, con UX primitiva, registro presencial en oficina PF104, formulario externo OnTrack para reservas y comunicación informal con choferes. Esta plataforma reemplaza ese flujo disperso por una experiencia unificada y autoservicio para los ~9.000 estudiantes USFQ.

## Características

**Estudiante**
- Registro autoservicio con correo institucional `@usfq.edu.ec` / `@estud.usfq.edu.ec`
- Mapa interactivo de rutas con paradas, horarios y estado del bus en tiempo real
- Reservas con cupos visibles en vivo y lista de espera automática
- Código QR único por reserva para abordar
- Buscador por ruta, hora y parada
- Modo claro/oscuro y multiidioma (es/en/ru)

**Administrador**
- Dashboard con KPIs operativos y alertas
- CRUD de rutas, paradas, buses, choferes y asignaciones
- Aprobación de cuentas, gestión de usuarios
- Mensajería directa a choferes y estudiantes por ruta
- **Insights con IA**: detección de rutas saturadas, recomendación de nuevos horarios, análisis de demanda

**Chofer**
- Vista de la ruta del día con paradas y mapa
- Lista de pasajeros esperados
- Escaneo de QR para validar abordaje
- Reporte GPS desde la PWA del chofer (reemplaza OnTrack sin hardware adicional)
- Comunicación con administración

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Auth + DB | Supabase (Postgres + Auth + RLS + Realtime) |
| Mapas | MapLibre GL JS + OpenStreetMap |
| IA | Gemini API (free tier) |
| QR | `qrcode` (gen) + `html5-qrcode` (scan) |
| Hosting | Firebase App Hosting (Spark, gratuito) |
| i18n | `next-intl` |
| Theming | `next-themes` |

Todo el stack es **gratuito** en sus tiers free.

## Arranque local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables (opcional para modo demo)
cp .env.example .env.local
# Edita .env.local con tus credenciales Supabase si quieres persistencia real

# 3. Levantar
npm run dev
```

Abrí http://localhost:3000

**Modo demo** (sin Supabase configurado): los datos viven en memoria + localStorage. La página `/login` ofrece acceso instantáneo como Estudiante / Admin / Chofer.

**Modo Supabase real**:
1. Crear proyecto en https://supabase.com (free tier).
2. Ejecutar migraciones (próximas en `supabase/migrations/`).
3. Pegar las claves en `.env.local`.

## Despliegue en Firebase App Hosting

```bash
# Una sola vez
npm install -g firebase-tools
firebase login
firebase init apphosting
# Conectá el repo de GitHub y elegí branch main

# Cada push a main despliega automáticamente
git push origin main
```

El dominio será del tipo `panchobus.web.app` o el que configures.

## Estructura del proyecto

```
app/                  Rutas Next.js (App Router)
  ├── (public)        Landing, login, registro
  ├── (student)       Área estudiante privada
  ├── (admin)         Área administrativa
  ├── (chofer)        Área chofer
  └── api             Route handlers (server-only)
components/
  ├── brand/          Logo, marca
  ├── ui/             Primitivos (button, card, input...)
  ├── layout/         Headers, footers, app shell
  ├── map/            Wrappers MapLibre
  └── providers/      Theme, sesión
lib/
  ├── types.ts        Tipos del dominio
  ├── utils.ts        Helpers (formatTime, haversine...)
  ├── data/seed.ts    Datos sembrados (rutas reales USFQ)
  ├── db/             Capa de acceso a datos (abstracción mock/Supabase)
  └── supabase/       Clientes browser y server
docs/                 Documentación técnica
supabase/             Migraciones SQL
```

## Cumplimiento de requisitos académicos

Curso: **Desarrollo Web 2 · NRC 3081 · USFQ · Prof. Andrés Eduardo Parra Sánchez**

| Requisito | Implementación |
|---|---|
| Landing pública explicativa | `app/page.tsx` |
| Registro/Login con dominio USFQ | `app/login/`, `app/registro/` con validación regex |
| Home privado | `app/(student)/inicio/` |
| Página por ruta (horarios, paradas, mapa) | `app/(student)/rutas/[id]/` |
| Buscador rutas/horas/paradas | `app/(student)/rutas/` |
| Esquema BD documentado | `docs/PLAN.md` §3 + `supabase/migrations/` |
| Trigger `handle_new_user` | `supabase/migrations/0001_init.sql` |
| Validación correo, Banner, teléfono | `app/registro/page.tsx` |
| Password ≥ 6 caracteres | Validación cliente + límite Supabase |
| RLS habilitado con policies | `supabase/migrations/0001_init.sql` |
| Ruta personal en `usuarios.id_ruta` | Esquema base (mantenido) |
| Rutas/paradas privadas | Middleware + RLS |
| Responsive móvil | Tailwind mobile-first, probado |
| Despliegue Firebase | `apphosting.yaml` + GitHub Actions |

## Documentación

- `docs/PLAN.md` — Plan completo de arquitectura y desarrollo
- `AI_CONTEXT.md` — Contexto para asistentes IA que continúen el proyecto
- `docs/PRESENTACION.md` — Guía para presentar el proyecto

## Equipo

Alexander Kholodov (00332509) · Josué Ponce (00330341)
Universidad San Francisco de Quito · Cumbayá, Ecuador

## Contacto del servicio (USFQ)

- panchobus@usfq.edu.ec
- Jairo Carvajal · jcarvajal@usfq.edu.ec · Oficina PF104

## Licencia

Proyecto académico — uso interno USFQ.
