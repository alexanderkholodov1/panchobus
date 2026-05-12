"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { db } from "@/lib/db";
import { toast } from "@/components/ui/toaster";
import type { Ruta, Usuario } from "@/lib/types";
import { Phone, Mail, Route, CheckCircle2, XCircle, Clock, UserPlus } from "lucide-react";

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [tab, setTab] = useState<"pendiente" | "activo" | "todos">("pendiente");
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nombre: "", correo: "", banner: "", rol: "chofer" as "chofer" | "admin", id_ruta: "" });

  const load = () => Promise.all([db.getUsuarios(), db.getRutas()]).then(([u, r]) => { setUsuarios(u); setRutas(r); });
  useEffect(() => { load(); }, []);

  const aprobar = async (id: string) => {
    setUpdating(id);
    await db.updateUsuario(id, { estado: "activo" });
    toast({ title: "Acceso activado", variant: "success" });
    setUpdating(null); load();
  };

  const suspender = async (id: string) => {
    setUpdating(id);
    await db.updateUsuario(id, { estado: "suspendido" });
    toast({ title: "Usuario suspendido", variant: "info" });
    setUpdating(null); load();
  };

  const crearCuenta = async () => {
    if (!form.nombre || !form.correo) return;
    setCreating(true);
    const nuevo: Usuario = {
      id_usuario: `${form.rol}-${Date.now()}`,
      nombre: form.nombre,
      correo_electronico: form.correo,
      codigo_banner: form.banner,
      telefono: "",
      direccion: "",
      id_ruta: form.id_ruta ? Number(form.id_ruta) : null,
      rol: form.rol,
      estado: "activo",
      created_at: new Date().toISOString()
    };
    await db.addUsuario(nuevo);
    toast({ title: `Cuenta de ${form.rol} creada`, variant: "success" });
    setForm({ nombre: "", correo: "", banner: "", rol: "chofer", id_ruta: "" });
    setShowCreate(false);
    setCreating(false);
    load();
  };

  // Estudiantes se auto-aprueban al registrarse.
  // Solo conductores y admins requieren creación manual por el administrador.
  const filtered = tab === "todos" ? usuarios : usuarios.filter((u) => u.estado === tab);
  // "pendiente" tab: muestra solo roles privilegiados pendientes (chofer/admin creados pero no activados)
  // En la práctica con el flujo actual todos los usuarios se crean "activo", pero se mantiene por si Supabase los pone en pendiente
  const displayed = filtered;

  const counts = {
    pendiente: usuarios.filter((u) => u.estado === "pendiente" && u.rol !== "estudiante").length,
    activo: usuarios.filter((u) => u.estado === "activo").length,
    todos: usuarios.length
  };

  return (
    <AppShell role="admin">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted mb-1">Gestión</p>
            <h1 className="font-display text-3xl">Usuarios</h1>
          </div>
          <Button onClick={() => setShowCreate((v) => !v)}>
            <UserPlus className="w-4 h-4" /> Nueva cuenta
          </Button>
        </div>

        {/* Crear conductor / admin */}
        {showCreate && (
          <Card>
            <CardBody className="space-y-4">
              <p className="font-display text-lg">Crear cuenta privilegiada</p>
              <p className="text-sm text-muted">
                Los estudiantes se registran solos. Usa este formulario para crear cuentas de <strong>conductores</strong> o <strong>administradores</strong>.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cn">Nombre completo</Label>
                  <Input id="cn" value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="ce">Correo electrónico</Label>
                  <Input id="ce" type="email" value={form.correo} onChange={(e) => setForm(f => ({ ...f, correo: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="cb">Código / Banner (opcional)</Label>
                  <Input id="cb" value={form.banner} onChange={(e) => setForm(f => ({ ...f, banner: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="cr">Rol</Label>
                  <Select id="cr" value={form.rol} onChange={(e) => setForm(f => ({ ...f, rol: e.target.value as "chofer" | "admin" }))}>
                    <option value="chofer">Personal de Ruta (chofer / acompañante)</option>
                    <option value="admin">Administrador</option>
                  </Select>
                </div>
                {form.rol === "chofer" && (
                  <div>
                    <Label htmlFor="cr2">Ruta asignada</Label>
                    <Select id="cr2" value={form.id_ruta} onChange={(e) => setForm(f => ({ ...f, id_ruta: e.target.value }))}>
                      <option value="">Sin asignar</option>
                      {rutas.map((r) => <option key={r.id_ruta} value={r.id_ruta}>{r.codigo} · {r.nombre}</option>)}
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button loading={creating} onClick={crearCuenta} disabled={!form