export type Role = "estudiante" | "admin" | "chofer";
export type UserStatus = "pendiente" | "activo" | "suspendido";
export type RouteStatus = "activa" | "inactiva" | "suspendida";
// Supabase check: activo | mantenimiento | inactivo
export type BusStatus = "activo" | "mantenimiento" | "inactivo";
export type AssignmentStatus = "programada" | "en_curso" | "completada" | "cancelada";
export type ReservationStatus = "confirmada" | "en_espera" | "cancelada" | "usada" | "no_show";

export interface Usuario {
  id_usuario: string;
  nombre: string;
  correo_electronico: string;
  codigo_banner: string;
  telefono: string;
  direccion: string;
  id_ruta: number | null;
  rol: Role;
  estado: UserStatus;
  avatar_url?: string | null;
  idioma?: string;
  tema?: "light" | "dark" | "system";
  created_at?: string;
}

export interface Parada {
  id_parada: number;
  nombre: string;
  hora_salida: string;
  hora_regreso: string;
  latitud: number;
  longitud: number;
  id_ruta: number;
  orden: number;
  tipo: "origen" | "intermedia" | "destino";
}

export interface Ruta {
  id_ruta: number;
  codigo: string;
  nombre: string;
  numero_paradas: number;
  placa_bus: string | null;
  telefono_contacto: string;
  nombre_chofer: string;
  disponible: boolean;
  numero_asientos: number;
  color_hex: string;
  descripcion: string;
  /** Optional English translation of the description (seed content). */
  descripcion_en?: string;
  dias_operacion: string[];
  estado: RouteStatus;
}

export interface Bus {
  id_bus: number;           // bigint en Supabase
  placa: string;
  modelo: string;
  capacidad: number;
  estado: BusStatus;
}

export interface Asignacion {
  id_asignacion: number;    // bigint en Supabase
  id_ruta: number;
  id_bus: number | null;    // bigint en Supabase
  id_chofer: string | null; // uuid
  fecha: string;
  hora_salida: string;
  hora_regreso: string;
  cupos_totales: number;
  cupos_disponibles: number;
  cupos_reservados: number;
  estado: AssignmentStatus;
}

export interface Reserva {
  id_reserva: number;       // bigint en Supabase
  id_usuario: string;       // uuid
  id_asignacion: number;    // bigint en Supabase
  estado: ReservationStatus;
  qr_token: string;
  qr_escaneado_at?: string | null;
  qr_escaneado_por?: string | null;
  posicion_waitlist?: number | null;
  observaciones?: string;
  created_at: string;
}

// Refleja exactamente la tabla bus_locations de Supabase
export interface BusLocation {
  id: number;
  id_bus: number | null;
  id_asignacion: number | null;
  latitud: number;
  longitud: number;
  velocidad: number | null;
  precision: number | null;
  timestamp: string;
}

export interface Mensaje {
  id_mensaje: number;       // bigint en Supabase
  remitente_id: string | null;       // de_usuario uuid
  destinatario_id?: string | null;   // para_usuario uuid
  destinatario_ruta?: number | null; // para_ruta bigint
  asunto: string;
  cuerpo: string;
  /** Optional English translations (seed content only; user-authored messages show as written). */
  asunto_en?: string;
  cuerpo_en?: string;
  leido: boolean;           // boolean en Supabase
  created_at: string;
}

export interface Evento {
  id: number;
  id_usuario: string | null;
  id_ruta: number | null;
  tipo: string;
  payload: Record<string, unknown>;
  created_at: string;
}
