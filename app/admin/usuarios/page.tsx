"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { toast } from "@/components/ui/toaster";
import type { Ruta, Usuario } from "@/lib/types";
import { Phone, Mail, Route, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [tab, setTab] = useState<"pendiente"|"activo"|"todos">("pendiente");
  const [updating, setUpdating] = useState<string|null>(null);

  const load = () => Promise.all([db.getUsuarios(), db.getRutas()]).then(([u,r]) => { setUsuarios(u); setRutas(r); });
  useEffect(() => { load(); }, []);

  const aprobar = async (id: string) => {
    setUpdating(id);
    await db.updateUsuario(id, { estado: "activo" });
    toast({ title: "Usuario aprobado", variant: "success" });
    setUpdating(null); load();
  };

  const suspender = async (id: string) => {
    setUpdating(id);
    await db.updateUsuario(id, { estado: "suspendido" });
    toast({ title: "Usuario suspendido", variant: "info" });
    setUpdating(null); load();
  };

  const filtered = tab === "todos" ? usuarios : usuarios.filter((u) => u.estado === tab);
  const estudiantes = filtered.filter((u) => u.rol === "estudiante");

  const counts = {
    pendiente: usuarios.filter((u) => u.estado === "pendiente").length,
    activo: usuarios.filter((u) => u.estado === "activo").length,
    todos: usuarios.length
  };

  return (
    <AppShell role="admin">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">Gestión</p>
          <h1 className="font-display text-3xl">Usuarios</h1>
        </div>

        <div className="flex gap-1 bg-surface-2 p-1 rounded-xl w-fit">
          {(["pendiente","activo","todos"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-surface shadow text-foreground" : "text-muted hover:text-foreground"
              }`}>
              {t.charAt(0).toUpperCase()+t.slice(1)} ({counts[t]})
            </button>
          ))}
        </div>

        {tab === "pendiente" && estudiantes.length > 0 && (
          <div className="bg-state-warn/10 border border-state-warn/30 rounded-xl px-4 py-3 text-sm text-state-warn flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            {estudiantes.length} estudiante{estudiantes.length>1?"s":""} esperando aprobación manual.
          </div>
        )}

        <div className="space-y-2">
          {estudiantes.length === 0 && (
            <Card><CardBody className="text-center py-8 text-muted">Sin usuarios en esta categoría.</CardBody></Card>
          )}
          {estudiantes.map((u) => {
            const ruta = rutas.find((r) => r.id_ruta === u.id_ruta);
            return (
              <Card key={u.id_usuario}>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                      {u.nombre.split(" ").slice(0,2).map((n)=>n[0]).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-medium">{u.nombre}</p>
                        <Badge variant={u.estado==="activo"?"success":u.estado==="pendiente"?"warning":"default"}>
                          {u.estado}
                        </Badge>
                        <Badge variant="info" className="font-mono text-xs">{u.codigo_banner}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{u.correo_electronico}</span>
                        {u.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{u.telefono}</span>}
                        {ruta && <span className="flex items-center gap-1"><Route className="w-3 h-3" />{ruta.codigo}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {u.estado === "pendiente" && (
                        <Button size="sm" loading={updating===u.id_usuario} onClick={() => aprobar(u.id_usuario)}>
                          <CheckCircle2 className="w-4 h-4" />Aprobar
                        </Button>
                      )}
                      {u.estado === "activo" && (
                        <Button size="sm" variant="outline" className="text-state-error border-state-error/30"
                          loading={updating===u.id_usuario} onClick={() => suspender(u.id_usuario)}>
                          <XCircle className="w-4 h-4" />Suspender
                        </Button>
                      )}
                      {u.estado === "suspendido" && (
                        <Button size="sm" variant="outline" loading={updating===u.id_usuario} onClick={() => aprobar(u.id_usuario)}>
                          <CheckCircle2 className="w-4 h-4" />Reactivar
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
