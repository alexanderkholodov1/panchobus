/**
 * Capa de acceso a datos — abstracción sobre Supabase / mocks.
 *
 * Diseño: todas las páginas de la app consumen estas funciones, NUNCA
 * acceden directamente a Supabase o al seed. Esto permite:
 *
 *  1. Funcionar en modo demo sin Supabase configurado.
 *  2. Migrar a Firestore/Realtime DB en el futuro cambiando solo este archivo.
 *
 * Cuando `NEXT_PUBLIC_SUPABASE_URL` está definido, se delega al cliente
 * Supabase. Si no, devuelve los datos del seed con persistencia opcional en
 * localStorage para reservas/mensajes creados durante la sesión.
 */
import {
  SEED_ASIGNACIONES,
  SEED_BUSES,
  SEED_MENSAJES,
  SEED_PARADAS,
  SEED_RESERVAS,
  SEED_RUTAS,
  SEED_USUARIOS
} from "@/lib/data/seed";
import type {
  Asignacion,
  Bus,
  Mensaje,
  Parada,
  Reserva,
  Ruta,
  Usuario
} from "@/lib/types";

// ============================================================
// Estado en memoria (mutable durante la sesión)
// ============================================================
type Store = {
  usuarios: Usuario[];
  rutas: Ruta[];
  paradas: Parada[];
  buses: Bus[];
  asignaciones: Asignacion[];
  reservas: Reserva[];
  mensajes: Mensaje[];
};

let store: Store | null = null;

function getStore(): Store {
  if (store) return store;
  // Deep clone para no mutar las constantes
  store = {
    usuarios: structuredClone(SEED_USUARIOS),
    rutas: structuredClone(SEED_RUTAS),
    paradas: structuredClone(SEED_PARADAS),
    buses: structuredClone(SEED_BUSES),
    asignaciones: structuredClone(SEED_ASIGNACIONES),
    reservas: structuredClone(SEED_RESERVAS),
    mensajes: structuredClone(SEED_MENSAJES)
  };
  // Hidratar desde localStorage si estamos en cliente
  if (typeof window !== "undefined") {
    try {
      const persisted = localStorage.getItem("panchobus-store-overrides");
      if (persisted) {
        const overrides = JSON.parse(persisted);
        if (overrides.reservas) store.reservas = overrides.reservas;
        if (overrides.mensajes) store.mensajes = overrides.mensajes;
        if (overrides.usuarios) store.usuarios = overrides.usuarios;
      }
    } catch {
      // ignore
    }
  }
  return store;
}

function persist(s: Store) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      "panchobus-store-overrides",
      JSON.stringify({
        reservas: s.reservas,
        mensajes: s.mensajes,
        usuarios: s.usuarios
      })
    );
  } catch {
    // ignore quota errors
  }
}

// ============================================================
// API pública
// ============================================================

export const db = {
  // ---------- RUTAS ----------
  async getRutas(): Promise<Ruta[]> {
    return getStore().rutas;
  },
  async getRuta(id: number): Promise<Ruta | null> {
    return getStore().rutas.find((r) => r.id_ruta === id) ?? null;
  },
  async createRuta(r: Omit<Ruta, "id_ruta">): Promise<Ruta> {
    const s = getStore();
    const id_ruta = Math.max(0, ...s.rutas.map((x) => x.id_ruta)) + 1;
    const nueva: Ruta = { ...r, id_ruta };
    s.rutas.push(nueva);
    persist(s);
    return nueva;
  },
  async updateRuta(id: number, patch: Partial<Ruta>): Promise<Ruta | null> {
    const s = getStore();
    const idx = s.rutas.findIndex((r) => r.id_ruta === id);
    if (idx < 0) return null;
    s.rutas[idx] = { ...s.rutas[idx], ...patch };
    persist(s);
    return s.rutas[idx];
  },
  async deleteRuta(id: number): Promise<void> {
    const s = getStore();
    s.rutas = s.rutas.filter((r) => r.id_ruta !== id);
    persist(s);
  },

  // ---------- PARADAS ----------
  async getParadasByRuta(id_ruta: number): Promise<Parada[]> {
    return getStore()
      .paradas.filter((p) => p.id_ruta === id_ruta)
      .sort((a, b) => a.orden - b.orden);
  },
  async getAllParadas(): Promise<Parada[]> {
    return getStore().paradas;
  },

  // ---------- USUARIOS ----------
  async getUsuarios(): Promise<Usuario[]> {
    return getStore().usuarios;
  },
  async getUsuario(id: string): Promise<Usuario | null> {
    return getStore().usuarios.find((u) => u.id_usuario === id) ?? null;
  },
  async getUsuariosByRol(rol: Usuario["rol"]): Promise<Usuario[]> {
    return getStore().usuarios.filter((u) => u.rol === rol);
  },
  async updateUsuario(id: string, patch: Partial<Usuario>): Promise<Usuario | null> {
    const s = getStore();
    const idx = s.usuarios.findIndex((u) => u.id_usuario === id);
    if (idx < 0) return null;
    s.usuarios[idx] = { ...s.usuarios[idx], ...patch };
    persist(s);
    return s.usuarios[idx];
  },

  // ---------- BUSES ----------
  async getBuses(): Promise<Bus[]> {
    return getStore().buses;
  },

  // ---------- ASIGNACIONES ----------
  async getAsignaciones(): Promise<Asignacion[]> {
    return getStore().asignaciones;
  },
  async getAsignacion(id: string): Promise<Asignacion | null> {
    return getStore().asignaciones.find((a) => a.id_asignacion === id) ?? null;
  },
  async getAsignacionesByFecha(fecha: string): Promise<Asignacion[]> {
    return getStore().asignaciones.filter((a) => a.fecha === fecha);
  },
  async getAsignacionesByChofer(idChofer: string): Promise<Asignacion[]> {
    return getStore().asignaciones.filter((a) => a.id_chofer === idChofer);
  },
  async getAsignacionesByRuta(idRuta: number): Promise<Asignacion[]> {
    return getStore().asignaciones.filter((a) => a.id_ruta === idRuta);
  },

  // ---------- RESERVAS ----------
  async getReservas(): Promise<Reserva[]> {
    return getStore().reservas;
  },
  async getReservasByUsuario(idUsuario: string): Promise<Reserva[]> {
    return getStore().reservas.filter((r) => r.id_usuario === idUsuario);
  },
  async getReservasByAsignacion(idAsignacion: string): Promise<Reserva[]> {
    return getStore().reservas.filter((r) => r.id_asignacion === idAsignacion);
  },
  async createReserva(
    idUsuario: string,
    idAsignacion: string,
    observaciones?: string
  ): Promise<Reserva> {
    const s = getStore();
    const asg = s.asignaciones.find((a) => a.id_asignacion === idAsignacion);
    const enEspera = asg ? asg.cupos_reservados >= asg.cupos_disponibles : false;
    const reserva: Reserva = {
      id_reserva: `rsv-${Date.now()}`,
      id_usuario: idUsuario,
      id_asignacion: idAsignacion,
      estado: enEspera ? "en_espera" : "confirmada",
      qr_token: `QR-${idAsignacion}-${idUsuario}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`,
      posicion_waitlist: enEspera ? (asg ? s.reservas.filter((r) => r.id_asignacion === idAsignacion && r.estado === "en_espera").length + 1 : 1) : null,
      observaciones,
      created_at: new Date().toISOString()
    };
    s.reservas.push(reserva);
    if (asg && !enEspera) asg.cupos_reservados += 1;
    persist(s);
    return reserva;
  },
  async cancelReserva(idReserva: string): Promise<void> {
    const s = getStore();
    const r = s.reservas.find((x) => x.id_reserva === idReserva);
    if (!r) return;
    r.estado = "cancelada";
    const asg = s.asignaciones.find((a) => a.id_asignacion === r.id_asignacion);
    if (asg && asg.cupos_reservados > 0) asg.cupos_reservados -= 1;
    persist(s);
  },
  async scanQR(qrToken: string, idChofer: string): Promise<Reserva | null> {
    const s = getStore();
    const r = s.reservas.find((x) => x.qr_token === qrToken);
    if (!r) return null;
    if (r.estado === "usada") return r; // ya escaneada
    r.estado = "usada";
    r.qr_escaneado_at = new Date().toISOString();
    r.qr_escaneado_por = idChofer;
    persist(s);
    return r;
  },

  // ---------- MENSAJES ----------
  async getMensajes(): Promise<Mensaje[]> {
    return getStore().mensajes;
  },
  async getMensajesDeUsuario(idUsuario: string): Promise<Mensaje[]> {
    return getStore()
      .mensajes.filter(
        (m) => m.destinatario_id === idUsuario || m.remitente_id === idUsuario
      )
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  },
  async createMensaje(m: Omit<Mensaje, "id_mensaje" | "created_at">): Promise<Mensaje> {
    const s = getStore();
    const nuevo: Mensaje = {
      ...m,
      id_mensaje: `msg-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    s.mensajes.push(nuevo);
    persist(s);
    return nuevo;
  }
};
