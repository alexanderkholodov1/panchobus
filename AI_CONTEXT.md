# AI_CONTEXT.md — Contexto para cualquier IA que continúe este proyecto

> Leer completo antes de tocar archivos. Las secciones "Datos" y "Reglas" son las más importantes.

---

## Qué es esto

**Pancho Bus** es una plataforma web de reserva y operación de transporte universitario, construida como proyecto de portafolio para la materia Desarrollo Web II (USFQ). Propone reemplazar un proceso fragmentado (horarios en PDF, cupos que se agotaban temprano, abordaje con stickers tras hacer fila, sin canal para avisar retrasos o cambios de ruta) por una sola plataforma con tres roles: estudiante, administración y personal de ruta.

No es un servicio oficial ni está afiliado a la universidad. Todos los datos de la demo son sintéticos.

---

## Stack

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | Next.js 14 App Router | Todas las páginas son `"use client"` |
| UI | Tailwind CSS + variables CSS en `globals.css` | Modo claro/oscuro con next-themes (`class`) |
| Tipado | TypeScript estricto | Tipos en `lib/types.ts` |
| i18n | Diccionarios tipados propios | `lib/i18n/es.ts` es la fuente; `en.ts` debe cumplir el tipo `Dict` |
| Datos | Demo: store en memoria + localStorage · Opcional: Supabase | `lib/db/index.ts`, flag `IS_SUPABASE` |
| Mapas | Leaflet por CDN (unpkg) + OpenStreetMap | `app/app/rutas/[id]` |
| QR | `qrcode` (generación), jsQR por CDN (lectura con cámara) | |
| Iconos | lucide-react | |
| Deploy | Firebase App Hosting desde `main` | Sin variables Supabase corre en modo demo |

Todo debe ser gratuito. No proponer servicios pagos sin permiso.

---

## Idiomas (ES / EN)

- `I18nProvider` (`lib/i18n/index.tsx`) guarda el idioma en `localStorage["panchobus-lang"]`; por defecto usa el idioma del navegador (español → `es`, cualquier otro → `en`).
- `useI18n()` expone `t`, `lang`, `setLang`, `fmtDate`, `fmtTime`, `fmtDateTime`, `fmtRelative` y `localized(obj, campo)`, que lee `campo_en` cuando el idioma es inglés.
- Contenido de datos bilingüe: `Ruta.descripcion_en`, `Mensaje.asunto_en`, `Mensaje.cuerpo_en`.
- Ningún texto visible va hardcodeado en los `.tsx`: todo sale de los diccionarios. Si agregas una clave en `es.ts`, el compilador exige agregarla en `en.ts`.

---

## Datos (todos sintéticos)

`lib/data/seed.ts` genera la demo de forma determinística y relativa a la fecha actual:

- 8 rutas ficticias con códigos C1, N1–N3, S1–S2, V1–V2 hacia barrios públicos de Quito y los valles (V2 suspendida). 37 paradas con coordenadas aproximadas.
- 47 usuarios con nombres inventados y dominios `estud.campus.example` / `campus.example` (dominios reservados, no reales). Teléfonos `+593 99 000 01xx`, placas `PZA-41xx`.
- 9 buses, ~108 salidas (desde 3 días atrás hasta 6 días adelante), ~146 reservas, 5 mensajes bilingües.
- Los estados de las salidas de hoy siguen al reloj (realizada / en curso / programada).

Cuentas demo: estudiante **Valeria Castro**, administración **Daniela Ruiz**, personal de ruta **Martín Guerrero** (ruta C1).

`SEED_VERSION` versiona el store guardado. Si cambias el seed, sube la versión para que los navegadores descarten datos viejos.

**No introducir datos reales**: ni nombres de personas, ni correos o dominios institucionales, ni códigos Banner, ni rutas u horarios oficiales.

---

## Modo demo y persistencia

- Sin `NEXT_PUBLIC_SUPABASE_URL`, la app corre en modo demo.
- El store se guarda en `localStorage["panchobus-demo-store"]` con versión y fecha; se regenera al cambiar de día o de `SEED_VERSION`. La clave antigua `panchobus-store-overrides` se elimina al cargar.
- Sesión: `localStorage["panchobus-session-userid"]`.
- El botón de información (i) permite reiniciar la demo (`db.resetDemo()`).

---

## Roles

| Rol en código | URL base | Nombre en UI |
|------|----------|-------------|
| `estudiante` | `/app/` | Estudiante / Student |
| `admin` | `/admin/` | Administración / Administration |
| `chofer` | `/chofer/` | Personal de ruta / Route staff |

`AppShell` redirige por rol y a `/login` sin sesión. `middleware.ts` es un scaffold: deja pasar todo en modo demo y necesitaría Supabase SSR para producción.

---

## Pantallas

- Públicas: landing, login (acceso demo por rol), registro, 404.
- Estudiante (8): inicio, rutas, detalle de ruta con mapa, reservar, mis reservas, mi QR, horarios, perfil.
- Administración (9): dashboard, rutas, buses, personal, asignaciones, reservas (CSV), usuarios, mensajes (usuario, ruta o todos), análisis de demanda (reglas, sin modelo de IA).
- Personal de ruta (4): hoy (GPS del navegador), pasajeros, escanear QR (cámara o manual), mensajes.

Reglas de negocio implementadas: una reserva activa por persona y salida; lista de espera automática y promoción al cancelar; el escaneo rechaza QR cancelados, usados o en espera.

---

## Pendiente

1. Middleware real con Supabase SSR.
2. Seguimiento del bus en vivo para estudiantes (la suscripción Realtime existe en el detalle de ruta, solo con Supabase).
3. Notificaciones por correo (confirmación y cancelación).
4. Decidir si se eliminan los restos de Firebase Functions/Genkit en `functions/` (confirmar con el autor).

---

## Reglas para la próxima IA

1. No inventar ni reintroducir datos reales (ver "Datos").
2. Mantener ES y EN completos; nada de texto visible fuera de los diccionarios.
3. Mantener modo claro y oscuro funcionales en cada componente nuevo.
4. Nunca eliminar el fallback a modo demo: la app debe funcionar sin variables de entorno.
5. Usar las utilidades de fecha local (`localISODate`, `addDaysISO`, `parseISODate`) en lugar de `toISOString().slice(0, 10)`, que desplaza el día en UTC-5.
6. Preguntar antes de salirse del plan acordado.
7. Código e identificadores en inglés; commits en inglés.
8. No commitear `.env.local`.
9. Verificar con `npx tsc --noEmit`, `npx next lint` y `npx next build` antes de subir cambios.
