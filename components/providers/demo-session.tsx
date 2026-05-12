"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Usuario } from "@/lib/types";
import { db } from "@/lib/db";

interface DemoSessionContextType {
  user: Usuario | null;
  isLoading: boolean;
  loginAs: (role: "estudiante" | "admin" | "chofer") => Promise<void>;
  loginByCredentials: (email: string, _password: string) => Promise<Usuario | null>;
  register: (data: Partial<Usuario> & { email: string; password: string }) => Promise<Usuario>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const DemoSessionContext = createContext<DemoSessionContextType | null>(null);
const STORAGE_KEY = "panchobus-session-userid";
const ROLE_DEMO_IDS: Record<string, string> = {
  estudiante: "demo-student",
  admin: "demo-admin",
  chofer: "demo-driver"
};

export function DemoSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async (id: string | null) => {
    if (!id) { setUser(null); return; }
    const u = await db.getUsuario(id);
    setUser(u);
  }, []);

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    loadUser(id).finally(() => setIsLoading(false));
  }, [loadUser]);

  const loginAs = useCallback(async (role: "estudiante" | "admin" | "chofer") => {
    const id = ROLE_DEMO_IDS[role];
    localStorage.setItem(STORAGE_KEY, id);
    await loadUser(id);
  }, [loadUser]);

  const loginByCredentials = useCallback(async (email: string, _password: string): Promise<Usuario | null> => {
    const usuarios = await db.getUsuarios();
    const u = usuarios.find((x) => x.correo_electronico.toLowerCase() === email.toLowerCase());
    if (!u) return null;
    localStorage.setItem(STORAGE_KEY, u.id_usuario);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data: Partial<Usuario> & { email: string; password: string }): Promise<Usuario> => {
    const id = `stu-${Date.now()}`;
    const nuevo: Usuario = {
      id_usuario: id, nombre: data.nombre ?? "", correo_electronico: data.email,
      codigo_banner: data.codigo_banner ?? "", telefono: data.telefono ?? "",
      direccion: data.direccion ?? "", id_ruta: data.id_ruta ?? null,
      rol: "estudiante", estado: "activo", created_at: new Date().toISOString()
    };
    // Persist into the in-memory store so admin pages can find this user by id
    await db.addUsuario(nuevo);
    localStorage.setItem(STORAGE_KEY, id);
    setUser(nuevo);
    return nuevo;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const id = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (id) await loadUser(id);
  }, [loadUser]);

  return (
    <DemoSessionContext.Provider value={{ user, isLoading, loginAs, loginByCredentials, register, logout, refresh }}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(DemoSessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de DemoSessionProvider");
  return ctx;
}
