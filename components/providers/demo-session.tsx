"use client";

/**
 * Session provider — soporta Supabase Auth (producción) y demo mode.
 *
 * Cuando NEXT_PUBLIC_SUPABASE_URL está definido → usa Supabase Auth real.
 * Cuando no → usa store en memoria + localStorage (demo mode).
 *
 * El resto de la app siempre consume `useSession()` — nunca accede a
 * Supabase directamente para auth.
 */

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Usuario } from "@/lib/types";
import { db } from "@/lib/db";
import { STAFF_DOMAIN, STUDENT_DOMAIN } from "@/lib/data/seed";

const IS_SUPABASE =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Credentials of the demo users when running against Supabase (fixed password: demo1234).
// All demo identities are synthetic and use the reserved .example TLD.
const ROLE_DEMO_CREDENTIALS: Record<string, string> = {
  estudiante: `vcastro@${STUDENT_DOMAIN}`,
  admin:      `druiz@${STAFF_DOMAIN}`,
  chofer:     `mguerrero@${STAFF_DOMAIN}`,
};

// IDs en el store local (demo mode sin Supabase)
const ROLE_DEMO_IDS: Record<string, string> = {
  estudiante: "demo-student",
  admin:      "demo-admin",
  chofer:     "demo-driver",
};

interface SessionContextType {
  user: Usuario | null;
  isLoading: boolean;
  loginAs: (role: "estudiante" | "admin" | "chofer") => Promise<void>;
  loginByCredentials: (email: string, password: string) => Promise<Usuario | null>;
  register: (data: Partial<Usuario> & { email: string; password: string }) => Promise<Usuario>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);
const STORAGE_KEY = "panchobus-session-userid";

// ── Helpers Supabase ──────────────────────────────────────────
function getSupabaseClient() {
  const { createBrowserClient } = require("@supabase/ssr");
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Provider ──────────────────────────────────────────────────
export function DemoSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Cargar perfil desde DB ──────────────────────────────────
  const loadProfile = useCallback(async (id: string | null) => {
    if (!id) { setUser(null); return; }
    const u = await db.getUsuario(id);
    setUser(u);
  }, []);

  // ── Init: detectar sesión activa ───────────────────────────
  useEffect(() => {
    if (IS_SUPABASE) {
      const supabase = getSupabaseClient();
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        if (session?.user) {
          loadProfile(session.user.id).finally(() => setIsLoading(false));
        } else {
          setIsLoading(false);
        }
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event: string, session: any) => {
          if (session?.user) {
            await loadProfile(session.user.id);
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      );
      return () => subscription.unsubscribe();
    } else {
      // Demo mode
      const id = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      loadProfile(id).finally(() => setIsLoading(false));
    }
  }, [loadProfile]);

  // ── Login por rol (demo) ───────────────────────────────────
  // En Supabase: autentica con las credenciales del usuario demo (password: demo1234)
  // En demo local: carga el perfil por ID hardcodeado
  const loginAs = useCallback(async (role: "estudiante" | "admin" | "chofer") => {
    if (IS_SUPABASE) {
      const supabase = getSupabaseClient();
      const email = ROLE_DEMO_CREDENTIALS[role];
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: "demo1234",
      });
      if (error) throw new Error(error.message);
      if (data.user) await loadProfile(data.user.id);
    } else {
      const id = ROLE_DEMO_IDS[role];
      localStorage.setItem(STORAGE_KEY, id);
      await loadProfile(id);
    }
  }, [loadProfile]);

  // ── Login con credenciales ─────────────────────────────────
  const loginByCredentials = useCallback(async (email: string, password: string): Promise<Usuario | null> => {
    if (IS_SUPABASE) {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (!data.user) return null;
      const u = await db.getUsuario(data.user.id);
      setUser(u);
      return u;
    }
    // Demo mode
    const usuarios = await db.getUsuarios();
    const u = usuarios.find((x) => x.correo_electronico.toLowerCase() === email.toLowerCase());
    if (!u) return null;
    localStorage.setItem(STORAGE_KEY, u.id_usuario);
    setUser(u);
    return u;
  }, []);

  // ── Registro ───────────────────────────────────────────────
  const register = useCallback(async (
    data: Partial<Usuario> & { email: string; password: string }
  ): Promise<Usuario> => {
    if (IS_SUPABASE) {
      const supabase = getSupabaseClient();
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nombre: data.nombre ?? "",
            correo_electronico: data.email,
            codigo_banner: data.codigo_banner ?? "",
            telefono: data.telefono ?? "",
            direccion: data.direccion ?? "",
            id_ruta: data.id_ruta ? String(data.id_ruta) : "",
            rol: "estudiante",
          },
        },
      });
      if (error) throw new Error(error.message);
      if (!authData.user) throw new Error("SIGNUP_FAILED");
      // El trigger handle_new_user crea la fila en public.usuarios
      await new Promise((r) => setTimeout(r, 800));
      const u = await db.getUsuario(authData.user.id);
      if (u) { setUser(u); return u; }
      // Fallback si el trigger fue lento
      const fallback: Usuario = {
        id_usuario: authData.user.id,
        nombre: data.nombre ?? "",
        correo_electronico: data.email,
        codigo_banner: data.codigo_banner ?? "",
        telefono: data.telefono ?? "",
        direccion: data.direccion ?? "",
        id_ruta: data.id_ruta ?? null,
        rol: "estudiante",
        estado: "activo",
        created_at: new Date().toISOString(),
      };
      setUser(fallback);
      return fallback;
    }
    // Demo mode
    const existing = await db.getUsuarios();
    if (existing.some((u) => u.correo_electronico.toLowerCase() === data.email.toLowerCase())) {
      throw new Error("EMAIL_EXISTS");
    }
    const id = `stu-${Date.now()}`;
    const nuevo: Usuario = {
      id_usuario: id,
      nombre: data.nombre ?? "",
      correo_electronico: data.email,
      codigo_banner: data.codigo_banner ?? "",
      telefono: data.telefono ?? "",
      direccion: data.direccion ?? "",
      id_ruta: data.id_ruta ?? null,
      rol: "estudiante",
      estado: "activo",
      created_at: new Date().toISOString(),
    };
    await db.addUsuario(nuevo);
    localStorage.setItem(STORAGE_KEY, id);
    setUser(nuevo);
    return nuevo;
  }, []);

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback(() => {
    if (IS_SUPABASE) {
      const supabase = getSupabaseClient();
      supabase.auth.signOut();
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setUser(null);
  }, []);

  // ── Refresh ────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (IS_SUPABASE) {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await loadProfile(session.user.id);
    } else {
      const id = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (id) await loadProfile(id);
    }
  }, [loadProfile]);

  return (
    <SessionContext.Provider value={{ user, isLoading, loginAs, loginByCredentials, register, logout, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside DemoSessionProvider");
  return ctx;
}
