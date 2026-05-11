/**
 * SEED DATA — Pancho Bus
 *
 * Datos sembrados completos para el prototipo. Reflejan las rutas reales del
 * servicio Pancho Bus USFQ (Cumbayá) con coordenadas aproximadas reales
 * y horarios típicos. Choferes, buses y reservas son ficticios pero plausibles.
 *
 * Cuando se conecte Supabase real, este archivo se traduce a SQL (ver
 * supabase/migrations/0002_seed.sql). La estructura es idéntica.
 */
import type {
  Asignacion,
  Bus,
  Mensaje,
  Parada,
  Reserva,
  Ruta,
  Usuario
} from "@/lib/types";

const USFQ_CAMPUS = { lat: -0.196528, lng: -78.435944 };

// ============================================================
// RUTAS (basadas en las reales que circulan en USFQ)
// ============================================================
export const SEED_RUTAS: Ruta[] = [
  {
    id_ruta: 1,
    codigo: "A1",
    nombre: "USFQ — Lumbisí",
    numero_paradas: 6,
    placa_bus: "PFA-1234",
    telefono_contacto: "+593 99 123 4567",
    nombre_chofer: "Carlos Mendoza",
    disponible: true,
    numero_asientos: 32,
    color_hex: "#E11B22",
    descripcion: "Ruta directa hacia el barrio Lumbisí, cubre Pillagua y Auqui.",
    dias_operacion: ["L", "M", "X", "J", "V"],
    estado: "activa"
  },
  {
    id_ruta: 2,
    codigo: "B1",
    nombre: "USFQ — El Bosque",
    numero_paradas: 8,
    placa_bus: "PFC-5678",
    telefono_contacto: "+593 99 234 5678",
    nombre_chofer: "Luis Paredes",
    disponible: true,
    numero_asientos: 40,
    color_hex: "#F39200",
    descripcion: "Norte de Quito vía Av. Occidental, parada principal CC El Bosque.",
    dias_operacion: ["L", "M", "X", "J", "V"],
    estado: "activa"
  },
  {
    id_ruta: 3,
    codigo: "C1",
    nombre: "USFQ — Sur La Atahualpa",
    numero_paradas: 7,
    placa_bus: "PFE-9012",
    telefono_contacto: "+593 99 345 6789",
    nombre_chofer: "Andrés Vega",
    disponible: true,
    numero_asientos: 36,
    color_hex: "#2A7D4F",
    descripcion: "Sur de Quito por Av. Maldonado, parada principal La Atahualpa.",
    dias_operacion: ["L", "M", "X", "J", "V"],
    estado: "activa"
  },
  {
    id_ruta: 4,
    codigo: "D1",
    nombre: "USFQ — Carcelén",
    numero_paradas: 6,
    placa_bus: "PFG-3456",
    telefono_contacto: "+593 99 456 7890",
    nombre_chofer: "Roberto Salazar",
    disponible: true,
    numero_asientos: 36,
    color_hex: "#1E88E5",
    descripcion: "Norte extremo, parada principal Terminal Carcelén.",
    dias_operacion: ["L", "M", "X", "J", "V"],
    estado: "activa"
  },
  {
    id_ruta: 5,
    codigo: "E1",
    nombre: "USFQ — Conocoto",
    numero_paradas: 5,
    placa_bus: "PFH-7890",
    telefono_contacto: "+593 99 567 8901",
    nombre_chofer: "Diego Cabrera",
    disponible: true,
    numero_asientos: 32,
    color_hex: "#8E24AA",
    descripcion: "Valle de Los Chillos por autopista, parada principal Conocoto Centro.",
    dias_operacion: ["L", "M", "X", "J", "V"],
    estado: "activa"
  },
  {
    id_ruta: 6,
    codigo: "F1",
    nombre: "USFQ — CC San Luis",
    numero_paradas: 4,
    placa_bus: "PFJ-1122",
    telefono_contacto: "+593 99 678 9012",
    nombre_chofer: "Marco Tipán",
    disponible: true,
    numero_asientos: 28,
    color_hex: "#FB8C00",
    descripcion: "Valle de Los Chillos, parada principal CC San Luis Shopping.",
    dias_operacion: ["L", "M", "X", "J", "V"],
    estado: "activa"
  },
  {
    id_ruta: 7,
    codigo: "G1",
    nombre: "USFQ — Urb. Condado",
    numero_paradas: 5,
    placa_bus: "PFK-3344",
    telefono_contacto: "+593 99 789 0123",
    nombre_chofer: "Jorge Almeida",
    disponible: true,
    numero_asientos: 32,
    color_hex: "#00897B",
    descripcion: "Noroccidente, parada principal Urb. El Condado.",
    dias_operacion: ["L", "M", "X", "J", "V"],
    estado: "activa"
  },
  {
    id_ruta: 8,
    codigo: "H1",
    nombre: "USFQ — Machala Granados",
    numero_paradas: 6,
    placa_bus: "PFL-5566",
    telefono_contacto: "+593 99 890 1234",
    nombre_chofer: "Pedro Cárdenas",
    disponible: false,
    numero_asientos: 36,
    color_hex: "#C13030",
    descripcion: "Av. Machala y Granados — temporalmente suspendida por obras viales.",
    dias_operacion: ["L", "M", "X", "J", "V"],
    estado: "suspendida"
  }
];

// ============================================================
// PARADAS (coordenadas aproximadas reales de Quito/Cumbayá)
// ============================================================
export const SEED_PARADAS: Parada[] = [
  // Ruta 1 — Lumbisí
  { id_parada: 1, nombre: "Lumbisí Centro", hora_salida: "06:15", hora_regreso: "18:00", latitud: -0.2089, longitud: -78.4198, id_ruta: 1, orden: 1, tipo: "origen" },
  { id_parada: 2, nombre: "Pillagua", hora_salida: "06:25", hora_regreso: "17:50", latitud: -0.2034, longitud: -78.4254, id_ruta: 1, orden: 2, tipo: "intermedia" },
  { id_parada: 3, nombre: "Auqui Bajo", hora_salida: "06:30", hora_regreso: "17:45", latitud: -0.1989, longitud: -78.4290, id_ruta: 1, orden: 3, tipo: "intermedia" },
  { id_parada: 4, nombre: "Av. Interoceánica", hora_salida: "06:38", hora_regreso: "17:38", latitud: -0.1965, longitud: -78.4321, id_ruta: 1, orden: 4, tipo: "intermedia" },
  { id_parada: 5, nombre: "Diego de Robles", hora_salida: "06:45", hora_regreso: "17:30", latitud: -0.1958, longitud: -78.4348, id_ruta: 1, orden: 5, tipo: "intermedia" },
  { id_parada: 6, nombre: "Campus USFQ", hora_salida: "06:50", hora_regreso: "17:25", latitud: USFQ_CAMPUS.lat, longitud: USFQ_CAMPUS.lng, id_ruta: 1, orden: 6, tipo: "destino" },

  // Ruta 2 — El Bosque
  { id_parada: 7, nombre: "CC El Bosque", hora_salida: "06:00", hora_regreso: "18:15", latitud: -0.1843, longitud: -78.4978, id_ruta: 2, orden: 1, tipo: "origen" },
  { id_parada: 8, nombre: "Av. Occidental N1", hora_salida: "06:08", hora_regreso: "18:07", latitud: -0.1834, longitud: -78.4843, id_ruta: 2, orden: 2, tipo: "intermedia" },
  { id_parada: 9, nombre: "Plaza de las Américas", hora_salida: "06:15", hora_regreso: "18:00", latitud: -0.1809, longitud: -78.4767, id_ruta: 2, orden: 3, tipo: "intermedia" },
  { id_parada: 10, nombre: "Mariana de Jesús", hora_salida: "06:23", hora_regreso: "17:52", latitud: -0.1858, longitud: -78.4912, id_ruta: 2, orden: 4, tipo: "intermedia" },
  { id_parada: 11, nombre: "Av. 6 de Diciembre", hora_salida: "06:32", hora_regreso: "17:43", latitud: -0.1934, longitud: -78.4823, id_ruta: 2, orden: 5, tipo: "intermedia" },
  { id_parada: 12, nombre: "Av. Eloy Alfaro", hora_salida: "06:40", hora_regreso: "17:35", latitud: -0.1907, longitud: -78.4734, id_ruta: 2, orden: 6, tipo: "intermedia" },
  { id_parada: 13, nombre: "Cumbayá Y", hora_salida: "06:50", hora_regreso: "17:25", latitud: -0.1989, longitud: -78.4456, id_ruta: 2, orden: 7, tipo: "intermedia" },
  { id_parada: 14, nombre: "Campus USFQ", hora_salida: "07:00", hora_regreso: "17:15", latitud: USFQ_CAMPUS.lat, longitud: USFQ_CAMPUS.lng, id_ruta: 2, orden: 8, tipo: "destino" },

  // Ruta 3 — Sur La Atahualpa
  { id_parada: 15, nombre: "La Atahualpa", hora_salida: "05:50", hora_regreso: "18:20", latitud: -0.2734, longitud: -78.5523, id_ruta: 3, orden: 1, tipo: "origen" },
  { id_parada: 16, nombre: "Solanda", hora_salida: "05:58", hora_regreso: "18:12", latitud: -0.2645, longitud: -78.5476, id_ruta: 3, orden: 2, tipo: "intermedia" },
  { id_parada: 17, nombre: "Villaflora", hora_salida: "06:07", hora_regreso: "18:03", latitud: -0.2456, longitud: -78.5345, id_ruta: 3, orden: 3, tipo: "intermedia" },
  { id_parada: 18, nombre: "El Recreo", hora_salida: "06:15", hora_regreso: "17:55", latitud: -0.2390, longitud: -78.5256, id_ruta: 3, orden: 4, tipo: "intermedia" },
  { id_parada: 19, nombre: "Av. Maldonado", hora_salida: "06:25", hora_regreso: "17:45", latitud: -0.2298, longitud: -78.5189, id_ruta: 3, orden: 5, tipo: "intermedia" },
  { id_parada: 20, nombre: "Trébol", hora_salida: "06:38", hora_regreso: "17:32", latitud: -0.2178, longitud: -78.4823, id_ruta: 3, orden: 6, tipo: "intermedia" },
  { id_parada: 21, nombre: "Campus USFQ", hora_salida: "06:55", hora_regreso: "17:15", latitud: USFQ_CAMPUS.lat, longitud: USFQ_CAMPUS.lng, id_ruta: 3, orden: 7, tipo: "destino" },

  // Ruta 4 — Carcelén
  { id_parada: 22, nombre: "Terminal Carcelén", hora_salida: "05:45", hora_regreso: "18:30", latitud: -0.1023, longitud: -78.4734, id_ruta: 4, orden: 1, tipo: "origen" },
  { id_parada: 23, nombre: "Carcelén Industrial", hora_salida: "05:55", hora_regreso: "18:20", latitud: -0.1098, longitud: -78.4789, id_ruta: 4, orden: 2, tipo: "intermedia" },
  { id_parada: 24, nombre: "El Inca", hora_salida: "06:08", hora_regreso: "18:08", latitud: -0.1456, longitud: -78.4767, id_ruta: 4, orden: 3, tipo: "intermedia" },
  { id_parada: 25, nombre: "La Y", hora_salida: "06:20", hora_regreso: "17:55", latitud: -0.1745, longitud: -78.4823, id_ruta: 4, orden: 4, tipo: "intermedia" },
  { id_parada: 26, nombre: "Cumbayá Y", hora_salida: "06:45", hora_regreso: "17:28", latitud: -0.1989, longitud: -78.4456, id_ruta: 4, orden: 5, tipo: "intermedia" },
  { id_parada: 27, nombre: "Campus USFQ", hora_salida: "06:55", hora_regreso: "17:15", latitud: USFQ_CAMPUS.lat, longitud: USFQ_CAMPUS.lng, id_ruta: 4, orden: 6, tipo: "destino" },

  // Ruta 5 — Conocoto
  { id_parada: 28, nombre: "Conocoto Centro", hora_salida: "06:10", hora_regreso: "18:05", latitud: -0.3045, longitud: -78.4878, id_ruta: 5, orden: 1, tipo: "origen" },
  { id_parada: 29, nombre: "La Armenia", hora_salida: "06:20", hora_regreso: "17:55", latitud: -0.2890, longitud: -78.4823, id_ruta: 5, orden: 2, tipo: "intermedia" },
  { id_parada: 30, nombre: "San Rafael", hora_salida: "06:30", hora_regreso: "17:45", latitud: -0.2745, longitud: -78.4756, id_ruta: 5, orden: 3, tipo: "intermedia" },
  { id_parada: 31, nombre: "Autopista General Rumiñahui", hora_salida: "06:42", hora_regreso: "17:33", latitud: -0.2389, longitud: -78.4634, id_ruta: 5, orden: 4, tipo: "intermedia" },
  { id_parada: 32, nombre: "Campus USFQ", hora_salida: "07:00", hora_regreso: "17:15", latitud: USFQ_CAMPUS.lat, longitud: USFQ_CAMPUS.lng, id_ruta: 5, orden: 5, tipo: "destino" },

  // Ruta 6 — CC San Luis
  { id_parada: 33, nombre: "CC San Luis Shopping", hora_salida: "06:30", hora_regreso: "17:50", latitud: -0.3098, longitud: -78.4634, id_ruta: 6, orden: 1, tipo: "origen" },
  { id_parada: 34, nombre: "Sangolquí Centro", hora_salida: "06:38", hora_regreso: "17:42", latitud: -0.3198, longitud: -78.4523, id_ruta: 6, orden: 2, tipo: "intermedia" },
  { id_parada: 35, nombre: "Capelo", hora_salida: "06:48", hora_regreso: "17:32", latitud: -0.2945, longitud: -78.4567, id_ruta: 6, orden: 3, tipo: "intermedia" },
  { id_parada: 36, nombre: "Campus USFQ", hora_salida: "07:05", hora_regreso: "17:15", latitud: USFQ_CAMPUS.lat, longitud: USFQ_CAMPUS.lng, id_ruta: 6, orden: 4, tipo: "destino" },

  // Ruta 7 — Urb. Condado
  { id_parada: 37, nombre: "Urb. El Condado", hora_salida: "05:55", hora_regreso: "18:20", latitud: -0.0978, longitud: -78.5034, id_ruta: 7, orden: 1, tipo: "origen" },
  { id_parada: 38, nombre: "Mitad del Mundo Vía", hora_salida: "06:05", hora_regreso: "18:10", latitud: -0.1145, longitud: -78.4978, id_ruta: 7, orden: 2, tipo: "intermedia" },
  { id_parada: 39, nombre: "Cotocollao", hora_salida: "06:15", hora_regreso: "18:00", latitud: -0.1234, longitud: -78.4912, id_ruta: 7, orden: 3, tipo: "intermedia" },
  { id_parada: 40, nombre: "La Y", hora_salida: "06:30", hora_regreso: "17:48", latitud: -0.1745, longitud: -78.4823, id_ruta: 7, orden: 4, tipo: "intermedia" },
  { id_parada: 41, nombre: "Campus USFQ", hora_salida: "07:00", hora_regreso: "17:15", latitud: USFQ_CAMPUS.lat, longitud: USFQ_CAMPUS.lng, id_ruta: 7, orden: 5, tipo: "destino" },

  // Ruta 8 — Machala Granados (suspendida)
  { id_parada: 42, nombre: "Av. Machala y Granados", hora_salida: "06:20", hora_regreso: "17:50", latitud: -0.1812, longitud: -78.4856, id_ruta: 8, orden: 1, tipo: "origen" },
  { id_parada: 43, nombre: "Estadio Atahualpa", hora_salida: "06:28", hora_regreso: "17:42", latitud: -0.1789, longitud: -78.4823, id_ruta: 8, orden: 2, tipo: "intermedia" },
  { id_parada: 44, nombre: "La Carolina", hora_salida: "06:35", hora_regreso: "17:35", latitud: -0.1812, longitud: -78.4856, id_ruta: 8, orden: 3, tipo: "intermedia" },
  { id_parada: 45, nombre: "República del Salvador", hora_salida: "06:42", hora_regreso: "17:28", latitud: -0.1845, longitud: -78.4823, id_ruta: 8, orden: 4, tipo: "intermedia" },
  { id_parada: 46, nombre: "Av. Eloy Alfaro", hora_salida: "06:50", hora_regreso: "17:20", latitud: -0.1907, longitud: -78.4734, id_ruta: 8, orden: 5, tipo: "intermedia" },
  { id_parada: 47, nombre: "Campus USFQ", hora_salida: "07:10", hora_regreso: "17:00", latitud: USFQ_CAMPUS.lat, longitud: USFQ_CAMPUS.lng, id_ruta: 8, orden: 6, tipo: "destino" }
];

// ============================================================
// USUARIOS (3 cuentas demo + ficticios)
// ============================================================
export const SEED_USUARIOS: Usuario[] = [
  {
    id_usuario: "demo-student",
    nombre: "Alexander Kholodov",
    correo_electronico: "akholodov@estud.usfq.edu.ec",
    codigo_banner: "00332509",
    telefono: "+593 99 555 0001",
    direccion: "Cumbayá",
    id_ruta: 1,
    rol: "estudiante",
    estado: "activo",
    idioma: "es",
    tema: "system",
    created_at: "2026-01-15T10:00:00Z"
  },
  {
    id_usuario: "demo-admin",
    nombre: "Jairo Carvajal",
    correo_electronico: "jcarvajal@usfq.edu.ec",
    codigo_banner: "ADMIN001",
    telefono: "+593 99 555 0002",
    direccion: "Oficina PF104, Campus USFQ",
    id_ruta: null,
    rol: "admin",
    estado: "activo",
    idioma: "es",
    tema: "system",
    created_at: "2025-08-01T08:00:00Z"
  },
  {
    id_usuario: "demo-driver",
    nombre: "Carlos Mendoza",
    correo_electronico: "cmendoza@usfq.edu.ec",
    codigo_banner: "DRV001",
    telefono: "+593 99 123 4567",
    direccion: "Cumbayá",
    id_ruta: 1,
    rol: "chofer",
    estado: "activo",
    idioma: "es",
    tema: "system",
    created_at: "2025-08-01T08:00:00Z"
  },
  // Estudiantes ficticios (para que listas en admin no se vean vacías)
  {
    id_usuario: "stu-002",
    nombre: "María Pérez",
    correo_electronico: "mperez@estud.usfq.edu.ec",
    codigo_banner: "00321456",
    telefono: "+593 99 111 2222",
    direccion: "Lumbisí",
    id_ruta: 1,
    rol: "estudiante",
    estado: "activo",
    created_at: "2026-02-10T09:00:00Z"
  },
  {
    id_usuario: "stu-003",
    nombre: "Juan Ramírez",
    correo_electronico: "jramirez@estud.usfq.edu.ec",
    codigo_banner: "00345678",
    telefono: "+593 99 222 3333",
    direccion: "El Bosque",
    id_ruta: 2,
    rol: "estudiante",
    estado: "activo",
    created_at: "2026-02-12T11:00:00Z"
  },
  {
    id_usuario: "stu-004",
    nombre: "Camila Vásquez",
    correo_electronico: "cvasquez@estud.usfq.edu.ec",
    codigo_banner: "00354321",
    telefono: "+593 99 333 4444",
    direccion: "Conocoto",
    id_ruta: 5,
    rol: "estudiante",
    estado: "pendiente",
    created_at: "2026-05-10T15:00:00Z"
  },
  {
    id_usuario: "stu-005",
    nombre: "Sebastián Erazo",
    correo_electronico: "serazo@estud.usfq.edu.ec",
    codigo_banner: "00367890",
    telefono: "+593 99 444 5555",
    direccion: "Carcelén",
    id_ruta: 4,
    rol: "estudiante",
    estado: "activo",
    created_at: "2026-03-05T09:00:00Z"
  },
  // Choferes adicionales
  {
    id_usuario: "drv-002",
    nombre: "Luis Paredes",
    correo_electronico: "lparedes@usfq.edu.ec",
    codigo_banner: "DRV002",
    telefono: "+593 99 234 5678",
    direccion: "Quito",
    id_ruta: 2,
    rol: "chofer",
    estado: "activo"
  },
  {
    id_usuario: "drv-003",
    nombre: "Andrés Vega",
    correo_electronico: "avega@usfq.edu.ec",
    codigo_banner: "DRV003",
    telefono: "+593 99 345 6789",
    direccion: "Quito",
    id_ruta: 3,
    rol: "chofer",
    estado: "activo"
  }
];

// ============================================================
// BUSES
// ============================================================
export const SEED_BUSES: Bus[] = [
  { id_bus: "bus-1", placa: "PFA-1234", modelo: "Hino AK 2018", capacidad: 32, estado: "disponible", id_chofer_asignado: "demo-driver" },
  { id_bus: "bus-2", placa: "PFC-5678", modelo: "Mercedes O500 2019", capacidad: 40, estado: "disponible", id_chofer_asignado: "drv-002" },
  { id_bus: "bus-3", placa: "PFE-9012", modelo: "Hino AK 2020", capacidad: 36, estado: "disponible", id_chofer_asignado: "drv-003" },
  { id_bus: "bus-4", placa: "PFG-3456", modelo: "Volkswagen 17.230 2017", capacidad: 36, estado: "disponible", id_chofer_asignado: null },
  { id_bus: "bus-5", placa: "PFH-7890", modelo: "Hino AK 2021", capacidad: 32, estado: "disponible", id_chofer_asignado: null },
  { id_bus: "bus-6", placa: "PFJ-1122", modelo: "Mercedes OF1721 2018", capacidad: 28, estado: "disponible", id_chofer_asignado: null },
  { id_bus: "bus-7", placa: "PFK-3344", modelo: "Hino AK 2019", capacidad: 32, estado: "mantenimiento", id_chofer_asignado: null },
  { id_bus: "bus-8", placa: "PFL-5566", modelo: "Volkswagen 17.230 2020", capacidad: 36, estado: "fuera_servicio", id_chofer_asignado: null }
];

// ============================================================
// ASIGNACIONES (semana actual)
// ============================================================
const today = new Date();
const dateStr = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const SEED_ASIGNACIONES: Asignacion[] = [
  // Hoy
  { id_asignacion: "asg-1", id_ruta: 1, id_bus: "bus-1", id_chofer: "demo-driver", fecha: dateStr(0), hora_salida: "06:15", hora_regreso: "17:30", estado: "en_curso", cupos_disponibles: 32, cupos_reservados: 24 },
  { id_asignacion: "asg-2", id_ruta: 2, id_bus: "bus-2", id_chofer: "drv-002", fecha: dateStr(0), hora_salida: "06:00", hora_regreso: "17:25", estado: "completada", cupos_disponibles: 40, cupos_reservados: 38 },
  { id_asignacion: "asg-3", id_ruta: 3, id_bus: "bus-3", id_chofer: "drv-003", fecha: dateStr(0), hora_salida: "05:50", hora_regreso: "17:15", estado: "programada", cupos_disponibles: 36, cupos_reservados: 19 },
  { id_asignacion: "asg-4", id_ruta: 4, id_bus: "bus-4", id_chofer: "demo-driver", fecha: dateStr(0), hora_salida: "05:45", hora_regreso: "17:15", estado: "programada", cupos_disponibles: 36, cupos_reservados: 28 },
  { id_asignacion: "asg-5", id_ruta: 5, id_bus: "bus-5", id_chofer: "drv-002", fecha: dateStr(0), hora_salida: "06:10", hora_regreso: "17:15", estado: "programada", cupos_disponibles: 32, cupos_reservados: 12 },
  // Mañana
  { id_asignacion: "asg-6", id_ruta: 1, id_bus: "bus-1", id_chofer: "demo-driver", fecha: dateStr(1), hora_salida: "06:15", hora_regreso: "17:30", estado: "programada", cupos_disponibles: 32, cupos_reservados: 30 },
  { id_asignacion: "asg-7", id_ruta: 2, id_bus: "bus-2", id_chofer: "drv-002", fecha: dateStr(1), hora_salida: "06:00", hora_regreso: "17:25", estado: "programada", cupos_disponibles: 40, cupos_reservados: 32 },
  // Pasado mañana
  { id_asignacion: "asg-8", id_ruta: 1, id_bus: "bus-1", id_chofer: "demo-driver", fecha: dateStr(2), hora_salida: "06:15", hora_regreso: "17:30", estado: "programada", cupos_disponibles: 32, cupos_reservados: 8 }
];

// ============================================================
// RESERVAS DEMO (del estudiante demo)
// ============================================================
export const SEED_RESERVAS: Reserva[] = [
  {
    id_reserva: "rsv-1",
    id_usuario: "demo-student",
    id_asignacion: "asg-1",
    estado: "confirmada",
    qr_token: "DEMO-QR-asg-1-demo-student-x7k2",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    observaciones: "Ruta de ida"
  },
  {
    id_reserva: "rsv-2",
    id_usuario: "demo-student",
    id_asignacion: "asg-6",
    estado: "confirmada",
    qr_token: "DEMO-QR-asg-6-demo-student-m9p3",
    created_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id_reserva: "rsv-3",
    id_usuario: "stu-002",
    id_asignacion: "asg-1",
    estado: "usada",
    qr_token: "DEMO-QR-asg-1-stu-002-h2x1",
    qr_escaneado_at: new Date(Date.now() - 7200000).toISOString(),
    qr_escaneado_por: "demo-driver",
    created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id_reserva: "rsv-4",
    id_usuario: "stu-003",
    id_asignacion: "asg-2",
    estado: "usada",
    qr_token: "DEMO-QR-asg-2-stu-003-q4t7",
    qr_escaneado_at: new Date(Date.now() - 21600000).toISOString(),
    qr_escaneado_por: "drv-002",
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id_reserva: "rsv-5",
    id_usuario: "stu-005",
    id_asignacion: "asg-4",
    estado: "confirmada",
    qr_token: "DEMO-QR-asg-4-stu-005-w8r2",
    created_at: new Date(Date.now() - 10800000).toISOString()
  }
];

// ============================================================
// MENSAJES
// ============================================================
export const SEED_MENSAJES: Mensaje[] = [
  {
    id_mensaje: "msg-1",
    remitente_id: "demo-admin",
    destinatario_id: "demo-driver",
    asunto: "Cambio de horario viernes",
    cuerpo: "Carlos, el viernes salimos 10 min antes (06:05) por la marcha en Av. Interoceánica. Avisa a los pasajeros por favor.",
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id_mensaje: "msg-2",
    remitente_id: "demo-admin",
    destinatario_ruta: 1,
    asunto: "Atención ruta Lumbisí",
    cuerpo: "Esta semana habrá obras en Diego de Robles. Tomar previsiones, salida normal a las 06:15.",
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id_mensaje: "msg-3",
    remitente_id: "demo-driver",
    destinatario_id: "demo-admin",
    asunto: "Re: Cambio de horario viernes",
    cuerpo: "Entendido Jairo, listo, ya avisé al grupo.",
    leido_at: new Date(Date.now() - 1800000).toISOString(),
    created_at: new Date(Date.now() - 1800000).toISOString()
  }
];
