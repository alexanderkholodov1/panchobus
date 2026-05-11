# AI_CONTEXT.md — Lectura obligatoria para cualquier IA que continúe este proyecto

## Qué es esto

**Pancho Bus** es el servicio gratuito de transporte universitario de la **Universidad San Francisco de Quito (USFQ)**, Cumbayá, Ecuador. ~9.000 estudiantes lo usan a diario. Hoy vive embebido como pestaña en la app **Finder** (construida por Opinno EC), con UX primitiva, baja adopción (1K descargas, 3.0★) y procesos manuales (registro presencial en oficina PF104, formulario externo en OnTrack, comunicación informal con choferes).

**Este repositorio** es la reconstrucción completa: una plataforma web dedicada, moderna, con tres roles (estudiante, admin, chofer), reservas con QR, mapa en vivo y analytics con IA.

## Contexto humano — léelo antes de tocar nada

- **Es un proyecto académico** del curso Desarrollo Web 2 (NRC 3081, USFQ, Prof. Andrés Eduardo Parra Sánchez) entregable mañana del momento de redacción inicial.
- **PERO** es también un escaparate profesional: el autor (Alexander Kholodov, estudiante CS USFQ) busca que las autoridades de la USFQ y/o Jairo Carvajal (coordinador de movilidad, jcarvajal@usfq.edu.ec, oficina PF104) vean el prototipo y consideren contratarlo para construir la versión real. **Cada decisión de diseño, copy y arquitectura debe sostener esa doble lectura: cumple los requisitos del curso Y demuestra capacidad profesional para reemplazar el sistema actual de la universidad.**
- No suene a tarea académica; suene a producto. Cero placeholder text, cero "Lorem ipsum", cero copy genérico. Todo en la voz de marca USFQ ("Tu libertad, comienza aquí").

## Requisitos del profesor (cumplimiento obligatorio)

Del enunciado original:
1. Landing page pública que explica el servicio.
2. Registro/Login (rutas/paradas/horarios solo para autenticados).
3. Home privado.
4. Página por ruta con horarios, paradas y mapa.
5. Buscador por rutas/horas/paradas.
6. Esquema de base de datos.
7. Trigger SQL `handle_new_user` para insertar en `public.usuarios` cuando se crea un `auth.users`.
8. Validar dominios `@usfq.edu.ec` y `@estud.usfq.edu.ec`.
9. Validar correo, código Banner y teléfono en registro.
10. Password ≥ 6 caracteres (límite Supabase).
11. RLS habilitado con políticas por rol.
12. Ruta personal del usuario guardada en tabla `usuarios`.
13. Rutas y paradas privadas (solo autenticados).
14. Responsive mobile.

**Backend exigido**: Supabase (Postgres + Auth + RLS). El usuario personalmente prefiere Firestore/Realtime DB pero por exigencia pedagógica vamos con Supabase. **Mantener capa `lib/db/index.ts` como abstracción** — el día que migre a Firestore, solo se reemplaza ese archivo.

**Hosting exigido por el usuario**: Firebase App Hosting (plan Spark gratuito), deploy automático desde GitHub. Dominio probable: `panchobus.web.app` o similar.

## Stack y decisiones tomadas

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind | SSR para landing (SEO), client para áreas privadas, soportado por Firebase App Hosting |
| Auth + DB | Supabase (Postgres + Auth + RLS + Realtime) | Lo pidió el profesor; el esquema base ya existía |
| Mapas | MapLibre GL JS + tiles OpenStreetMap | **Gratuito**, sin API key, sin Google Maps |
| IA | Gemini API (free tier) directo, NO Genkit | Genkit añadía complejidad sin valor para el prototipo. Gemini free es suficiente |
| QR | `qrcode` (gen) + `html5-qrcode` (scan) | Cliente puro, sin backend pesado |
| i18n | `next-intl` | es-EC default, en, ru |
| Theming | `next-themes` + CSS variables | Modo claro/oscuro persistente |
| Hosting | Firebase App Hosting (Spark) | Lo pidió el usuario, gratuito |

**TODO lo que se use debe ser gratuito.** No proponer servicios pagos sin permiso explícito.

## Identidad visual (anclada al Manual USFQ oficial)

Verificado contra `USFQ MANUAL IDENTIDAD.pdf` p. 07 + manual de inspiración 2024.

**Paleta**:
- `#E11B22` Rojo USFQ (primario)
- `#231F20` Negro USFQ
- `#939598` Gris USFQ
- `#FFFFFF` Blanco
- `#F39200` Naranja Panchobus (del logo PNG original)
- `#F9E8E8` Rojo claro · `#2A7D4F` Verde estado · `#E89F1F` Warn · `#C13030` Error

**Tipografía**: Libre Baskerville (display, ≡ Baskerville institucional) + Inter (body, ≡ Helvética institucional). Cargadas vía `next/font`.

**Voz de marca**: institucional pero moderna, alta legibilidad, contraste fuerte. Slogan núcleo: **"Tu libertad, comienza aquí"**. Espíritu del dragón USFQ: Libertad, Sabiduría, Poder, Visión, Fuerza, Energía, Belleza, Originalidad, Bienestar, Bondad, Permanencia, Evolucionar.

**No usar emojis** en UI ni en código (solo si el usuario los pide explícitamente).

## Modelo de datos — fuente de verdad

Definido en `lib/types.ts`. Extiende el esquema base del profesor (paradas, rutas, usuarios) con:

- `usuarios` con campos `rol` ('estudiante'|'admin'|'chofer'), `estado` ('pendiente'|'activo'|'suspendido'), `idioma`, `tema`
- `buses` (id, placa, modelo, capacidad, estado, chofer asignado)
- `asignaciones` (qué bus + chofer corre qué ruta qué día, cupos)
- `reservas` (con qr_token firmado, posicion_waitlist, estado: confirmada/en_espera/cancelada/usada/no_show)
- `bus_locations` (GPS histórico ligero)
- `mensajes` (admin↔chofer, admin→ruta completa)
- `eventos` (analytics para los flows IA)

**Seed completo** en `lib/data/seed.ts`: 8 rutas reales del Pancho Bus USFQ con coordenadas de paradas reales en Quito/Cumbayá, choferes y buses ficticios pero plausibles, reservas demo del usuario `demo-student`.

## Tres cuentas demo

Login con un click desde `/login`:
- **Estudiante**: `demo-student` (Alexander Kholodov, ruta Lumbisí)
- **Admin**: `demo-admin` (Jairo Carvajal — persona real, coordinador USFQ)
- **Chofer**: `demo-driver` (Carlos Mendoza, ruta Lumbisí)

Auth real (login por credenciales y registro) también funciona contra los mismos datos seed.

## Estado actual del código (snapshot)

**Listo y funcional**:
- Setup completo: package.json, tsconfig, tailwind, postcss, next.config, .env.example, .gitignore
- Identidad: globals.css con CSS variables (claro/oscuro), `app/layout.tsx` con fonts, `components/brand/logo.tsx` (logo SVG recreado: pin con bus dentro, gradiente naranja→rojo, texto "Pancho" rojo + "bus" naranja)
- Tipos: `lib/types.ts` completo
- Seed: `lib/data/seed.ts` con 8 rutas, 47 paradas, 9 usuarios, 8 buses, 8 asignaciones, 5 reservas, 3 mensajes
- Capa DB: `lib/db/index.ts` (abstracción mock + persistencia localStorage para reservas/mensajes/usuarios creados en sesión)
- Supabase clients: `lib/supabase/client.ts` y `lib/supabase/server.ts` (devuelven null si no hay env, fallback automático a mocks)
- Sesión: `components/providers/demo-session.tsx` (login por rol, por credenciales, registro)
- UI primitives: button, input, label, select, textarea, card, badge, theme-toggle, skeleton, toaster
- Layout: public-header, public-footer, app-shell (sidebar desktop + drawer mobile, 3 navegaciones según rol)
- Páginas listas: `/` landing pública (hero rojo, cómo funciona, rutas activas, diferenciadores, CTA), `/login` (form + 3 botones demo), `/registro` (form completo con todas las validaciones del profesor)

**FALTANTE — prioridades para la próxima sesión IA**:

Por orden de importancia para la demo:

1. **Áreas privadas** (`app/(student)/`, `app/(admin)/`, `app/(chofer)/`) — todas las rutas del sitemap definido en `app-shell.tsx`. Las pestañas existen en la nav pero las páginas no.
2. **Componente Map** (`components/map/route-map.tsx`) usando MapLibre GL JS + tiles OSM (https://demotiles.maplibre.org o https://tile.openstreetmap.org). Debe dibujar polilínea entre paradas + marcadores numerados + marcador animado del bus si hay `bus_locations`.
3. **Generación de QR** en `/app/mi-qr` con paquete `qrcode` (cliente). El token ya existe en `reserva.qr_token`.
4. **Escaneo QR** en `/chofer/escanear` con `html5-qrcode`. Llama `db.scanQR(token, idChofer)`.
5. **Endpoint IA** `app/api/ai/insights/route.ts`: POST agrega datos de reservas/asignaciones, llama Gemini API con `GEMINI_API_KEY`, devuelve JSON con `resumen`, `rutas_saturadas`, `recomendaciones`. Pantalla `/admin/insights` lo consume.
6. **Middleware** `middleware.ts` para proteger `/app/*`, `/admin/*`, `/chofer/*` (en demo: redirige a `/login` si no hay cookie/localStorage).
7. **Buscador** en `/app/rutas` (filtro client-side por nombre/código/parada/hora).
8. **Realtime simulado**: en página de detalle de ruta, refrescar cupos cada 10s desde `db.getAsignacion()`.
9. **`apphosting.yaml`** en raíz: `runConfig: { cpu: 1, memoryMiB: 512, maxInstances: 1 }` para que App Hosting lo despliegue.
10. **`firebase.json`** con apphosting backend.

**Archivos del proyecto** (todos en `panchobus/`):
```
app/
  globals.css, layout.tsx, page.tsx
  login/page.tsx, registro/page.tsx
components/
  brand/logo.tsx
  providers/theme-provider.tsx, demo-session.tsx
  ui/button.tsx, input.tsx, card.tsx, badge.tsx, theme-toggle.tsx, skeleton.tsx, toaster.tsx
  layout/public-header.tsx, public-footer.tsx, app-shell.tsx
lib/
  utils.ts, types.ts
  data/seed.ts
  db/index.ts
  supabase/client.ts, server.ts
docs/
  PLAN.md (plan completo original)
package.json, tsconfig.json, tailwind.config.ts, postcss.config.mjs
next.config.mjs, next-env.d.ts, .env.example, .gitignore
```

## Reglas de comportamiento para la próxima IA

1. **DOCUMENTA TODO**. Cada archivo nuevo lleva docstring arriba explicando propósito y decisiones no obvias. Cada función pública con JSDoc. Si añades una librería, justifica por qué en `docs/ARCHITECTURE.md`. Si tomás una decisión arquitectónica nueva, regístrala en `docs/DECISIONS.md` (formato ADR corto). **Es regla del usuario, no negociable.**
2. **Pregunta antes de salirte del plan.** Si encontrás una solución mejor que la planeada, mencionarla con justificación antes de cambiar rumbo. No te tomes libertades silenciosas.
3. **Cero alucinaciones.** No inventes nombres de rutas, choferes, datos USFQ que no estén en el seed. Si algo es ficticio, márcalo. Si una librería no existe en la versión mencionada, decir.
4. **Solo opciones gratuitas.** No proponer servicios pagos.
5. **Idioma**: Español por defecto en UI y comentarios visibles. Variables y código en inglés (estándar industria). Mensajes commit en inglés.
6. **No emojis** salvo que el usuario los use primero.
7. **No redundancia conversacional**. El usuario es CS, conciso, valora velocidad y precisión. No repitas su pregunta, no resumas lo que vas a hacer, hacelo.
8. **Mantené el seed cómo single source of truth** del prototipo. Si agregás funcionalidad que necesita más datos, agregá al seed, no improvises en componentes.
9. **Cualquier flujo nuevo (UI o backend) debe tener equivalencia conceptual en Supabase** para que la migración sea trivial: si llamás `db.createReserva()` el equivalente SQL ya está documentado en `docs/PLAN.md` §3.
10. **Quality bar**: el prototipo debe poder mostrarse a Jairo Carvajal o a un decano sin que se note que es académico. Cero "TODO" visibles, cero pantallas en blanco, cero links rotos.

## Contactos reales (no inventar otros)

- `panchobus@usfq.edu.ec` — correo oficial del servicio
- Jairo Carvajal · `jcarvajal@usfq.edu.ec` · Coordinador de movilidad · Oficina PF104, Campus Cumbayá
- Sistema actual: app **Finder** (Opinno EC) en Play Store / App Store — referencia, no integrar
- Sistema previo: **OnTrack** — referencia, no integrar

## Memoria persistente del usuario

El usuario tiene memoria activa en `C:\Users\AlexAmaze\AppData\Roaming\Claude\local-agent-mode-sessions\f3c9289f-26bb-4ced-934a-5e46d6326038\3268234a-505b-48fc-ba0b-40a7bffa90d7\spaces\d07750da-eed2-4634-a202-fe05464e6b35\memory\` — leela al iniciar sesión nueva. Contiene `project_panchobus.md` (contexto completo del servicio real) y `user_alexander.md` (perfil del usuario y preferencias de colaboración).
