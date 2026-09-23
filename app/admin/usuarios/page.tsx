"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { initials } from "@/lib/utils";
import { STAFF_DOMAIN } from "@/lib/data/seed";
import { toast } from "@/components/ui/toaster";
import type { Ruta, Usuario } from "@/lib/types";
import { Phone, Mail, Route, CheckCircle2, XCircle, UserPlus, X, Search } from "lucide-react";

type Tab = "activo" | "pendiente" | "suspendido" | "todos";

export default function AdminUsuariosPage() {
  const { t } = useI18n();
  const U = t.admin.users;
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [tab, setTab] = useState<Tab>("activo");
  const [q, setQ] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nombre: "", correo: "", banner: "", rol: "chofer" as "chofer" | "admin", id_ruta: "" });

  const load = () =>
    Promise.all([db.getUsuarios(), db.getRutas()]).then(([u, r]) => {
      setUsuarios([...u]);
      setRutas(r);
    });

  useEffect(() => { load(); }, []);

  const setEstado = async (id: string, estado: Usuario["estado"]) => {
    setUpdating(id);
    await db.updateUsuario(id, { estado });
    toast({ title: estado === "activo" ? U.toastActivated : U.toastSuspended, variant: estado === "activo" ? "success" : "info" });
    setUpdating(null);
    load();
  };

  const crearCuenta = async () => {
    const correo = form.correo.trim().toLowerCase();
    if (!form.nombre.trim() || !correo) return toast({ title: U.errRequired, variant: "error" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return toast({ title: U.errEmail, variant: "error" });
    if (usuarios.some((u) => u.correo_electronico.toLowerCase() === correo)) return toast({ title: U.errExists, variant: "error" });
    setCreating(true);
    const nuevo: Usuario = {
      id_usuario: `${form.rol}-${Date.now()}`,
      nombre: form.nombre.trim(),
      correo_electronico: correo,
      codigo_banner: form.banner.trim(),
      telefono: "",
      direccion: "",
      id_ruta: form.rol === "chofer" && form.id_ruta ? Number(form.id_ruta) : null,
      rol: form.rol,
      estado: "activo",
      created_at: new Date().toISOString()
    };
    await db.addUsuario(nuevo);
    toast({ title: U.toastCreated(t.roles[form.rol]), variant: "success" });
    setForm({ nombre: "", correo: "", banner: "", rol: "chofer", id_ruta: "" });
    setShowCreate(false);
    setCreating(false);
    load();
  };

  const counts: Record<Tab, number> = {
    activo: usuarios.filter((u) => u.estado === "activo").length,
    pendiente: usuarios.filter((u) => u.estado === "pendiente").length,
    suspendido: usuarios.filter((u) => u.estado === "suspendido").length,
    todos: usuarios.length
  };

  const displayed = useMemo(() => {
    const query = q.trim().toLowerCase();
    const roleOrder = { admin: 0, chofer: 1, estudiante: 2 } as const;
    return usuarios
      .filter((u) => tab === "todos" || u.estado === tab)
      .filter((u) => !query || u.nombre.toLowerCase().includes(query) || u.correo_electronico.toLowerCase().includes(query))
      .sort((a, b) => roleOrder[a.rol] - roleOrder[b.rol] || a.nombre.localeCompare(b.nombre));
  }, [usuarios, tab, q]);

  return (
    <AppShell role="admin">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted mb-1">{U.kicker}</p>
            <h1 className="font-display text-3xl">{U.title}</h1>
          </div>
          <Button onClick={() => setShowCreate((v) => !v)} aria-expanded={showCreate}>
            <UserPlus className="w-4 h-4" /> {U.newAccount}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted">{U.info}</div>

        {showCreate && (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-xl">{U.createTitle}</p>
                <button type="button" onClick={() => setShowCreate(false)} aria-label={t.common.close} className="p-1 hover:bg-surface-2 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cn">{U.fullName}</Label>
                  <Input id="cn" placeholder={U.fullNamePlaceholder} value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="ce">{U.email}</Label>
                  <Input id="ce" type="email" placeholder={`usuario@${STAFF_DOMAIN}`} value={form.correo} onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="cb">{U.code}</Label>
                  <Input id="cb" placeholder="PR-010" value={form.banner} onChange={(e) => setForm((f) => ({ ...f, banner: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="cr">{U.role}</Label>
                  <Select id="cr" value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value as "chofer" | "admin" }))}>
                    <option value="chofer">{U.roleStaff}</option>
                    <option value="admin">{U.roleAdmin}</option>
                  </Select>
                </div>
                {form.rol === "chofer" && (
                  <div>
                    <Label htmlFor="cr2">{U.assignedRoute}</Label>
                    <Select id="cr2" value={form.id_ruta} onChange={(e) => setForm((f) => ({ ...f, id_ruta: e.target.value }))}>
                      <option value="">{U.unassigned}</option>
                      {rutas.map((r) => <option key={r.id_ruta} value={r.id_ruta}>{r.codigo} · {r.nombre}</option>)}
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreate(false)}>{t.common.cancel}</Button>
                <Button loading={creating} onClick={crearCuenta} disabled={!form.nombre || !form.correo}>{U.create}</Button>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div role="tablist" className="flex gap-1 p-1 bg-surface-2 rounded-xl w-fit flex-wrap">
            {(["activo", "pendiente", "suspendido", "todos"] as const).map((tb) => (
              <button key={tb} role="tab" aria-selected={tab === tb} onClick={() => setTab(tb)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === tb ? "bg-surface shadow-sm" : "text-muted hover:text-foreground"}`}>
                {U.tabs[tb]}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tb === "pendiente" && counts.pendiente > 0 ? "bg-state-warn/20 text-state-warn" : "bg-surface-2 text-muted"
                }`}>
                  {counts[tb]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input type="search" aria-label={U.searchPlaceholder} placeholder={U.searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <div className="space-y-3">
          {displayed.length === 0 && (
            <p className="text-sm text-muted text-center py-8">{tab === "pendiente" ? U.emptyPending : U.empty}</p>
          )}
          {displayed.map((u) => {
            const ruta = rutas.find((r) => r.id_ruta === u.id_ruta);
            const isDemo = u.id_usuario.startsWith("demo-");
            return (
              <Card key={u.id_usuario}>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-base shrink-0">
                      {initials(u.nombre)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-medium">{u.nombre}</p>
                        <Badge variant={u.rol === "admin" ? "info" : u.rol === "chofer" ? "default" : "success"}>{t.roles[u.rol]}</Badge>
                        <StatusBadge kind="user" value={u.estado} />
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1 min-w-0"><Mail className="w-3 h-3 shrink-0" /><span className="truncate">{u.correo_electronico}</span></span>
                        {u.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{u.telefono}</span>}
                        {ruta && <span className="flex items-center gap-1"><Route className="w-3 h-3" />{ruta.codigo} · {ruta.nombre}</span>}
                      </div>
                    </div>
                    {!isDemo && (
                      <div className="flex gap-1 shrink-0">
                        {u.estado !== "activo" && (
                          <Button size="sm" variant="outline" aria-label={U.activate(u.nombre)} title={U.activate(u.nombre)}
                            className="text-state-ok border-state-ok/30 hover:bg-state-ok/10"
                            loading={updating === u.id_usuario} onClick={() => setEstado(u.id_usuario, "activo")}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {u.estado !== "suspendido" && (
                          <Button size="sm" variant="outline" aria-label={U.suspend(u.nombre)} title={U.suspend(u.nombre)}
                            className="text-state-error border-state-error/30 hover:bg-state-error/10"
                            loading={updating === u.id_usuario} onClick={() => setEstado(u.id_usuario, "suspendido")}>
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
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
