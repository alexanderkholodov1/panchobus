/**
 * Capa de acceso a datos — abstracción sobre Supabase / demo mode.
 *
 * Cuando NEXT_PUBLIC_SUPABASE_URL está definido → usa Supabase (producción).
 * Cuando no → usa store en memoria + localStorage (demo mode).
 *
 * Todas las páginas consumen `db.*` — nunca acceden directamente a Supabase.
 */

import {
  SEED_ASIGNACIONES,
  SEED_BUSES,
  SEED_MENSAJES,
  SEED_PARADAS,
  SEED_RESERVAS,
  SEED_RUTAS,
  SEED_USUARIOS,
} from "@/lib/data/seed";
import type {
  Asignacion,
  Bus,
  Mensaje,
  Parada,
  Reserva,
  Ruta,
  Usuario,
} from "@/lib/types";

const IS_SUPABASE =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ============================================================
// SUPABASE CLIENT (lazy — solo si está configurado)
// ============================================================
function getSupabase() {
  if (!IS_SUPABASE) return null;
  const { createBrowserClient } = require("@supabase/ssr");
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ============================================================
// DEMO MODE — Store en memoria + localStorage
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

let _store: Store | null = null;

function getStore(): Store {
  if (_store) return _store;
  _store = {
    usuarios: structuredClone(SEED_USUARIOS),
    rutas: structuredClone(SEED_RUTAS),
    paradas: structuredClone(SEED_PARADAS),
    buses: structuredClone(SEED_BUSES),
    asignaciones: structuredClone(SEED_ASIGNACIONES),
    reservas: structuredClone(SEED_RESERVAS),
    mensajes: structuredClone(SEED_MENSAJES),
  };
  if (typeof window !== "undefined") {
    try {
      const persisted = localStorage.getItem("panchobus-store-overrides");
      if (persisted) {
        const o = JSON.parse(persisted);
        if (o.reservas) _store.reservas = o.reservas;
        if (o.mensajes) _store.mensajes = o.mensajes;
        if (o.usuarios) _store.usuarios = o.usuarios;
      }
    } catch { /* ignore */ }
  }
  return _store;
}

function persist(s: Store) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      "panchobus-store-overrides",
      JSON.stringify({ reservas: s.reservas, mensajes: s.mensajes, usuarios: s.usuarios })
    );
  } catch { /* ignore quota errors */ }
}

// ============================================================
// API PÚBLICA
// ============================================================
export const db = {

  // ──────────────────────────────────────────────────────────
  // RUTAS
  // ──────────────────────────────────────────────────────────
  async getRutas(): Promise<Ruta[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("rutas").select("*").order("codigo");
      if (error) throw error;
      return data ?? [];
    }
    return getStore().rutas;
  },

  async getRuta(id: number): Promise<Ruta | null> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("rutas").select("*").eq("id_ruta", id).single();
      if (error) return null;
      return data;
    }
    return getStore().rutas.find((r) => r.id_ruta === id) ?? null;
  },

  async createRuta(r: Omit<Ruta, "id_ruta">): Promise<Ruta> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("rutas").insert(r).select().single();
      if (error) throw error;
      return data;
    }
    const s = getStore();
    const id_ruta = Math.max(0, ...s.rutas.map((x) => x.id_ruta)) + 1;
    const nueva: Ruta = { ...r, id_ruta };
    s.rutas.push(nueva);
    persist(s);
    return nueva;
  },

  async updateRuta(id: number, patch: Partial<Ruta>): Promise<Ruta | null> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("rutas").update(patch).eq("id_ruta", id).select().single();
      if (error) return null;
      return data;
    }
    const s = getStore();
    const idx = s.rutas.findIndex((r) => r.id_ruta === id);
    if (idx < 0) return null;
    s.rutas[idx] = { ...s.rutas[idx], ...patch };
    persist(s);
    return s.rutas[idx];
  },

  async deleteRuta(id: number): Promise<void> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      await supabase.from("rutas").delete().eq("id_ruta", id);
      return;
    }
    const s = getStore();
    s.rutas = s.rutas.filter((r) => r.id_ruta !== id);
    persist(s);
  },

  // ──────────────────────────────────────────────────────────
  // PARADAS
  // ──────────────────────────────────────────────────────────
  async getParadasByRuta(id_ruta: number): Promise<Parada[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("paradas").select("*").eq("id_ruta", id_ruta).order("orden");
      if (error) throw error;
      return data ?? [];
    }
    return getStore().paradas.filter((p) => p.id_ruta === id_ruta).sort((a, b) => a.orden - b.orden);
  },

  async getAllParadas(): Promise<Parada[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("paradas").select("*").order("id_ruta, orden");
      if (error) throw error;
      return data ?? [];
    }
    return getStore().paradas;
  },

  // ──────────────────────────────────────────────────────────
  // USUARIOS
  // ──────────────────────────────────────────────────────────
  async getUsuarios(): Promise<Usuario[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("usuarios").select("*").order("nombre");
      if (error) throw error;
      return data ?? [];
    }
    return getStore().usuarios;
  },

  async getUsuario(id: string): Promise<Usuario | null> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("usuarios").select("*").eq("id_usuario", id).single();
      if (error) return null;
      return data;
    }
    return getStore().usuarios.find((u) => u.id_usuario === id) ?? null;
  },

  async getUsuariosByRol(rol: Usuario["rol"]): Promise<Usuario[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("usuarios").select("*").eq("rol", rol).order("nombre");
      if (error) throw error;
      return data ?? [];
    }
    return getStore().usuarios.filter((u) => u.rol === rol);
  },

  async addUsuario(usuario: Usuario): Promise<Usuario> {
    if (IS_SUPABASE) {
      // En Supabase el insert lo hace el trigger handle_new_user en auth.
      // Este método se usa para crear choferes/admins manualmente desde el panel admin.
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("usuarios").upsert(usuario, { onConflict: "id_usuario" }).select().single();
      if (error) throw error;
      return data;
    }
    const s = getStore();
    if (!s.usuarios.find((u) => u.id_usuario === usuario.id_usuario)) {
      s.usuarios.push(usuario);
      persist(s);
    }
    return usuario;
  },

  async updateUsuario(id: string, patch: Partial<Usuario>): Promise<Usuario | null> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("usuarios").update(patch).eq("id_usuario", id).select().single();
      if (error) return null;
      return data;
    }
    const s = getStore();
    const idx = s.usuarios.findIndex((u) => u.id_usuario === id);
    if (idx < 0) return null;
    s.usuarios[idx] = { ...s.usuarios[idx], ...patch };
    persist(s);
    return s.usuarios[idx];
  },

  // ──────────────────────────────────────────────────────────
  // BUSES
  // ──────────────────────────────────────────────────────────
  async getBuses(): Promise<Bus[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("buses").select("*").order("placa");
      if (error) throw error;
      return data ?? [];
    }
    return getStore().buses;
  },

  // ──────────────────────────────────────────────────────────
  // ASIGNACIONES
  // ──────────────────────────────────────────────────────────
  async getAsignaciones(): Promise<Asignacion[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("asignaciones").select("*").order("fecha", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(normalizeAsignacion);
    }
    return getStore().asignaciones;
  },

  async getAsignacion(id: number): Promise<Asignacion | null> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("asignaciones").select("*").eq("id_asignacion", id).single();
      if (error) return null;
      return normalizeAsignacion(data);
    }
    return getStore().asignaciones.find((a) => a.id_asignacion === id) ?? null;
  },

  async getAsignacionesByFecha(fecha: string): Promise<Asignacion[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("asignaciones").select("*").eq("fecha", fecha);
      if (error) throw error;
      return (data ?? []).map(normalizeAsignacion);
    }
    return getStore().asignaciones.filter((a) => a.fecha === fecha);
  },

  async getAsignacionesByChofer(idChofer: string): Promise<Asignacion[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("asignaciones").select("*").eq("id_chofer", idChofer);
      if (error) throw error;
      return (data ?? []).map(normalizeAsignacion);
    }
    return getStore().asignaciones.filter((a) => a.id_chofer === idChofer);
  },

  async getAsignacionesByRuta(idRuta: number): Promise<Asignacion[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("asignaciones").select("*").eq("id_ruta", idRuta).order("fecha");
      if (error) throw error;
      return (data ?? []).map(normalizeAsignacion);
    }
    return getStore().asignaciones.filter((a) => a.id_ruta === idRuta);
  },

  // ──────────────────────────────────────────────────────────
  // RESERVAS
  // ──────────────────────────────────────────────────────────
  async getReservas(): Promise<Reserva[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("reservas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(normalizeReserva);
    }
    return getStore().reservas;
  },

  async getReservasByUsuario(idUsuario: string): Promise<Reserva[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("reservas").select("*").eq("id_usuario", idUsuario)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(normalizeReserva);
    }
    return getStore().reservas.filter((r) => r.id_usuario === idUsuario);
  },

  async getReservasByAsignacion(idAsignacion: number): Promise<Reserva[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("reservas").select("*").eq("id_asignacion", idAsignacion);
      if (error) throw error;
      return (data ?? []).map(normalizeReserva);
    }
    return getStore().reservas.filter((r) => r.id_asignacion === idAsignacion);
  },

  async createReserva(
    idUsuario: string,
    idAsignacion: number,
    observaciones?: string
  ): Promise<Reserva> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data: asg } = await supabase
        .from("asignaciones").select("cupos_disponibles, cupos_reservados").eq("id_asignacion", idAsignacion).single();
      const enEspera = asg ? asg.cupos_reservados >= asg.cupos_disponibles : false;
      let posicion_waitlist: number | null = null;
      if (enEspera) {
        const { count } = await supabase
          .from("reservas").select("*", { count: "exact", head: true })
          .eq("id_asignacion", idAsignacion).eq("estado", "en_espera");
        posicion_waitlist = (count ?? 0) + 1;
      }
      const { data, error } = await supabase.from("reservas").insert({
        id_usuario: idUsuario,
        id_asignacion: idAsignacion,
        estado: enEspera ? "en_espera" : "confirmada",
        posicion_waitlist,
      }).select().single();
      if (error) throw error;
      if (!enEspera) {
        await supabase.from("asignaciones")
          .update({ cupos_reservados: (asg?.cupos_reservados ?? 0) + 1 })
          .eq("id_asignacion", idAsignacion);
      }
      return normalizeReserva(data);
    }
    // Demo mode
    const s = getStore();
    const asg = s.asignaciones.find((a) => a.id_asignacion === idAsignacion);
    const enEspera = asg ? asg.cupos_reservados >= asg.cupos_disponibles : false;
    const reserva: Reserva = {
      id_reserva: Date.now(),
      id_usuario: idUsuario,
      id_asignacion: idAsignacion,
      estado: enEspera ? "en_espera" : "confirmada",
      qr_token: `QR-${idAsignacion}-${idUsuario}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      posicion_waitlist: enEspera
        ? s.reservas.filter((r) => r.id_asignacion === idAsignacion && r.estado === "en_espera").length + 1
        : null,
      observaciones,
      created_at: new Date().toISOString(),
    };
    s.reservas.push(reserva);
    if (asg && !enEspera) asg.cupos_reservados += 1;
    persist(s);
    return reserva;
  },

  async cancelReserva(idReserva: number): Promise<void> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data: reserva } = await supabase
        .from("reservas").select("id_asignacion, estado").eq("id_reserva", idReserva).single();
      await supabase.from("reservas").update({ estado: "cancelada" }).eq("id_reserva", idReserva);
      if (reserva?.estado === "confirmada") {
        const { data: asg } = await supabase
          .from("asignaciones").select("cupos_reservados").eq("id_asignacion", reserva.id_asignacion).single();
        if (asg) {
          await supabase.from("asignaciones")
            .update({ cupos_reservados: Math.max(0, asg.cupos_reservados - 1) })
            .eq("id_asignacion", reserva.id_asignacion);
        }
        const { data: espera } = await supabase
          .from("reservas").select("id_reserva")
          .eq("id_asignacion", reserva.id_asignacion).eq("estado", "en_espera")
          .order("posicion_waitlist").limit(1).single();
        if (espera) {
          await supabase.from("reservas")
            .update({ estado: "confirmada", posicion_waitlist: null })
            .eq("id_reserva", espera.id_reserva);
        }
      }
      return;
    }
    const s = getStore();
    const r = s.reservas.find((x) => x.id_reserva === idReserva);
    if (!r) return;
    r.estado = "cancelada";
    const asg = s.asignaciones.find((a) => a.id_asignacion === r.id_asignacion);
    if (asg && asg.cupos_reservados > 0) asg.cupos_reservados -= 1;
    persist(s);
  },

  async scanQR(qrToken: string, idChofer: string): Promise<Reserva | null> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data: reserva } = await supabase
        .from("reservas").select("*").eq("qr_token", qrToken).single();
      if (!reserva) return null;
      if (reserva.estado === "usada") return normalizeReserva(reserva);
      const { data, error } = await supabase
        .from("reservas")
        .update({
          estado: "usada",
          qr_escaneado_at: new Date().toISOString(),
          qr_escaneado_por: idChofer,
        })
        .eq("qr_token", qrToken)
        .select().single();
      if (error) return null;
      return normalizeReserva(data);
    }
    const s = getStore();
    const r = s.reservas.find((x) => x.qr_token === qrToken);
    if (!r) return null;
    if (r.estado === "usada") return r;
    r.estado = "usada";
    r.qr_escaneado_at = new Date().toISOString();
    r.qr_escaneado_por = idChofer;
    persist(s);
    return r;
  },

  // ──────────────────────────────────────────────────────────
  // MENSAJES
  // ──────────────────────────────────────────────────────────
  async getMensajes(): Promise<Mensaje[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("mensajes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(normalizeMensaje);
    }
    return getStore().mensajes;
  },

  async getMensajesDeUsuario(idUsuario: string): Promise<Mensaje[]> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      // Mensajes dirigidos a este usuario directamente O a su ruta
      const { data: usuario } = await supabase
        .from("usuarios").select("id_ruta").eq("id_usuario", idUsuario).single();
      const idRuta = usuario?.id_ruta ?? null;
      let query = supabase.from("mensajes").select("*");
      if (idRuta) {
        query = query.or(`para_usuario.eq.${idUsuario},para_ruta.eq.${idRuta}`);
      } else {
        query = query.eq("para_usuario", idUsuario);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(normalizeMensaje);
    }
    return getStore().mensajes
      .filter((m) => m.destinatario_id === idUsuario || m.remitente_id === idUsuario)
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  },

  async createMensaje(m: Omit<Mensaje, "id_mensaje" | "created_at">): Promise<Mensaje> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("mensajes").insert({
        asunto: m.asunto,
        cuerpo: m.cuerpo,
        de_usuario: m.remitente_id ?? null,
        para_usuario: m.destinatario_id ?? null,
        para_ruta: m.destinatario_ruta ?? null,
        leido: false,
      }).select().single();
      if (error) throw error;
      return normalizeMensaje(data);
    }
    const s = getStore();
    const nuevo: Mensaje = {
      ...m,
      id_mensaje: Date.now(),
      created_at: new Date().toISOString(),
    };
    s.mensajes.push(nuevo);
    persist(s);
    return nuevo;
  },

  async marcarMensajeLeido(idMensaje: number): Promise<void> {
    if (IS_SUPABASE) {
      const supabase = getSupabase();
      await supabase.from("mensajes").update({ leido: true }).eq("id_mensaje", idMensaje);
      return;
    }
    const s = getStore();
    const m = s.mensajes.find((x) => x.id_mensaje === idMensaje);
    if (m) { m.leido = true; persist(s); }
  },
};

// ============================================================
// NORMALIZERS — mapean columnas de Supabase al tipo interno
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAsignacion(d: any): Asignacion {
  return {
    id_asignacion: Number(d.id_asignacion),
    id_ruta:       Number(d.id_ruta),
    id_bus:        d.id_bus != null ? Number(d.id_bus) : null,
    id_chofer:     d.id_chofer ?? null,
    fecha:         d.fecha,
    hora_salida:   d.hora_salida,
    hora_regreso:  d.hora_regreso ?? "",
    cupos_totales:      d.cupos_totales ?? d.cupos_disponibles,
    cupos_disponibles:  d.cupos_disponibles,
    cupos_reservados:   d.cupos_reservados,
    estado:        d.estado,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeReserva(d: any): Reserva {
  return {
    id_reserva:        Number(d.id_reserva),
    id_usuario:        d.id_usuario,
    id_asignacion:     Number(d.id_asignacion),
    estado:            d.estado,
    qr_token:          d.qr_token,
    qr_escaneado_at:   d.qr_escaneado_at ?? null,
    qr_escaneado_por:  d.qr_escaneado_por ?? null,
    posicion_waitlist: d.posicion_waitlist ?? null,
    observaciones:     d.observaciones ?? undefined,
    created_at:        d.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMensaje(d: any): Mensaje {
  return {
    id_mensaje:        Number(d.id_mensaje),
    remitente_id:      d.de_usuario ?? null,
    destinatario_id:   d.para_usuario ?? null,
    destinatario_ruta: d.para_ruta != null ? Number(d.para_ruta) : null,
    asunto:            d.asunto ?? "",
    cuerpo:            d.cuerpo,
    leido:             d.leido ?? false,
    created_at:        d.created_at,
  };
}
