# Pancho Bus · USFQ

> **Tu libertad, comienza aquí.**

Plataforma digital para el servicio de transporte universitario **Pancho Bus** de la Universidad San Francisco de Quito. Reservas con QR, seguimiento operativo y gestión administrativa en una sola experiencia.

## ¿Qué resuelve?

El servicio Pancho Bus necesita una experiencia clara y moderna para reservas, abordaje y comunicación. Esta plataforma reemplaza procesos dispersos por un flujo unificado, verificable y orientado a la operación diaria.

## Características

**Estudiante**
- Registro autoservicio con correo institucional `@usfq.edu.ec` / `@estud.usfq.edu.ec`
- Mapa interactivo de rutas con paradas, horarios y estado del bus en tiempo real
- Reservas con cupos visibles en vivo y lista de espera automática
- Código QR único por reserva para abordar
- Buscador por ruta, hora y parada
- Modo claro/oscuro y experiencia mobile-first

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

## Documentación

- `docs/PLAN.md` — Plan completo de arquitectura y desarrollo
- `AI_CONTEXT.md` — Contexto para asistentes IA que continúen el proyecto
- `docs/PRESENTACION.md` — Guía para presentar el proyecto

## Contacto del servicio (USFQ)

- panchobus@usfq.edu.ec
- Jairo Carvajal · jcarvajal@usfq.edu.ec · Oficina PF104

## Licencia

Uso interno USFQ.
