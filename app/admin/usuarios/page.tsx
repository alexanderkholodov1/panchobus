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
import { Phone, Mail, Route, CheckCircle2, XCircle, UserPlus, X } from "lucide-react";

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [tab, setTab] = useState<"pendiente" | "activo" | "todos">("activo");
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    nombre: "", correo: "", banner: "",
    rol: "chofer" as "chofer" | "admin",
    id_ruta: ""
  });

  const load = () =>
    Promise.all([db.getUsuarios(), db.getRutas()]).then(([u, r]) => {
      setUsuarios(u);
      setRutas(r);
    });

  useEffect(() => { load(); }, []);

  const aprobar = async (id: string) => {
    setUpdating(id);
    await db.updateUsuario(id, { estado: "activo" });
    toast({ title: "Acceso activado", variant: "success" });
    setUpdating(null);
    load();
  };

  const suspender = async (id: string) => {
    setUpdating(id);
    await db.updateUsuario(id, { estado: "suspendido" });
    toast({ title: "Usuario suspendido", variant: "info" });
    setUpdating(null);
    load();
  };

  const crearCuenta = async () => {
    if (!form.nombre || !form.correo) {
      toast({ title: "Completa nombre y correo", variant: "error" });
      return;
    }
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
    toast({ title: `Cuenta de ${form.rol === "chofer" ? "Personal de Ruta" : "Administrador"} creada`, variant: "success" });
    setForm({ nombre: "", correo: "", banner: "", rol: "chofer", id_ruta: "" });
    setShowCreate(false);
    setCreating(false);
    load();
  };

  // Estudiantes se auto-aprueban al registrarse.
  // Solo conductores y admins requieren creación manual por el administrador.
  const displayed = tab === "todos"
    ? usuarios
    : tab === "pendiente"
      ? usuarios.filter((u) => u.estado === "pendiente" && u.rol !== "estudiante")
      : usuarios.filter((u) => u.estado === tab);

  const counts = {
    pendiente: usuarios.filter((u) => u.estado === "pendiente" && u.rol !== "estudiante").length,
    activo: usuarios.filter((u) => u.estado === "activo").length,
    todos: usuarios.length
  };

  const rolLabel = (r: string) =>
    r === "admin" ? "Administración" : r === "chofer" ? "Personal de Ruta" : "Estudiante";

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

        {/* Banner informativo */}
        <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
          Los <strong>estudiantes</strong> se registran solos y quedan activos automáticamente.
          Usa <em>Nueva cuenta</em> para crear cuentas de <strong>Personal de Ruta</strong> o <strong>Administradores</strong>.
        </div>

        {/* Formulario crear cuenta privilegiada */}
        {showCreate && (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-xl">Crear cuenta privilegiada</p>
                <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-surface-2 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cn">Nombre completo</Label>
                  <Input
                    id="cn"
                    placeholder="Nombre Apellido"
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ce">Correo electrónico</Label>
                  <Input
                    id="ce"
                    type="email"
                    placeholder="usuario@usfq.edu.ec"
                    value={form.correo}
                    onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cb">Código / Banner (opcional)</Label>
                  <Input
                    id="cb"
                    placeholder="00XXXX"
                    value={form.banner}
                    onChange={(e) => setForm((f) => ({ ...f, banner: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cr">Rol</Label>
                  <Select
                    id="cr"
                    value={form.rol}
                    onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value as "chofer" | "admin" }))}
                  >
                    <option value="chofer">Personal de Ruta (conductor / acompañante)</option>
                    <option value="admin">Administrador</option>
                  </Select>
                </div>
                {form.rol === "chofer" && (
                  <div>
                    <Label htmlFor="cr2">Ruta asignada</Label>
                    <Select
                      id="cr2"
                      value={form.id_ruta}
                      onChange={(e) => setForm((f) => ({ ...f, id_ruta: e.target.value }))}
                    >
                      <option value="">Sin asignar</option>
                      {rutas.map((r) => (
                        <option key={r.id_ruta} value={r.id_ruta}>
                          {r.codigo} · {r.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button loading={creating} onClick={crearCuenta} disabled={!form.nombre || !form.correo}>
                  Crear cuenta
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-2 rounded-xl w-fit">
          {(["activo", "pendiente", "todos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-surface shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {t === "activo" ? "Activos" : t === "pendiente" ? "Pendientes" : "Todos"}
              {counts[t] > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  t === "pendiente" && counts.pendiente > 0
                    ? "bg-state-warn/20 text-state-warn"
                    : "bg-surface-2 text-muted"
                }`}>
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {displayed.length === 0 && (
            <p className="text-sm text-muted text-center py-8">
              {tab === "pendiente" ? "No hay cuentas pendientes de aprobación." : "Sin usuarios en esta categoría."}
            </p>
          )}
          {displayed.map((u) => {
            const ruta = rutas.find((r) => r.id_ruta === u.id_ruta);
            return (
              <Card key={u.id_usuario}>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-base shrink-0">
                      {u.nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-medium">{u.nombre}</p>
                        <Badge variant={u.rol === "admin" ? "info" : u.rol === "chofer" ? "default" : "success"}>
                          {rolLabel(u.rol)}
                        </Badge>
                        <Badge variant={u.estado === "activo" ? "success" : u.estado === "pendiente" ? "warning" : "error"}>
                          {u.estado}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />{u.correo_electronico}
                        </span>
                        {u.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />{u.telefono}
                          </span>
                        )}
                        {ruta && (
                          <span className="flex items-center gap-1">
                            <Route className="w-3 h-3" />{ruta.codigo} · {ruta.nombre}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {u.estado !== "activo" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-state-ok border-state-ok/30 hover:bg-state-ok/10"
                          loading={updating === u.id_usuario}
                          onClick={() => aprobar(u.id_usuario)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {u.estado !== "suspendido" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-state-error border-state-error/30 hover:bg-state-error/10"
                          loading={updating === u.id_usuario}
                          onClick={() => suspender(u.id_usuario)}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
