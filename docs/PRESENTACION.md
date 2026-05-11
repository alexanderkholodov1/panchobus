# Guía de presentación — Pancho Bus

Documento para Alexander al presentar la plataforma. Resume la arquitectura, las decisiones clave y el guion de demo.

---

## 1. La historia que contás

> "Pancho Bus es el servicio de transporte universitario de la USFQ. Hoy opera con flujos dispersos y poca visibilidad operativa. Esta plataforma unifica reservas, abordaje y gestión en una sola experiencia web con tres roles, QR y seguimiento en vivo. Lo que ven es un producto funcional de extremo a extremo, listo para una implementación real."

**Audiencia USFQ (Jairo Carvajal, autoridades)**: enfatizar reducción de fricción, autoservicio, datos para tomar decisiones, ahorro de tiempo administrativo, escalabilidad.

---

## 2. Arquitectura — la versión de 60 segundos

- **Frontend**: Next.js 14 con App Router. SSR para la landing pública (SEO + carga rápida), Client Components para áreas privadas. TypeScript estricto, Tailwind CSS.
- **Backend**: Supabase. Postgres con RLS por rol, Auth nativa con validación de dominio institucional, Realtime para sincronizar cupos y ubicación de buses.
- **Mapas**: MapLibre GL JS sobre tiles de OpenStreetMap. Cero costo, sin API key.
- **IA**: Gemini API (free tier). Flows operativos sobre datos agregados: insights de demanda, recomendaciones de rutas, detección de fricciones UX, daily digest.
- **App Hosting**: despliegue automático desde GitHub.
- **Capa de abstracción `lib/db/`**: aísla Supabase del resto del código. Si en el futuro la USFQ migra a Firestore (o cualquier otra DB), solo se cambia ese archivo.

---

## 3. Por qué cada decisión

| Decisión | Justificación |
|---|---|
| Next.js sobre Vite | SSR para landing (Google indexable), App Router es el estándar 2026, soporte nativo en Firebase App Hosting |
| Supabase sobre Firestore | Lo pidió el profesor + esquema relacional natural (rutas, paradas, reservas tienen joins) |
| MapLibre sobre Google Maps | Gratuito, sin API key, sin lock-in. Calidad suficiente para Quito |
| Gemini directo, no Genkit | Genkit añade complejidad operacional sin valor en este alcance |
| Tres botones demo en login | Cero fricción para mostrar tres experiencias en una demo de 5 min |
| Capa `lib/db/` | Mañana querés migrar a Firestore: solo cambiás un archivo |
| Mobile-first | El usuario real del Pancho Bus accede desde el celular esperando el bus |
| QR firmado HMAC | Anti-falsificación; el chofer no necesita conexión para validar localmente |

---

## 4. Modelo de datos

Esquema base del profesor (`paradas`, `rutas`, `usuarios`) **extendido** con:

- `usuarios` ahora tiene `rol` (estudiante/admin/chofer) y `estado` (pendiente/activo/suspendido)
- `buses` (placa, modelo, capacidad, chofer asignado)
- `asignaciones` (qué bus + chofer corre qué ruta cuándo, con cupos)
- `reservas` (token QR firmado, posición waitlist, estado: confirmada/en_espera/cancelada/usada/no_show)
- `bus_locations` (GPS histórico para tracking en vivo)
- `mensajes` (admin↔chofer, admin→ruta completa)
- `eventos` (analytics que alimenta los flows IA)

**Trigger `handle_new_user`**: extiende el del profesor agregando validación de dominio USFQ y default de rol `estudiante` con estado `pendiente`.

**RLS**: políticas por rol. Estudiantes solo leen sus reservas. Choferes solo ven asignaciones donde son `id_chofer`. Admins ven todo.

---

## 5. Las 8 rutas del seed (reales)

A1 Lumbisí · B1 El Bosque · C1 Sur La Atahualpa · D1 Carcelén · E1 Conocoto · F1 CC San Luis · G1 Urb. Condado · H1 Machala Granados (suspendida en seed para demostrar el estado).

47 paradas con coordenadas reales en Quito y Cumbayá. Choferes ficticios pero plausibles. Asignaciones para hoy, mañana y pasado mañana con cupos parcialmente reservados.

---

## 6. Guion de demo (8 minutos)

**Min 0–1 · Landing (`/`)**
Mostrar identidad USFQ aplicada (rojo, Libre Baskerville, "Tu libertad comienza aquí"). Scroll por las secciones: cómo funciona, rutas activas, diferenciadores, IA.

**Min 1–2 · Registro (`/registro`)**
Mostrar validaciones en vivo: meter un correo no-USFQ, ver el error. Banner debe ser 8 dígitos. Password ≥ 6.

**Min 2–4 · Estudiante (`/login` → botón Estudiante)**
Inicio: próxima reserva, accesos rápidos. Rutas: lista filtrable, click a una ruta. Detalle de ruta: mapa con paradas, horarios, cupos en vivo. Reservar. Ver QR generado en `/app/mi-qr`.

**Min 4–6 · Admin (`/login` → botón Admin)**
Dashboard: KPIs, ocupación. Rutas: CRUD. Asignaciones: calendario semanal. **Insights IA**: click "Generar insights" → muestra resumen, rutas saturadas, recomendaciones. Mensajes: enviar anuncio a una ruta completa.

**Min 6–8 · Chofer (`/login` → botón Chofer)**
Ruta de hoy: paradas y mapa. Lista de pasajeros. Escanear QR (cámara web): mostrar el QR del estudiante demo, lo escanea, marca como usada. Cerrar el loop.

**Cierre**
"Esto vive en `panchobus.web.app`, despliegue automático desde GitHub. Stack 100% gratuito. Diseñado para escalar al volumen real de USFQ desde el día uno."

---

## 7. Preguntas que te van a hacer (y respuestas)

**¿Y si el GPS de OnTrack no nos lo dan?**
No lo necesitamos. La PWA del chofer reporta ubicación vía `navigator.geolocation` cada 15s mientras la asignación está `en_curso`. Cero hardware adicional.

**¿Cuánto cuesta operarlo?**
En escala de demo, todo corre en tiers gratuitos. En producción, se dimensiona según demanda real y políticas internas.

**¿Cómo migran los usuarios actuales del proceso manual?**
Importador CSV en admin. Pegan la lista de oficina PF104, cada usuario recibe magic link al correo USFQ para fijar password.

**¿Y la accesibilidad?**
WCAG AA. Contraste verificado, foco visible por teclado, ARIA labels, navegación por teclado completa.

**¿Por qué no app nativa?**
Web app instalable como PWA. Mismo costo de mantenimiento, llegada inmediata, sin dependencia de las stores de Apple/Google.

**¿Por qué Supabase y no Firestore si todo lo demás es Firebase?**
El esquema relacional y la RLS simplifican la operación hoy. La capa `lib/db/` permite migrar a otra base sin tocar componentes.

**¿Quién mantiene esto?**
Yo (Alexander). Lista para entrega y handover documentado en `docs/`.

---

## 8. Si te preguntan por implementación

> "Esta plataforma ya funciona de extremo a extremo. Para producción, el siguiente paso es integrar SSO institucional, reforzar seguridad con auditorías y activar pruebas E2E. El plan de implementación está documentado y listo para ejecutarse."

---

## 9. Lo que NO mostrar en demo

- Pantallas vacías (cualquier sección sin datos seed la skippeas)
- El `console.log` en DevTools (limpiá antes)
- El error "Supabase no configurado" si no levantaste la BD real
- Cualquier link `TODO` o `Lorem ipsum` (no debería haber, pero cheqealo)

---

## 10. Checklist pre-demo

- [ ] `npm run build` corre sin errores
- [ ] Las tres cuentas demo funcionan
- [ ] Modo claro y oscuro se ven bien
- [ ] El sitio es responsive (testá con DevTools en 375px)
- [ ] El despliegue Firebase está al día
- [ ] Tenés `panchobus.web.app` (o el dominio que sea) abierto en el navegador
- [ ] Tenés `localhost:3000` también listo de respaldo
