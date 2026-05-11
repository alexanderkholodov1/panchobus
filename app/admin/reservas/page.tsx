"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { toast } from "@/components/ui/toaster";
import type { Asignacion, Reserva, Ruta, Usuario } from "@/lib/types";
import { Search, XCircle, CalendarCheck, Clock, User } from "lucide-react";

const ESTADO_META: Record<string, "success"|"warning"|"info"|"default"|"error"> = {
  confirmada:"success", en_espera:"warning", usada:"info", cancelada:"default", no_show:"error"
};

export default function AdminReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [q, setQ] = useState("");
  const [estadoF, setEstadoF] = useState("todas");
  const [rutaF, setRutaF] = useState("");
  const [canceling, setCanceling] = useState<string|null>(null);

  const load = () => Promise.all([
    db.getReservas(), db.getAsignaciones(), db.getRutas(), db.getUsuarios()
  ]).then(([r,a,rt,u]) => { setReservas(r); setAsignaciones(a); setRutas(rt); setUsuarios(u); });

  useEffect(() => { load(); }, []);

  const enriched = useMemo(() => reservas.map((r) => ({
    ...r,
    asg: asignaciones.find((a) => a.id_asignacion === r.id_asignacion),
    ruta: rutas.find((rt) => rt.id_ruta === asignaciones.find((a) => a.id_asignacion === r.id_asignacion)?.id_ruta),
    usuario: usuarios.find((u) => u.id_usuario === r.id_usuario)
  })), [reservas, asignaciones, rutas, usuarios]);

  const filtered = useMemo(() => enriched.filter((r) => {
    const matchQ = !q || r.usuario?.nombre.toLowerCase().includes(q.toLowerCase()) || r.qr_token.toLowerCase().includes(q.toLowerCase());
    const matchE = estadoF === "todas" || r.estado === estadoF;
    const matchR = !rutaF || r.ruta?.id_ruta === Number(rutaF);
    return matchQ && matchE && matchR;
  }).sort((a,b) => +new Date(b.created_at)-+new Date(a.created_at)), [enriched, q, estadoF, rutaF]);

  const cancelar = async (id: string) => {
    setCanceling(id);
    await db.cancelReserva(id);
    toast({ title:"Reserva cancelada", variant:"info" });
    setCanceling(null); load();
  };

  const exportCSV = () => {
    const rows = [["ID","Usuario","Email","Ruta","Fecha","Salida","Estado","QR"]];
    filtered.forEach((r) => rows.push([
      r.id_reserva, r.usuario?.nombre??"", r.usuario?.correo_electronico??"",
      `${r.ruta?.codigo??""} ${r.ruta?.nombre??""}`, r.asg?.fecha??"", r.asg?.hora_salida??"",
      r.estado, r.qr_token
    ]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `reservas-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast({ title:"CSV descargado", variant:"success" });
  };

  return (
    <AppShell role="admin">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-muted mb-1">Gestión</p>
            <h1 className="font-display text-3xl">Reservas</h1>
          </div>
          <Button variant="outline" onClick={exportCSV}>Exportar CSV</Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Buscar por nombre o QR…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="h-10 px-3 rounded-lg border border-border bg-surface text-sm"
            value={estadoF} onChange={(e) => setEstadoF(e.target.value)}>
            <option value="todas">Todos los estados</option>
            <option value="confirmada">Confirmada</option>
            <option value="en_espera">En espera</option>
            <option value="usada">Usada</option>
            <option value="cancelada">Cancelada</option>
            <option value="no_show">No show</option>
          </select>
          <select className="h-10 px-3 rounded-lg border border-border bg-surface text-sm"
            value={rutaF} onChange={(e) => setRutaF(e.target.value)}>
            <option value="">Todas las rutas</option>
            {rutas.map((r) => <option key={r.id_ruta} value={r.id_ruta}>{r.codigo} · {r.nombre}</option>)}
          </select>
        </div>

        <p className="text-sm text-muted">{filtered.length} reservas</p>

        <div className="space-y-2">
          {filtered.map((r) => {
            const meta = ESTADO_META[r.estado] ?? "default";
            return (
              <Card key={r.id_reserva}>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={meta}>{r.estado}</Badge>
                        {r.ruta && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium"
                            style={{ color: r.ruta.color_hex }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: r.ruta.color_hex }} />
                            {r.ruta.codigo}
                          </span>
                        )}
                      </div>
                      <p className="font-medium">{r.usuario?.nombre ?? "Desconocido"}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted mt-1">
                        <span className="flex items-center gap-1"><User className="w-3 h-3"/>{r.usuario?.correo_electronico}</span>
                        {r.asg && <>
                          <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3"/>{r.asg.fecha}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{r.asg.hora_salida}</span>
                        </>}
                        {r.posicion_waitlist && <span className="text-state-warn">Espera #{r.posicion_waitlist}</span>}
                      </div>
                      <p className="text-xs text-muted font-mono mt-1 truncate">{r.qr_token}</p>
                    </div>
                    {(r.estado === "confirmada" || r.estado === "en_espera") && (
                      <Button size="sm" variant="outline" className="text-state-error border-state-error/30 hover:bg-state-error/10 shrink-0"
                        loading={canceling === r.id_reserva} onClick={() => cancelar(r.id_reserva)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card><CardBody className="text-center py-8 text-muted">Sin reservas con los filtros actuales.</CardBody></Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
