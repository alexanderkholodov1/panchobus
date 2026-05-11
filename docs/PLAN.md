# Pancho Bus — Plataforma Web USFQ

**Plan de arquitectura y desarrollo · v1.0**
Alexander Kholodov · NRC 3081 · 2026

---

## 0. Resumen ejecutivo

Reconstrucción completa de la experiencia digital del servicio Pancho Bus de la USFQ como **plataforma web dedicada** (no embebida en Finder/OnTrack). Tres roles independientes con flujos diferenciados: **estudiante**, **administrador**, **chofer**. Stack moderno (Next.js + Supabase), desplegado en Firebase App Hosting desde GitHub. IA aplicada vía Genkit para insights de demanda y recomendaciones operativas. Diseño anclado a la identidad oficial USFQ. Transición compatible con el sistema heredado (OnTrack/Finder) sin sacrificar la calidad de la nueva plataforma.

---

## 1. Identidad visual (anclada al Manual USFQ oficial)

### 1.1 Paleta

| Token            | Hex       | Uso                                              |
| ---------------- | --------- | ------------------------------------------------ |
| `usfq-red`       | `#E11B22` | Primario, CTAs, rutas activas, marca             |
| `usfq-red-tint`  | `#F9E8E8` | Fondos suaves, chips activos, alerts             |
| `usfq-black`     | `#231F20` | Texto principal, contraste, modo oscuro base     |
| `usfq-gray`      | `#939598` | Texto secundario, bordes                         |
| `usfq-gray-50`   | `#F4F3F2` | Fondo app modo claro, inputs                     |
| `panchobus-orange` | `#F39200` | Acento secundario (toma del logo Panchobus)    |
| `state-ok`       | `#2A7D4F` | Bus disponible, a tiempo                         |
| `state-warn`     | `#E89F1F` | Demorado, atención                               |
| `state-error`    | `#C13030` | Ruta cancelada, error                            |

Cumple manual oficial (página 07 del PDF): rojo, negro, gris, blanco. Los funcionales se derivan respetando contraste WCAG AA.

### 1.2 Tipografía

- **Display / Headings**: `Libre Baskerville` (≡ Baskerville institucional)
- **Body / UI**: `Inter` (≡ Helvética Neue institucional)
- Jerarquía: H1 28, H2 22, H3 18, Body 16, Small 14, Button 14

### 1.3 Modo claro y oscuro

- **Claro**: fondo `usfq-gray-50`, superficies blancas, texto `usfq-black`
- **Oscuro**: fondo `#0F0E0E`, superficies `#1A1718`, texto `#F4F3F2`, rojo USFQ mantiene saturación
- Toggle persistente vía `localStorage`, respeta `prefers-color-scheme` por defecto

### 1.4 Idiomas

`es-EC` (default), `en`, `ru`. Implementación `next-intl`. Strings versionados.

---

## 2. Arquitectura técnica

### 2.1 Stack

| Capa            | Tecnología                                                       |
| --------------- | ---------------------------------------------------------------- |
| Frontend        | **Next.js 15 (App Router)** + TypeScript + Tailwind CSS          |
| UI primitives   | shadcn/ui + Radix (composable, sin lock-in)                      |
| Estado servidor | TanStack Query (caché, revalidación, optimistic updates)         |
| Estado cliente  | Zustand (sólo lo estrictamente necesario)                        |
| Forms / validación | React Hook Form + Zod                                         |
| Mapas           | MapLibre GL JS + tiles de OpenStreetMap / MapTiler (sin Google) |
| Auth + DB       | **Supabase** (Postgres + Auth + RLS + Storage + Realtime)        |
| IA              | Firebase **Genkit** (flows) + AI logic                           |
| Hosting         | **Firebase App Hosting** (SSR Next.js, CI/CD desde GitHub)       |
| i18n            | `next-intl`                                                      |
| Theming         | `next-themes` + CSS variables                                    |
| QR              | `qrcode` (generación) + `html5-qrcode` (escaneo admin)           |
| Observabilidad  | Sentry (errores) + Plausible (analytics privacy-friendly)        |

### 2.2 Organización del repositorio

```
panchobus/
├── apps/
│   └── web/                          # Next.js
│       ├── app/
│       │   ├── (public)/             # Landing, login, registro
│       │   │   ├── page.tsx
│       │   │   ├── login/
│       │   │   ├── registro/
│       │   │   └── about/
│       │   ├── (student)/            # Privado: estudiantes
│       │   │   ├── inicio/
│       │   │   ├── rutas/
│       │   │   │   └── [id]/
│       │   │   ├── reservar/
│       │   │   ├── mi-qr/
│       │   │   ├── horarios/
│       │   │   └── perfil/
│       │   ├── (admin)/              # Privado: administradores
│       │   │   ├── dashboard/
│       │   │   ├── rutas/
│       │   │   ├── paradas/
│       │   │   ├── buses/
│       │   │   ├── choferes/
│       │   │   ├── reservas/
│       │   │   ├── usuarios/
│       │   │   ├── insights/         # Genkit
│       │   │   └── mensajes/
│       │   ├── (driver)/             # Privado: choferes
│       │   │   ├── ruta-hoy/
│       │   │   ├── pasajeros/
│       │   │   ├── escanear/
│       │   │   └── mensajes/
│       │   ├── api/                  # Route handlers (server-only)
│       │   │   ├── reservas/
│       │   │   ├── qr/
│       │   │   ├── gps/              # POST de ubicación desde chofer
│       │   │   └── ai/               # endpoints Genkit
│       │   └── layout.tsx
│       ├── components/
│       │   ├── ui/                   # shadcn primitives
│       │   ├── brand/                # Logo, marca, ilustraciones
│       │   ├── map/                  # MapLibre wrappers
│       │   └── shared/
│       ├── lib/
│       │   ├── supabase/             # cliente, server, admin
│       │   ├── auth/                 # guards, role helpers
│       │   ├── i18n/
│       │   ├── ai/                   # Genkit client
│       │   └── utils/
│       ├── messages/                 # i18n strings (es, en, ru)
│       ├── public/
│       └── middleware.ts             # protección de rutas por rol
├── packages/
│   └── ai/                           # Genkit flows (separado)
│       ├── flows/
│       │   ├── demandInsights.ts
│       │   ├── routeRecommendations.ts
│       │   └── uxIssueDetection.ts
│       └── index.ts
├── supabase/
│   ├── migrations/                   # SQL versionado
│   ├── seed.sql
│   └── functions/                    # Edge Functions (opcional)
├── docs/
│   ├── PLAN.md                       # este archivo
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
├── .github/workflows/                # CI: lint, typecheck, build, deploy
├── apphosting.yaml                   # Firebase App Hosting config
├── package.json
├── tsconfig.json
└── README.md
```

### 2.3 Por qué este stack

- **Next.js App Router**: SSR para landing pública (SEO + carga rápida en redes débiles), client-side para áreas privadas. Es el estándar de la industria 2026 y Firebase App Hosting lo soporta nativamente.
- **Supabase**: el esquema actual ya está en Supabase; el trigger del profesor también. RLS basado en `auth.uid()` cumple las recomendaciones del docente. Realtime gratuito en plan Free para sincronizar reservas y ubicaciones.
- **Firebase App Hosting (Spark)**: deploy automático desde GitHub, dominio gratis, CDN global, SSR de Next.js soportado. Genkit y AI Logic se integran sin fricción.
- **MapLibre + OSM**: sin Google Maps API key, sin costos, fully customizable. La precisión es suficiente para el caso de uso.

### 2.4 Seguridad

- **RLS habilitado en todas las tablas** (recomendación explícita del profesor).
- **Policies por rol**: estudiantes solo leen sus reservas; admins lo ven todo; choferes solo su ruta asignada.
- **Service role key** únicamente en server-side (route handlers, Genkit). Nunca expuesta al cliente.
- **Validación de dominio @usfq.edu.ec / @estud.usfq.edu.ec** en signup (trigger + middleware).
- **Password ≥ 6 caracteres** (recomendación del profesor + límite de Supabase).
- **Rate limiting** en endpoints de reserva y escaneo QR.
- **CSP headers** vía middleware de Next.js.
- **QR firmado** (HMAC) para que no se pueda falsificar.

### 2.5 Performance & UX

- Mobile-first absoluto. Los screenshots de Finder muestran que el público real usa móvil.
- Server Components por defecto, Client Components solo donde haya interactividad.
- Imágenes vía `next/image`, fuentes vía `next/font` (preload + display swap).
- PWA opcional (manifest + service worker) para instalación en home screen.
- Accesibilidad WCAG AA: contraste, foco visible, navegación por teclado, ARIA labels.

---

## 3. Esquema de base de datos (extendido)

Punto de partida: tablas `paradas`, `rutas`, `usuarios` ya existentes. Extensión necesaria para cubrir todos los roles y funcionalidades.

### 3.1 Tablas existentes (a mantener con ajustes)

```sql
-- usuarios (extendida con rol y estado)
alter table usuarios
  add column rol text not null default 'estudiante'
    check (rol in ('estudiante','admin','chofer')),
  add column estado text not null default 'pendiente'
    check (estado in ('pendiente','activo','suspendido')),
  add column avatar_url text,
  add column idioma text default 'es',
  add column tema text default 'system' check (tema in ('light','dark','system'));

-- rutas (estado expandido)
alter table rutas
  add column codigo text unique,                  -- A1, B2, E1...
  add column color_hex text default '#E11B22',
  add column descripcion text,
  add column dias_operacion text[] default array['L','M','X','J','V'],
  add column estado text default 'activa'
    check (estado in ('activa','inactiva','suspendida'));

-- paradas (orden y tipo)
alter table paradas
  add column orden int not null default 0,
  add column tipo text default 'intermedia'
    check (tipo in ('origen','intermedia','destino'));
```

### 3.2 Tablas nuevas

```sql
-- buses (un bus puede operar varias rutas en distintos días/horarios)
create table buses (
  id_bus uuid primary key default gen_random_uuid(),
  placa text unique not null,
  modelo text,
  capacidad int not null,
  estado text default 'disponible'
    check (estado in ('disponible','mantenimiento','fuera_servicio')),
  id_chofer_asignado uuid references usuarios(id_usuario),
  created_at timestamptz default now()
);

-- asignaciones (qué bus + chofer corre qué ruta qué día)
create table asignaciones (
  id_asignacion uuid primary key default gen_random_uuid(),
  id_ruta int8 references rutas(id_ruta),
  id_bus uuid references buses(id_bus),
  id_chofer uuid references usuarios(id_usuario),
  fecha date not null,
  hora_salida time not null,
  hora_regreso time,
  estado text default 'programada'
    check (estado in ('programada','en_curso','completada','cancelada')),
  unique(id_bus, fecha, hora_salida)
);

-- reservas (un estudiante reserva un cupo en una asignación específica)
create table reservas (
  id_reserva uuid primary key default gen_random_uuid(),
  id_usuario uuid references usuarios(id_usuario) on delete cascade,
  id_asignacion uuid references asignaciones(id_asignacion) on delete cascade,
  estado text default 'confirmada'
    check (estado in ('confirmada','en_espera','cancelada','usada','no_show')),
  qr_token text unique not null,        -- HMAC firmado, único por reserva
  qr_escaneado_at timestamptz,
  qr_escaneado_por uuid references usuarios(id_usuario),
  posicion_waitlist int,                 -- null si confirmada
  created_at timestamptz default now(),
  unique(id_usuario, id_asignacion)
);

-- ubicaciones GPS (histórico ligero para tracking en vivo)
create table bus_locations (
  id bigserial primary key,
  id_bus uuid references buses(id_bus),
  id_asignacion uuid references asignaciones(id_asignacion),
  lat float8 not null,
  lng float8 not null,
  velocidad float4,
  reportado_at timestamptz default now()
);
-- Índice para queries "última ubicación de bus X"
create index on bus_locations(id_bus, reportado_at desc);

-- mensajes (admin <-> chofer; admin -> estudiantes por ruta)
create table mensajes (
  id_mensaje uuid primary key default gen_random_uuid(),
  remitente_id uuid references usuarios(id_usuario),
  -- destinatario puede ser usuario específico o ruta completa
  destinatario_id uuid references usuarios(id_usuario),
  destinatario_ruta int8 references rutas(id_ruta),
  asunto text,
  cuerpo text not null,
  leido_at timestamptz,
  created_at timestamptz default now(),
  check (destinatario_id is not null or destinatario_ruta is not null)
);

-- eventos analíticos (para Genkit/insights)
create table eventos (
  id bigserial primary key,
  id_usuario uuid references usuarios(id_usuario),
  tipo text not null,           -- 'pagina_vista','reserva','busqueda','error_ui',...
  payload jsonb,
  created_at timestamptz default now()
);
create index on eventos(tipo, created_at desc);
```

### 3.3 Trigger de signup (versión extendida del que dio el profesor)

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := new.email;
  v_dominio_valido boolean;
begin
  -- Validar dominio institucional
  v_dominio_valido := v_email like '%@usfq.edu.ec' or v_email like '%@estud.usfq.edu.ec';
  if not v_dominio_valido then
    raise exception 'Solo correos institucionales USFQ permitidos';
  end if;

  insert into public.usuarios (
    id_usuario, nombre, correo_electronico, codigo_banner,
    telefono, direccion, id_ruta, rol, estado
  ) values (
    new.id,
    new.raw_user_meta_data ->> 'nombre',
    v_email,
    new.raw_user_meta_data ->> 'codigo_banner',
    new.raw_user_meta_data ->> 'telefono',
    new.raw_user_meta_data ->> 'direccion',
    (new.raw_user_meta_data ->> 'id_ruta')::int8,
    coalesce(new.raw_user_meta_data ->> 'rol', 'estudiante'),
    'pendiente'  -- admin debe activar manualmente la primera vez
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 3.4 RLS — políticas clave

```sql
-- Habilitar RLS
alter table usuarios enable row level security;
alter table rutas enable row level security;
alter table paradas enable row level security;
alter table reservas enable row level security;
alter table asignaciones enable row level security;
alter table mensajes enable row level security;

-- Usuario ve su propio perfil; admin ve todos
create policy "usuario lee su perfil"
  on usuarios for select
  using (id_usuario = auth.uid() or
         exists (select 1 from usuarios u
                 where u.id_usuario = auth.uid() and u.rol = 'admin'));

-- Rutas: solo usuarios autenticados (recomendación profesor)
create policy "rutas privadas para autenticados"
  on rutas for select
  using (auth.uid() is not null);

-- Reservas: cada uno la suya; admin todas; chofer las de su asignación
create policy "reserva propia o admin o chofer asignado"
  on reservas for select
  using (
    id_usuario = auth.uid()
    or exists (select 1 from usuarios u where u.id_usuario = auth.uid() and u.rol = 'admin')
    or exists (select 1 from asignaciones a
               where a.id_asignacion = reservas.id_asignacion
               and a.id_chofer = auth.uid())
  );

-- Insert reserva: solo el propio usuario
create policy "estudiante crea su reserva"
  on reservas for insert
  with check (id_usuario = auth.uid());
```

(Resto de policies en `supabase/migrations/`.)

### 3.5 Realtime

Suscribir el cliente a:
- `bus_locations` filtradas por `id_asignacion` → marcador en mapa en vivo.
- `reservas` filtradas por `id_asignacion` → contador de cupos en tiempo real.
- `mensajes` filtradas por `destinatario_id = auth.uid()` → bandeja.

---

## 4. Experiencias por rol

### 4.1 Estudiante

| Pantalla            | Funcionalidad                                                                  |
| ------------------- | ------------------------------------------------------------------------------ |
| Landing pública     | Qué es Pancho Bus, cómo funciona, CTA a registro/login                         |
| Registro            | Email institucional, código Banner, nombre, teléfono, dirección, ruta preferida, password |
| Login               | Email + password; magic link opcional                                           |
| Inicio (privado)    | Saludo, próxima reserva, mapa de rutas cercanas, accesos rápidos                |
| Rutas               | Lista filtrable por barrio/horario/favoritas, buscador                          |
| Detalle de ruta     | Mapa, paradas con orden, horarios, cupos disponibles en vivo, botón "Reservar" |
| Reservar            | Fecha, trayecto (ida/vuelta), observaciones, confirmación                       |
| Mi QR               | QR firmado para abordar, válido el día de la reserva, recargable                |
| Mis reservas        | Histórico, próximas, cancelar                                                   |
| Horarios            | Vista semanal por ruta favorita                                                 |
| Perfil              | Editar datos, idioma, tema, ruta preferida, cerrar sesión                       |

**Flujo crítico — reserva:**
1. Estudiante elige ruta → ve cupos en vivo.
2. Si hay cupo: reserva confirmada, recibe QR.
3. Si llena: entra a lista de espera con posición. Notificación si se libera.
4. Día del viaje: muestra QR al chofer, este lo escanea, estado → `usada`.

### 4.2 Administrador

| Pantalla              | Funcionalidad                                                                       |
| --------------------- | ----------------------------------------------------------------------------------- |
| Dashboard             | KPIs: reservas hoy, ocupación promedio, rutas más demandadas, alertas              |
| Gestión de rutas      | CRUD completo, código, color, días, paradas (con coordenadas)                       |
| Gestión de paradas    | CRUD, drag-to-reorder, mapa interactivo                                             |
| Buses                 | Registrar, asignar chofer principal, estado                                         |
| Choferes              | Crear cuenta (rol chofer), datos, asignar a rutas, estado                           |
| Asignaciones          | Calendario: qué bus + chofer corre qué ruta cuándo                                  |
| Reservas              | Listado filtrable por ruta/fecha, exportar CSV, cancelar, marcar no_show           |
| Usuarios              | Aprobar/suspender estudiantes pendientes, ver perfil, asignar rol                   |
| Mensajes              | Enviar anuncios a chofer individual o ruta completa (alcanza a todos los estudiantes con reserva ese día) |
| **Insights (IA)**     | Resúmenes automáticos, recomendaciones de nuevas rutas/horarios, problemas UX       |

### 4.3 Chofer

| Pantalla        | Funcionalidad                                                                |
| --------------- | ---------------------------------------------------------------------------- |
| Mi ruta hoy     | Asignación del día, hora, paradas, mapa                                       |
| Pasajeros       | Lista de reservas con estado, contador escaneados / esperados                 |
| Escanear QR     | Cámara web, valida QR firmado, marca reserva como `usada`                     |
| Reportar GPS    | Botón "Iniciar ruta" → web app envía coordenadas (Geolocation API) cada 15s mientras esté en ruta |
| Mensajes        | Recibe anuncios del admin, puede responder                                    |

**GPS desde chofer (solución elegante sin app nativa):**
La PWA del chofer abre `navigator.geolocation.watchPosition()` y postea a `/api/gps` cada 15s mientras la asignación esté `en_curso`. Esto reemplaza OnTrack sin hardware adicional. El admin puede dar a cada chofer un celular USFQ con la PWA abierta, o usar el suyo.

### 4.4 Sitemap

```
/                          (landing pública)
/about
/login
/registro
/reset-password

/app/inicio                (estudiante)
/app/rutas
/app/rutas/[id]
/app/reservar
/app/mi-qr
/app/mis-reservas
/app/horarios
/app/perfil

/admin/dashboard
/admin/rutas, /admin/rutas/[id]
/admin/paradas
/admin/buses
/admin/choferes
/admin/asignaciones
/admin/reservas
/admin/usuarios
/admin/mensajes
/admin/insights

/chofer/hoy
/chofer/pasajeros
/chofer/escanear
/chofer/mensajes
```

Middleware verifica rol y redirige si no corresponde.

---

## 5. Capa de IA con Genkit

Cuatro flows iniciales, ejecutados desde el dashboard admin (on-demand) o por cron (`/api/ai/refresh` diario).

### 5.1 `demandInsights`

**Entrada**: agregados de últimos 30 días (reservas por ruta/hora, no_show, waitlist).
**Salida**: texto ejecutivo + tabla de "rutas saturadas vs subutilizadas" + alertas.

### 5.2 `routeRecommendations`

**Entrada**: histórico de demanda + códigos Banner por barrio (códigos postales aproximados).
**Salida**: propuestas concretas — "Considerar nueva ruta X-Cumbayá los martes 10:00, demanda estimada N pasajeros, beneficio: descongestiona ruta Y".

### 5.3 `uxIssueDetection`

**Entrada**: tabla `eventos` filtrada por `tipo = 'error_ui'` + abandono de flujos de reserva.
**Salida**: lista priorizada de fricciones detectadas + sugerencias.

### 5.4 `dailyDigest`

**Entrada**: snapshot del día (ocupación, no_shows, mensajes pendientes).
**Salida**: resumen breve para el admin al inicio del día, enviado por email.

Implementación: modelo Gemini (gratuito en Spark con cuota). Prompts versionados en `packages/ai/flows/`. Output validado con Zod schemas. Nunca se ejecutan flows con datos personales identificables — solo agregados.

---

## 6. Plan de transición desde Finder/OnTrack

Prioridad: **calidad del nuevo sistema**. La compatibilidad es bidireccional pero suave.

### 6.1 Migración de usuarios

- Importador CSV en admin: pegar lista de estudiantes ya registrados manualmente (Office PF104, Jairo Carvajal).
- Cada importación crea cuenta en estado `pendiente` y envía magic link al correo institucional para que el estudiante fije password.

### 6.2 GPS bridge

- **Solución propia (recomendada)**: choferes usan la PWA `/chofer/hoy` con geolocalización web. Cero dependencia de OnTrack.
- **Fallback temporal**: si OnTrack expone webhook o endpoint público, escribir un adaptador en `/api/gps/ontrack-bridge` que normalice a `bus_locations`. Documentar si/cuando se confirme acceso (vía Jairo Carvajal).

### 6.3 Comunicación con choferes (hoy informal vía WhatsApp/llamadas)

- Módulo `mensajes` reemplaza el canal informal.
- Mientras adopción está en curso: admin puede enviar anuncios por email también (paralelo, no rompe nada).

### 6.4 Convivencia con Finder

- Pancho Bus web vive en su propio dominio (sugerido: `panchobus.usfq.edu.ec` o subdominio Firebase mientras tanto).
- Finder puede seguir mostrando el link/iframe si la USFQ lo decide; no nos bloquea.
- El formulario externo de OnTrack queda como fallback hasta corte total — el admin decide cuándo desactivarlo.

### 6.5 Riesgos y mitigaciones

| Riesgo                                    | Mitigación                                                            |
| ----------------------------------------- | --------------------------------------------------------------------- |
| USFQ no aprueba dominio oficial           | Lanzar en subdominio Firebase, pedir DNS después                       |
| Choferes no adoptan PWA                   | Onboarding presencial + capacitación 30min; admin puede ingresar manualmente |
| GPS web menos preciso que OnTrack         | Validar en piloto con 1 ruta; ajustar frecuencia muestreo              |
| Resistencia al cambio (Jairo, autoridades)| Demo funcional + métricas claras + corrida paralela 4 semanas          |

---

## 7. Roadmap por fases

### Fase 0 — Setup (1 semana)

- Inicializar Next.js + TS + Tailwind + shadcn
- Conectar Supabase (proyecto, env vars)
- Configurar Firebase App Hosting + GitHub Actions
- Sistema de theming (claro/oscuro) + i18n base
- Componentes brand (logo Panchobus, dragón USFQ, paleta como CSS variables)

### Fase 1 — Entrega académica (3-4 semanas) — **prioridad inmediata**

Cubre los requisitos del profesor textualmente:
- Landing pública explicativa
- Registro/Login con validación de dominio USFQ + Banner + teléfono + password ≥6
- Home privado
- Página de cada ruta con horarios, paradas, mapa
- Buscador por rutas/horas/paradas
- Esquema BD documentado + RLS habilitado + trigger del profesor
- Responsive móvil
- Deploy en Firebase

**Diferenciador vs avance previo**: ya en esta fase entregamos modo claro/oscuro, i18n base, identidad pulida, mapa real (MapLibre) — no placeholders.

### Fase 2 — Reservas + QR (2-3 semanas)

- Sistema de reservas con cupos en vivo
- QR firmado por reserva
- Waitlist
- Notificaciones email
- Vista "mis reservas"

### Fase 3 — Admin completo (3 semanas)

- Dashboard con KPIs
- CRUD rutas/paradas/buses/choferes/asignaciones
- Gestión de usuarios
- Módulo mensajes
- Exportación CSV

### Fase 4 — Chofer + GPS (2 semanas)

- Rol chofer + PWA
- Escaneo QR
- Reporte de ubicación
- Mapa en vivo para estudiantes

### Fase 5 — IA Insights (2 semanas)

- Flows Genkit
- Pantalla de insights en admin
- Daily digest por email

### Fase 6 — Producción y hardening (1-2 semanas)

- Sentry, Plausible
- Tests E2E (Playwright) en flujos críticos
- Auditoría de seguridad (RLS, headers, secrets)
- Documentación final para handover a USFQ

**Total estimado**: ~14-17 semanas para producción completa. La entrega del curso queda satisfecha en la Fase 1.

---

## 8. Decisiones abiertas (a confirmar contigo antes de codificar)

1. **Dominio**: ¿proponemos `panchobus.usfq.edu.ec` a la universidad o lanzamos primero en subdominio Firebase?
2. **Mapas**: ¿MapLibre + OSM (gratis) o pagar MapTiler/Mapbox por mejor estilo? Empezar con OSM y migrar si hace falta.
3. **Notificaciones push**: ¿en Fase 2 o Fase 4? Implica solicitar permiso al usuario y service worker. Email cubre el 80%.
4. **Genkit en Firebase Spark**: confirmar cuotas — si se queda corto, podemos cachear resultados diarios en lugar de on-demand.
5. **Logo Panchobus**: ¿tenés el SVG/AI original o lo recreo a partir del PNG que vi en los uploads?

---

## 9. Siguiente acción concreta

Al aprobar este plan:

1. Inicializar el repositorio con Fase 0 (setup técnico).
2. Levantar proyecto Supabase y aplicar migración inicial (esquema extendido + RLS + trigger).
3. Construir landing pública + login/registro con identidad USFQ aplicada — ya entregable para evaluación parcial del curso.

Esperamos tu OK o ajustes sobre alcance/orden antes de empezar a escribir código.
