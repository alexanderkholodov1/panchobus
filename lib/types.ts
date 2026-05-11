// Tipos centrales del dominio Pancho Bus.
// Se usan en toda la app y son la "fuente de verdad" para mocks y Supabase.

export type Role = "estudiante" | "admin" | "chofer";
export type UserStatus = "pendiente" | "activo" | "suspendido";
export type RouteStatus = "activa" | "inactiva" | "suspendida";
export type BusStatus = "disponible" | "mantenimiento" | "fuera_servicio";
export type AssignmentStatus = "programada" | "en_curso" | "completada" | "cancelada";
export type ReservationStatus =
  | "confirmada"
  | "en_espera"
  | "cancelada"
  | "usada"
  | "no_show";

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
  hora_salida: string; // "HH:MM"
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
  dias_operacion: string[];
  estado: RouteStatus;
}

export interface Bus {
  id_bus: string;
  placa: string;
  modelo: string;
  capacidad: number;
  estado: BusStatus;
  id_chofer_asignado: string | null;
}

export interface Asignacion {
  id_asignacion: string;
  id_ruta: number;
  id_bus: string;
  id_chofer: string;
  fecha: string; // YYYY-MM-DD
  hora_salida: string;
  hora_regreso: string;
  estado: AssignmentStatus;
  cupos_disponibles: number;
  cupos_reservados: number;
}

export interface Reserva {
  id_reserva: string;
  id_usuario: string;
  id_asignacion: string;
  estado: ReservationStatus;
  qr_token: string;
  qr_escaneado_at?: string | null;
  qr_escaneado_por?: string | null;
  posicion_waitlist?: number | null;
  observaciones?: string;
  created_at: string;
}

export interface BusLocation {
  id_bus: string;
  id_asignacion: string;
  lat: number;
  lng: number;
  velocidad: number;
  reportado_at: string;
}

export interface Mensaje {
  id_mensaje: string;
  remitente_id: string;
  destinatario_id?: string | null;
  destinatario_ruta?: number | null;
  asunto: string;
  cuerpo: string;
  leido_at?: string | null;
  created_at: string;
}

export interface Evento {
  id: number;
  id_usuario: string | null;
  tipo: string;
  payload: Record<string, unknown>;
  created_at: string;
}

/** Sesión simplificada (demo) */
export interface DemoSession {
  user: Usuario | null;
  isAuthenticated: boolean;
}
