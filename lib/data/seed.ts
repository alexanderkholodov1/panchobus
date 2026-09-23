/**
 * SEED DATA — Pancho Bus (demo mode)
 *
 * Every record in this file is SYNTHETIC. People, email addresses, student codes,
 * phone numbers, plates, routes, stops and schedules are invented for the demo:
 * routes and stop sequences do not reproduce the real service, and coordinates
 * are only placed near public neighbourhoods of Quito so the map looks plausible.
 * Email domains use the reserved `.example` TLD so they can never reach a real inbox.
 *
 * Dates are generated relative to "today" (local time) so the demo always has
 * trips for the current week, and today's trip statuses follow the clock.
 */
import type {
  Asignacion,
  AssignmentStatus,
  Bus,
  Mensaje,
  Parada,
  Reserva,
  ReservationStatus,
  Ruta,
  Usuario
} from "@/lib/types";
import { addDaysISO, localHHMM, localISODate } from "@/lib/utils";

/** Bumped whenever the seed changes, so browsers drop stale demo data. */
export const SEED_VERSION = "2026-09-synthetic-v2";

export const STUDENT_DOMAIN = "estud.campus.example";
export const STAFF_DOMAIN = "campus.example";

const CAMPUS = { lat: -0.196528, lng: -78.435944 };

// Deterministic pseudo-random generator (same data on every load).
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ============================================================
// RUTAS (synthetic)
// ============================================================
type RouteSeed = Omit<Ruta, "numero_paradas"> & {
  stops: { nombre: string; lat: number; lng: number; ida: string; vuelta: string }[];
};

const ROUTES: RouteSeed[] = [
  {
    id_ruta: 1, codigo: "C1", nombre: "USFQ — Tumbaco",
    placa_bus: "PZA-4102", telefono_contacto: "+593 99 000 0101", nombre_chofer: "Martín Guerrero",
    disponible: true, numero_asientos: 32, color_hex: "#E11B22",
    descripcion: "Valle de Tumbaco por la Vía Interoceánica, con paradas en Puembo, Tumbaco Centro y La Primavera.",
    descripcion_en: "Tumbaco valley along the Interoceánica road, stopping at Puembo, Tumbaco Centro and La Primavera.",
    dias_operacion: ["L", "M", "X", "J", "V", "S"], estado: "activa",
    stops: [
      { nombre: "Puembo", lat: -0.1772, lng: -78.3591, ida: "06:10", vuelta: "18:05" },
      { nombre: "Tumbaco Centro", lat: -0.2128, lng: -78.4012, ida: "06:25", vuelta: "17:50" },
      { nombre: "La Primavera", lat: -0.2031, lng: -78.4262, ida: "06:36", vuelta: "17:39" },
      { nombre: "Campus USFQ", lat: CAMPUS.lat, lng: CAMPUS.lng, ida: "06:45", vuelta: "17:30" }
    ]
  },
  {
    id_ruta: 2, codigo: "N1", nombre: "USFQ — Calderón",
    placa_bus: "PZB-2718", telefono_contacto: "+593 99 000 0102", nombre_chofer: "Patricio Lema",
    disponible: true, numero_asientos: 40, color_hex: "#F39200",
    descripcion: "Norte de Quito por Carapungo y Llano Chico, bajando a Cumbayá por Nayón.",
    descripcion_en: "North Quito through Carapungo and Llano Chico, descending to Cumbayá via Nayón.",
    dias_operacion: ["L", "M", "X", "J", "V"], estado: "activa",
    stops: [
      { nombre: "Calderón", lat: -0.0991, lng: -78.4214, ida: "05:50", vuelta: "18:25" },
      { nombre: "Carapungo", lat: -0.0968, lng: -78.4486, ida: "06:02", vuelta: "18:13" },
      { nombre: "Llano Chico", lat: -0.1361, lng: -78.4418, ida: "06:15", vuelta: "18:00" },
      { nombre: "Nayón", lat: -0.1652, lng: -78.4371, ida: "06:30", vuelta: "17:45" },
      { nombre: "Campus USFQ", lat: CAMPUS.lat, lng: CAMPUS.lng, ida: "06:45", vuelta: "17:30" }
    ]
  },
  {
    id_ruta: 3, codigo: "N2", nombre: "USFQ — La Carolina",
    placa_bus: "PZC-3141", telefono_contacto: "+593 99 000 0103", nombre_chofer: "Esteban Villacís",
    disponible: true, numero_asientos: 36, color_hex: "#1E88E5",
    descripcion: "Centro-norte de Quito: Kennedy, La Carolina y El Batán, con salida por el Túnel Guayasamín.",
    descripcion_en: "Central-north Quito: Kennedy, La Carolina and El Batán, leaving through the Guayasamín Tunnel.",
    dias_operacion: ["L", "M", "X", "J", "V", "S"], estado: "activa",
    stops: [
      { nombre: "Kennedy", lat: -0.1492, lng: -78.4818, ida: "06:05", vuelta: "18:10" },
      { nombre: "La Carolina", lat: -0.1822, lng: -78.4853, ida: "06:18", vuelta: "17:57" },
      { nombre: "El Batán", lat: -0.1735, lng: -78.4762, ida: "06:26", vuelta: "17:49" },
      { nombre: "Monteserrín", lat: -0.1603, lng: -78.4655, ida: "06:34", vuelta: "17:41" },
      { nombre: "Túnel Guayasamín", lat: -0.1941, lng: -78.4608, ida: "06:42", vuelta: "17:33" },
      { nombre: "Campus USFQ", lat: CAMPUS.lat, lng: CAMPUS.lng, ida: "06:50", vuelta: "17:25" }
    ]
  },
  {
    id_ruta: 4, codigo: "N3", nombre: "USFQ — Pomasqui",
    placa_bus: "PZD-1618", telefono_contacto: "+593 99 000 0104", nombre_chofer: "Gonzalo Mora",
    disponible: true, numero_asientos: 36, color_hex: "#00897B",
    descripcion: "Noroccidente: Pomasqui, Ponceano y San Carlos, conectando por la Av. Simón Bolívar.",
    descripcion_en: "North-west: Pomasqui, Ponceano and San Carlos, connecting through Simón Bolívar Avenue.",
    dias_operacion: ["L", "M", "X", "J", "V"], estado: "activa",
    stops: [
      { nombre: "Pomasqui", lat: -0.0513, lng: -78.4552, ida: "05:40", vuelta: "18:35" },
      { nombre: "Ponceano", lat: -0.1176, lng: -78.4851, ida: "05:58", vuelta: "18:17" },
      { nombre: "San Carlos", lat: -0.1344, lng: -78.4957, ida: "06:08", vuelta: "18:07" },
      { nombre: "Av. Simón Bolívar (Norte)", lat: -0.1520, lng: -78.4610, ida: "06:25", vuelta: "17:50" },
      { nombre: "Campus USFQ", lat: CAMPUS.lat, lng: CAMPUS.lng, ida: "06:45", vuelta: "17:30" }
    ]
  },
  {
    id_ruta: 5, codigo: "S1", nombre: "USFQ — Quitumbe",
    placa_bus: "PZE-5772", telefono_contacto: "+593 99 000 0105", nombre_chofer: "Fernando Ochoa",
    disponible: true, numero_asientos: 40, color_hex: "#2A7D4F",
    descripcion: "Sur de Quito: Quitumbe, La Magdalena y Chimbacalle, con conexión por la Av. Simón Bolívar.",
    descripcion_en: "South Quito: Quitumbe, La Magdalena and Chimbacalle, connecting through Simón Bolívar Avenue.",
    dias_operacion: ["L", "M", "X", "J", "V"], estado: "activa",
    stops: [
      { nombre: "Quitumbe", lat: -0.2957, lng: -78.5489, ida: "05:35", vuelta: "18:40" },
      { nombre: "La Magdalena", lat: -0.2479, lng: -78.5302, ida: "05:55", vuelta: "18:20" },
      { nombre: "Chimbacalle", lat: -0.2407, lng: -78.5176, ida: "06:03", vuelta: "18:12" },
      { nombre: "Av. Simón Bolívar (Sur)", lat: -0.2605, lng: -78.4990, ida: "06:20", vuelta: "17:55" },
      { nombre: "Campus USFQ", lat: CAMPUS.lat, lng: CAMPUS.lng, ida: "06:50", vuelta: "17:25" }
    ]
  },
  {
    id_ruta: 6, codigo: "S2", nombre: "USFQ — Centro Histórico",
    placa_bus: "PZF-6931", telefono_contacto: "+593 99 000 0106", nombre_chofer: "Ramiro Quishpe",
    disponible: true, numero_asientos: 28, color_hex: "#8E24AA",
    descripcion: "Centro Histórico y La Floresta, bajando a Cumbayá por Guápulo.",
    descripcion_en: "Historic Centre and La Floresta, descending to Cumbayá through Guápulo.",
    dias_operacion: ["L", "M", "X", "J", "V"], estado: "activa",
    stops: [
      { nombre: "Centro Histórico", lat: -0.2203, lng: -78.5128, ida: "06:15", vuelta: "17:55" },
      { nombre: "La Floresta", lat: -0.2087, lng: -78.4889, ida: "06:28", vuelta: "17:42" },
      { nombre: "Guápulo", lat: -0.2014, lng: -78.4783, ida: "06:36", vuelta: "17:34" },
      { nombre: "Campus USFQ", lat: CAMPUS.lat, lng: CAMPUS.lng, ida: "06:50", vuelta: "17:20" }
    ]
  },
  {
    id_ruta: 7, codigo: "V1", nombre: "USFQ — Sangolquí",
    placa_bus: "PZG-2236", telefono_contacto: "+593 99 000 0107", nombre_chofer: "Hugo Salinas",
    disponible: true, numero_asientos: 32, color_hex: "#FB8C00",
    descripcion: "Valle de los Chillos: Sangolquí y San Rafael por la Autopista Rumiñahui.",
    descripcion_en: "Los Chillos valley: Sangolquí and San Rafael along the Rumiñahui highway.",
    dias_operacion: ["L", "M", "X", "J", "V"], estado: "activa",
    stops: [
      { nombre: "Sangolquí", lat: -0.3302, lng: -78.4483, ida: "05:55", vuelta: "18:25" },
      { nombre: "San Rafael", lat: -0.3061, lng: -78.4528, ida: "06:05", vuelta: "18:15" },
      { nombre: "Autopista Rumiñahui (Peaje)", lat: -0.2715, lng: -78.4719, ida: "06:18", vuelta: "18:02" },
      { nombre: "Campus USFQ", lat: CAMPUS.lat, lng: CAMPUS.lng, ida: "06:50", vuelta: "17:25" }
    ]
  },
  {
    id_ruta: 8, codigo: "V2", nombre: "USFQ — Pifo",
    placa_bus: "PZH-1414", telefono_contacto: "+593 99 000 0108", nombre_chofer: "Wilson Tapia",
    disponible: false, numero_asientos: 32, color_hex: "#C13030",
    descripcion: "Pifo y Tumbaco Norte por la Vía Interoceánica. Suspendida temporalmente por trabajos en la vía.",
    descripcion_en: "Pifo and north Tumbaco along the Interoceánica road. Temporarily suspended due to roadworks.",
    dias_operacion: ["L", "M", "X", "J", "V"], estado: "suspendida",
    stops: [
      { nombre: "Pifo", lat: -0.2294, lng: -78.3388, ida: "06:00", vuelta: "18:10" },
      { nombre: "Vía Interoceánica km 18", lat: -0.2240, lng: -78.3710, ida: "06:12", vuelta: "17:58" },
      { nombre: "Tumbaco Norte", lat: -0.2052, lng: -78.3998, ida: "06:25", vuelta: "17:45" },
      { nombre: "Campus USFQ", lat: CAMPUS.lat, lng: CAMPUS.lng, ida: "06:40", vuelta: "17:30" }
    ]
  }
];

export const SEED_RUTAS: Ruta[] = ROUTES.map(({ stops, ...r }) => ({ ...r, numero_paradas: stops.length }));

// ============================================================
// PARADAS
// ============================================================
export const SEED_PARADAS: Parada[] = (() => {
  let id = 1;
  const out: Parada[] = [];
  for (const r of ROUTES) {
    r.stops.forEach((s, i) => {
      out.push({
        id_parada: id++,
        nombre: s.nombre,
        hora_salida: s.ida,
        hora_regreso: s.vuelta,
        latitud: s.lat,
        longitud: s.lng,
        id_ruta: r.id_ruta,
        orden: i + 1,
        tipo: i === 0 ? "origen" : i === r.stops.length - 1 ? "destino" : "intermedia"
      });
    });
  }
  return out;
})();

// ============================================================
// USUARIOS
// ============================================================
const DRIVERS: { id: string; nombre: string; ruta: number; estado?: Usuario["estado"] }[] = [
  { id: "demo-driver", nombre: "Martín Guerrero", ruta: 1 },
  { id: "drv-002", nombre: "Patricio Lema", ruta: 2 },
  { id: "drv-003", nombre: "Esteban Villacís", ruta: 3 },
  { id: "drv-004", nombre: "Gonzalo Mora", ruta: 4 },
  { id: "drv-005", nombre: "Fernando Ochoa", ruta: 5 },
  { id: "drv-006", nombre: "Ramiro Quishpe", ruta: 6 },
  { id: "drv-007", nombre: "Hugo Salinas", ruta: 7 },
  { id: "drv-008", nombre: "Wilson Tapia", ruta: 8 },
  { id: "drv-009", nombre: "Jorge Pinto", ruta: 3, estado: "pendiente" }
];

const FIRST = [
  "Mateo", "Camila", "Sebastián", "Isabella", "Nicolás", "Sofía", "Martina", "Joaquín", "Emilia",
  "Tomás", "Renata", "Santiago", "Paula", "Andrés", "Lucía", "Diego", "Gabriela", "Felipe",
  "Antonella", "Emilio", "Julián", "Carolina", "Adrián", "Mariana", "Samuel", "Josefina", "Bruno",
  "Elena", "Gael", "Victoria", "Iker", "Amelia", "Lorenzo", "Abril", "Simón", "Rafaela"
];
const LAST = [
  "Salazar", "Cevallos", "Jaramillo", "Endara", "Villacrés", "Proaño", "Benítez", "Guzmán",
  "Aguirre", "Naranjo", "Egas", "Carrión", "Zambrano", "Moreno", "Peñaherrera", "Játiva",
  "Arteaga", "Borja", "Chiriboga", "Ponce", "Larrea", "Estrella", "Donoso", "Viteri"
];

const ascii = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const phone = (n: number) => `+593 99 000 ${String(n).padStart(4, "0")}`;

export const SEED_USUARIOS: Usuario[] = (() => {
  const users: Usuario[] = [
    {
      id_usuario: "demo-student",
      nombre: "Valeria Castro",
      correo_electronico: `vcastro@${STUDENT_DOMAIN}`,
      codigo_banner: "00900001",
      telefono: phone(1),
      direccion: "Tumbaco",
      id_ruta: 1,
      rol: "estudiante",
      estado: "activo",
      idioma: "es",
      tema: "system",
      created_at: "2026-02-02T15:00:00Z"
    },
    {
      id_usuario: "demo-admin",
      nombre: "Daniela Ruiz",
      correo_electronico: `druiz@${STAFF_DOMAIN}`,
      codigo_banner: "ADM-001",
      telefono: phone(2),
      direccion: "Campus Cumbayá",
      id_ruta: null,
      rol: "admin",
      estado: "activo",
      idioma: "es",
      tema: "system",
      created_at: "2025-08-01T13:00:00Z"
    }
  ];

  DRIVERS.forEach((d, i) => {
    const [first, last] = d.nombre.split(" ");
    users.push({
      id_usuario: d.id,
      nombre: d.nombre,
      correo_electronico: `${ascii(first[0] + last)}@${STAFF_DOMAIN}`,
      codigo_banner: `PR-${String(i + 1).padStart(3, "0")}`,
      telefono: phone(101 + i),
      direccion: "Quito",
      id_ruta: d.ruta,
      rol: "chofer",
      estado: d.estado ?? "activo",
      created_at: "2025-08-04T13:00:00Z"
    });
  });

  const activeRoutes = SEED_RUTAS.filter((r) => r.estado === "activa").map((r) => r.id_ruta);
  const usedEmails = new Set(users.map((u) => u.correo_electronico));
  FIRST.forEach((first, i) => {
    const last = LAST[(i * 7) % LAST.length];
    let local = ascii(first[0] + last);
    let n = 2;
    while (usedEmails.has(`${local}@${STUDENT_DOMAIN}`)) local = ascii(first[0] + last) + n++;
    const email = `${local}@${STUDENT_DOMAIN}`;
    usedEmails.add(email);
    const id_ruta = activeRoutes[i % activeRoutes.length];
    const route = ROUTES.find((r) => r.id_ruta === id_ruta)!;
    users.push({
      id_usuario: `stu-${String(i + 1).padStart(3, "0")}`,
      nombre: `${first} ${last}`,
      correo_electronico: email,
      codigo_banner: `009${String(10001 + i).slice(-5)}`,
      telefono: phone(1001 + i),
      direccion: route.stops[i % (route.stops.length - 1)].nombre,
      id_ruta,
      rol: "estudiante",
      estado: i === FIRST.length - 1 ? "suspendido" : "activo",
      created_at: new Date(Date.UTC(2026, 1, 1 + (i % 27), 14)).toISOString()
    });
  });
  return users;
})();

// ============================================================
// BUSES
// ============================================================
export const SEED_BUSES: Bus[] = [
  { id_bus: 1, placa: "PZA-4102", modelo: "Hino AK 2019", capacidad: 32, estado: "activo" },
  { id_bus: 2, placa: "PZB-2718", modelo: "Mercedes-Benz O500 2020", capacidad: 40, estado: "activo" },
  { id_bus: 3, placa: "PZC-3141", modelo: "Hino AK 2021", capacidad: 36, estado: "activo" },
  { id_bus: 4, placa: "PZD-1618", modelo: "Volkswagen 17.230 2018", capacidad: 36, estado: "activo" },
  { id_bus: 5, placa: "PZE-5772", modelo: "Mercedes-Benz O500 2019", capacidad: 40, estado: "activo" },
  { id_bus: 6, placa: "PZF-6931", modelo: "Mercedes-Benz OF 1721 2018", capacidad: 28, estado: "activo" },
  { id_bus: 7, placa: "PZG-2236", modelo: "Hino AK 2020", capacidad: 32, estado: "activo" },
  { id_bus: 8, placa: "PZH-1414", modelo: "Volkswagen 17.230 2020", capacidad: 32, estado: "inactivo" },
  { id_bus: 9, placa: "PZJ-7071", modelo: "Hino AK 2017", capacidad: 32, estado: "mantenimiento" }
];

// ============================================================
// ASIGNACIONES (one trip = one assignment; generated around today)
// ============================================================
const WEEKDAY_CODES = ["D", "L", "M", "X", "J", "V", "S"]; // Date.getDay() order

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const t = h * 60 + m + mins;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function statusFor(fecha: string, salida: string, fin: string, today: string, now: string): AssignmentStatus {
  if (fecha < today) return "completada";
  if (fecha > today) return "programada";
  if (now >= fin) return "completada";
  if (now >= salida) return "en_curso";
  return "programada";
}

const DAY_OFFSETS = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
/** Trip templates per route: morning (to campus), midday and evening (from campus). */
function tripsFor(route: RouteSeed) {
  const origin = route.stops[0];
  const campus = route.stops[route.stops.length - 1];
  const trips = [
    { key: "am", salida: origin.ida, fin: campus.ida },
    { key: "pm", salida: campus.vuelta, fin: origin.vuelta }
  ];
  // Two routes also run a midday return so the demo has trips in progress around noon.
  if (route.id_ruta === 1 || route.id_ruta === 3) {
    trips.splice(1, 0, { key: "md", salida: "12:40", fin: addMinutes("12:40", 35) });
  }
  return trips;
}

type GeneratedTrip = Asignacion & { _dayOffset: number; _key: string };

const GENERATED: { trips: GeneratedTrip[]; reservas: Reserva[] } = (() => {
  const today = localISODate();
  const now = localHHMM();
  const rand = rng(20260922);
  const trips: GeneratedTrip[] = [];
  const driverByRoute = new Map(DRIVERS.filter((d) => d.estado !== "pendiente").map((d) => [d.ruta, d.id]));

  DAY_OFFSETS.forEach((offset, dayIdx) => {
    const fecha = addDaysISO(offset);
    const weekday = WEEKDAY_CODES[new Date(`${fecha}T12:00:00`).getDay()];
    ROUTES.forEach((route) => {
      if (route.estado !== "activa" || !route.dias_operacion.includes(weekday)) return;
      tripsFor(route).forEach((trip, tIdx) => {
        const capacity = route.numero_asientos;
        const base = offset < 0 ? 0.65 : offset === 0 ? 0.62 : offset === 1 ? 0.5 : 0.2;
        const spread = offset <= 1 ? 0.35 : 0.45;
        let reserved = Math.round(capacity * Math.min(1, base + rand() * spread));
        // Keep a couple of trips full so the waitlist can be demonstrated.
        if (offset === 2 && route.id_ruta === 3 && trip.key === "am") reserved = capacity;
        if (offset === 1 && route.id_ruta === 5 && trip.key === "am") reserved = capacity;
        trips.push({
          id_asignacion: (dayIdx + 1) * 100 + route.id_ruta * 10 + tIdx,
          id_ruta: route.id_ruta,
          id_bus: route.id_ruta,
          id_chofer: driverByRoute.get(route.id_ruta) ?? null,
          fecha,
          hora_salida: trip.salida,
          hora_regreso: trip.fin,
          cupos_totales: capacity,
          cupos_disponibles: capacity,
          cupos_reservados: reserved,
          estado: offset === -2 && route.id_ruta === 6 && trip.key === "pm"
            ? "cancelada"
            : statusFor(fecha, trip.salida, trip.fin, today, now),
          _dayOffset: offset,
          _key: trip.key
        });
      });
    });
  });

  // ── Named reservations ──────────────────────────────────────
  const reservas: Reserva[] = [];
  let nextId = 1;
  const token = (asg: number) =>
    `PB-${asg}-${Math.floor(rand() * 36 ** 4).toString(36).toUpperCase().padStart(4, "0")}`;
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
  const students = SEED_USUARIOS.filter((u) => u.rol === "estudiante" && u.estado === "activo" && u.id_usuario !== "demo-student");

  const add = (id_usuario: string, asg: GeneratedTrip, estado: ReservationStatus, extra: Partial<Reserva> = {}) => {
    reservas.push({
      id_reserva: nextId++,
      id_usuario,
      id_asignacion: asg.id_asignacion,
      estado,
      qr_token: token(asg.id_asignacion),
      created_at: hoursAgo(24 * Math.max(1, 1 - asg._dayOffset) + rand() * 20),
      ...extra
    });
  };

  const statusForPassenger = (asg: GeneratedTrip, i: number): ReservationStatus => {
    if (asg.estado === "completada") return i % 9 === 8 ? "no_show" : "usada";
    if (asg.estado === "en_curso") return i % 3 === 2 ? "confirmada" : "usada";
    return "confirmada";
  };
  const boarded = (asg: GeneratedTrip, estado: ReservationStatus): Partial<Reserva> =>
    estado === "usada"
      ? { qr_escaneado_at: `${asg.fecha}T${asg.hora_salida}:00`, qr_escaneado_por: asg.id_chofer }
      : {};

  // 1) Full passenger lists for the demo driver's trips today and tomorrow (route C1),
  //    so "Passengers" and "Scan QR" show real, consistent records.
  const driverTrips = trips.filter((t) => t.id_ruta === 1 && (t._dayOffset === 0 || t._dayOffset === 1));
  driverTrips.forEach((asg, tIdx) => {
    const withStudent = asg._dayOffset === 0 && asg._key === "am" || asg._dayOffset === 1 && asg._key === "am";
    const seats = asg.cupos_reservados;
    let placed = 0;
    if (withStudent) {
      const estado = statusForPassenger(asg, 0);
      add("demo-student", asg, estado, { ...boarded(asg, estado), observaciones: asg._dayOffset === 1 ? "Ida" : undefined });
      placed++;
    }
    for (let i = 0; placed < seats && i < students.length; i++) {
      const s = students[(i + tIdx * 5) % students.length];
      const estado = statusForPassenger(asg, placed);
      add(s.id_usuario, asg, estado, boarded(asg, estado));
      placed++;
    }
    asg.cupos_reservados = placed;
  });

  // 2) Demo student's history and upcoming trips on other days.
  const studentTrip = (offset: number, route: number, key: string) =>
    trips.find((t) => t._dayOffset === offset && t.id_ruta === route && t._key === key);
  [-3, -2, -1].forEach((offset) => {
    const t = studentTrip(offset, 1, "am");
    if (t) add("demo-student", t, "usada", boarded(t, "usada"));
  });
  const cancelled = studentTrip(-1, 1, "pm");
  if (cancelled) add("demo-student", cancelled, "cancelada");
  const fullTrip = studentTrip(2, 3, "am");
  if (fullTrip) {
    add("demo-student", fullTrip, "en_espera", { posicion_waitlist: 1, observaciones: "Clase en La Carolina" });
  }
  const later = studentTrip(3, 1, "pm");
  if (later) add("demo-student", later, "confirmada");

  // 3) A few waitlisted classmates on the other full trip, for the admin views.
  const fullS1 = studentTrip(1, 5, "am");
  if (fullS1) {
    students.slice(0, 3).forEach((s, i) => add(s.id_usuario, fullS1, "en_espera", { posicion_waitlist: i + 1 }));
  }

  return { trips, reservas };
})();

export const SEED_ASIGNACIONES: Asignacion[] = GENERATED.trips.map(({ _dayOffset, _key, ...a }) => a);
export const SEED_RESERVAS: Reserva[] = GENERATED.reservas;

// ============================================================
// MENSAJES (bilingual seed content)
// ============================================================
const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

export const SEED_MENSAJES: Mensaje[] = [
  {
    id_mensaje: 1,
    remitente_id: "demo-admin",
    destinatario_id: null,
    destinatario_ruta: null,
    asunto: "Reservas y abordaje desde la plataforma",
    asunto_en: "Bookings and boarding now on the platform",
    cuerpo: "Desde esta semana, las reservas se hacen aquí y el abordaje se verifica con tu código QR. Ya no se entregan stickers en la fila.",
    cuerpo_en: "Starting this week, seats are booked here and boarding is verified with your QR code. Stickers are no longer handed out in line.",
    leido: false,
    created_at: minutesAgo(60 * 5)
  },
  {
    id_mensaje: 2,
    remitente_id: "demo-admin",
    destinatario_id: null,
    destinatario_ruta: 1,
    asunto: "Aviso ruta C1 Tumbaco",
    asunto_en: "Route C1 Tumbaco notice",
    cuerpo: "Esta semana hay trabajos en la vía cerca de La Primavera. La salida se mantiene a las 06:10; considera 5 minutos adicionales.",
    cuerpo_en: "There are roadworks near La Primavera this week. Departure stays at 06:10; allow 5 extra minutes.",
    leido: false,
    created_at: minutesAgo(120)
  },
  {
    id_mensaje: 3,
    remitente_id: "demo-admin",
    destinatario_id: "demo-driver",
    destinatario_ruta: null,
    asunto: "Salida anticipada el viernes",
    asunto_en: "Early departure on Friday",
    cuerpo: "Martín, el viernes la C1 sale 10 minutos antes (06:00) por un cierre parcial en la Vía Interoceánica. Por favor avisa a los pasajeros.",
    cuerpo_en: "Martín, on Friday C1 leaves 10 minutes early (06:00) because of a partial closure on the Interoceánica road. Please let passengers know.",
    leido: false,
    created_at: minutesAgo(90)
  },
  {
    id_mensaje: 4,
    remitente_id: "demo-driver",
    destinatario_id: "demo-admin",
    destinatario_ruta: null,
    asunto: "Re: Salida anticipada el viernes",
    asunto_en: "Re: Early departure on Friday",
    cuerpo: "Entendido, Daniela. Ya envié el aviso a los pasajeros de la ruta.",
    cuerpo_en: "Understood, Daniela. I already sent the notice to the route's passengers.",
    leido: true,
    created_at: minutesAgo(45)
  },
  {
    id_mensaje: 5,
    remitente_id: "demo-admin",
    destinatario_id: null,
    destinatario_ruta: 8,
    asunto: "Ruta V2 Pifo suspendida",
    asunto_en: "Route V2 Pifo suspended",
    cuerpo: "La ruta V2 está suspendida temporalmente por trabajos en la vía. Mientras tanto, usa la ruta C1 Tumbaco.",
    cuerpo_en: "Route V2 is temporarily suspended due to roadworks. In the meantime, please use route C1 Tumbaco.",
    leido: false,
    created_at: minutesAgo(60 * 30)
  }
];
