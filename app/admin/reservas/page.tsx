"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { localISODate } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import type { Asignacion, Reserva, ReservationStatus, Ruta, Usuario } from "@/lib/types";
import { Search, XCircle, CalendarCheck, Clock, User, Download } from "lucide-react";

const PAGE = 40;
const ESTADOS: ReservationStatus[] = ["confirmada", "en_espera", "usada", "cancelada", "no_show"];

/** RFC 4180 field escaping so names or notes with commas/quotes don't break the CSV. */
function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export default function AdminReservasPage() {
  const { t, fmtDate } = useI18n();
  const B = t.admin.bookings;
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [q, setQ] = useState("");
  const [estadoF, setEstadoF] = useState<"todas" | ReservationStatus>("todas");
  const [rutaF, setRutaF] = useState("");
  const [canceling, setCanceling] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const load = () => Promise.all([db.getReservas(), db.getAsignaciones(), db.getRutas(), db.getUsuarios()])
    .then(([r, a, rt, u]) => { setReservas([...r]); setAsignaciones(a); setRutas(rt); setUsuarios(u); });

  useEffect(() => { load(); }, []);
  useEffect(() => { setLimit(PAGE); }, [q, estadoF, rutaF]);

  const enriched = useMemo(() => reservas.map((r) => {
    const asg = asignaciones.find((a) => a.id_asignacion === r.id_asignacion);
    return {
      ...r,
      asg,
      ruta: rutas.find((rt) => rt.id_ruta === asg?.id_ruta),
      usuario: usuarios.find((u) => u.id_usuario === r.id_usuario)
    };
  }), [reservas, asignaciones, rutas, usuarios]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return enriched.filter((r) => {
      const matchQ = !query
        || r.usuario?.nombre.toLowerCase().includes(query)
        || r.usuario?.correo_electronico.toLowerCase().includes(query)
        || r.qr_token.toLowerCase().includes(query);
      const matchE = estadoF === "todas" || r.estado === estadoF;
      const matchR = !rutaF || r.ruta?.id_ruta === Number(rutaF);
      return matchQ && matchE && matchR;
    }).sort((a, b) =>
      (b.asg?.fecha ?? "").localeCompare(a.asg?.fecha ?? "") ||
      (b.asg?.hora_salida ?? "").localeCompare(a.asg?.hora_salida ?? "") ||
      b.id_reserva - a.id_reserva);
  }, [enriched, q, estadoF, rutaF]);

  const cancelar = async (id: number) => {
    setCanceling(id);
    await db.cancelReserva(id);
    toast({ title: B.toastCancelled, variant: "info" });
    setCanceling(null);
    setConfirming(null);
    await load();
  };

  const exportCSV = () => {
    const rows = [B.csvHeaders];
    filtered.forEach((r) => rows.push([
      String(r.id_reserva), r.usuario?.nombre ?? "", r.usuario?.correo_electronico ?? "",
      `${r.ruta?.codigo ?? ""} ${r.ruta?.nombre ?? ""}`.trim(), r.asg?.fecha ?? "", r.asg?.hora_salida ?? "",
      t.status.reservation[r.estado], r.qr_token
    ]));
    const csv = "﻿" + rows.map((row) => row.map(csvField).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${B.csvFile}-${localISODate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: B.toastCsv, variant: "success" });
  };

  return (
    <AppShell role="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-muted mb-1">{B.kicker}</p>
            <h1 className="font-display text-3xl">{B.title}</h1>
          </div>
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4" />{B.export}</Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input type="search" aria-label={B.searchPlaceholder}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder={B.searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select aria-label={t.common.status} className="h-10 px-3 rounded-lg border border-border bg-surface text-sm"
            value={estadoF} onChange={(e) => setEstadoF(e.target.value as typeof estadoF)}>
            <option value="todas">{B.allStatuses}</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{t.status.reservation[e]}</option>)}
          </select>
          <select aria-label={t.common.route} className="h-10 px-3 rounded-lg border border-border bg-surface text-sm"
            value={rutaF} onChange={(e) => setRutaF(e.target.value)}>
            <option value="">{B.allRoutes}</option>
            {rutas.map((r) => <option key={r.id_ruta} value={r.id_ruta}>{r.codigo} · {r.nombre}</option>)}
          </select>
        </div>

        <p className="text-sm text-muted" aria-live="polite">{B.count(filtered.length)}</p>

        <div className="space-y-2">
          {filtered.slice(0, limit).map((r) => {
            const cancellable = r.estado === "confirmada" || r.estado === "en_espera";
            return (
              <Card key={r.id_reserva}>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <StatusBadge kind="reservation" value={r.estado} />
                        {r.ruta && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: r.ruta.color_hex }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: r.ruta.color_hex }} />
                            {r.ruta.codigo}
                          </span>
                        )}
                        {r.estado === "en_espera" && r.posicion_waitlist != null && (
                          <span className="text-xs text-state-warn">{t.common.waitlistPos(r.posicion_waitlist)}</span>
                        )}
                      </div>
                      <p className="font-medium">{r.usuario?.nombre ?? t.common.unknown}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted mt-1">
                        <span className="flex items-center gap-1 min-w-0"><User className="w-3 h-3 shrink-0" /><span className="truncate">{r.usuario?.correo_electronico}</span></span>
                        {r.asg && <>
                          <span className="flex items-center gap-1 capitalize"><CalendarCheck className="w-3 h-3" />{fmtDate(r.asg.fecha, { weekday: "short", day: "numeric", month: "short" })}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.asg.hora_salida}</span>
                        </>}
                      </div>
                      <p className="text-xs text-muted font-mono mt-1 truncate">{r.qr_token}</p>
                    </div>
                    {cancellable && (confirming === r.id_reserva ? (
                      <Button size="sm" variant="danger" className="shrink-0" loading={canceling === r.id_reserva} onClick={() => cancelar(r.id_reserva)}>
                        {t.common.confirm}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" aria-label={B.cancel} title={B.cancel}
                        className="text-state-error border-state-error/30 hover:bg-state-error/10 shrink-0"
                        onClick={() => setConfirming(r.id_reserva)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card><CardBody className="text-center py-8 text-muted">{B.empty}</CardBody></Card>
          )}
          {filtered.length > limit && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-xs text-muted">{B.showing(limit, filtered.length)}</p>
              <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>{B.showMore}</Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
