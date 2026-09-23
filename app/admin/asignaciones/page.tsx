"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { localISODate, occupancyPct, routeShortName } from "@/lib/utils";
import type { Asignacion, Bus, Ruta, Usuario } from "@/lib/types";
import { ChevronLeft, ChevronRight, Clock, Bus as BusIcon, User } from "lucide-react";

function getWeek(offset: number) {
  const monday = new Date();
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function AdminAsignacionesPage() {
  const { t, fmtDate } = useI18n();
  const A = t.admin.assignments;
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    Promise.all([db.getAsignaciones(), db.getRutas(), db.getBuses(), db.getUsuarios()])
      .then(([a, r, b, u]) => { setAsignaciones(a); setRutas(r); setBuses(b); setUsuarios(u); });
  }, []);

  const days = getWeek(weekOffset);
  const today = localISODate();

  const asgByDay = (date: Date) => {
    const key = localISODate(date);
    return asignaciones.filter((a) => a.fecha === key).sort((a, b) => a.hora_salida.localeCompare(b.hora_salida) || a.id_ruta - b.id_ruta);
  };

  return (
    <AppShell role="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">{A.kicker}</p>
          <h1 className="font-display text-3xl">{A.title}</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setWeekOffset((o) => o - 1)} aria-label={A.prevWeek} title={A.prevWeek} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium" aria-live="polite">
            {fmtDate(days[0], { day: "numeric", month: "short" })} – {fmtDate(days[6], { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <button onClick={() => setWeekOffset((o) => o + 1)} aria-label={A.nextWeek} title={A.nextWeek} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-primary hover:underline">{A.today}</button>
          )}
        </div>

        <div className="space-y-6">
          {days.map((day) => {
            const key = localISODate(day);
            const isToday = key === today;
            const salidas = asgByDay(day);
            return (
              <section key={key} aria-label={fmtDate(day)}>
                <div className={`flex items-center gap-2 mb-2 ${isToday ? "text-primary" : "text-muted"}`}>
                  <span className="text-sm font-medium capitalize">{fmtDate(day, { weekday: "long", day: "numeric", month: "short" })}</span>
                  {isToday && <Badge variant="primary" className="text-xs">{A.today}</Badge>}
                  <span className="text-xs">({A.count(salidas.length)})</span>
                </div>
                {salidas.length === 0 ? (
                  <p className="text-xs text-muted pl-2">{A.none}</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {salidas.map((a) => {
                      const ruta = rutas.find((r) => r.id_ruta === a.id_ruta);
                      const chofer = usuarios.find((u) => u.id_usuario === a.id_chofer);
                      const bus = buses.find((b) => b.id_bus === a.id_bus);
                      const libre = Math.max(0, a.cupos_disponibles - a.cupos_reservados);
                      const pct = occupancyPct(a.cupos_reservados, a.cupos_disponibles);
                      return (
                        <Card key={a.id_asignacion} className={`overflow-hidden ${a.estado === "cancelada" ? "opacity-60" : ""}`}>
                          {ruta && <div className="h-1" style={{ background: ruta.color_hex }} />}
                          <CardBody className="py-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="info" className="font-mono">{ruta?.codigo}</Badge>
                              <StatusBadge kind="assignment" value={a.estado} />
                            </div>
                            <p className="font-medium text-sm leading-tight">{routeShortName(ruta?.nombre)}</p>
                            <div className="space-y-1 text-xs text-muted">
                              <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.hora_salida} → {a.hora_regreso}</div>
                              <div className="flex items-center gap-1"><User className="w-3 h-3" />{chofer?.nombre ?? t.common.unassigned}</div>
                              {bus && <div className="flex items-center gap-1"><BusIcon className="w-3 h-3" /><span className="font-mono">{bus.placa}</span> · {bus.modelo}</div>}
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-muted">{A.free(libre)}</span>
                                <span className={pct >= 90 ? "text-state-error" : pct >= 70 ? "text-state-warn" : "text-state-ok"}>{pct}%</span>
                              </div>
                              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
