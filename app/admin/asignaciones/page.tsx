"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import type { Asignacion, Bus, Ruta, Usuario } from "@/lib/types";
import { ChevronLeft, ChevronRight, Clock, Bus as BusIcon, User } from "lucide-react";

const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

export default function AdminAsignacionesPage() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    Promise.all([db.getAsignaciones(), db.getRutas(), db.getBuses(), db.getUsuarios()])
      .then(([a,r,b,u]) => { setAsignaciones(a); setRutas(r); setBuses(b); setUsuarios(u); });
  }, []);

  const getWeek = (offset: number) => {
    const monday = new Date();
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day) + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(d.getDate() + i);
      return d;
    });
  };
  const days = getWeek(weekOffset);
  const today = new Date().toISOString().slice(0, 10);

  const asgByDay = (date: Date) => {
    const key = date.toISOString().slice(0,10);
    return asignaciones.filter((a) => a.fecha === key).sort((a,b) => a.hora_salida.localeCompare(b.hora_salida));
  };

  return (
    <AppShell role="admin">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">Planificación</p>
          <h1 className="font-display text-3xl">Asignaciones</h1>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset((o) => o-1)} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium">
            {days[0].getDate()} {MESES[days[0].getMonth()]} – {days[6].getDate()} {MESES[days[6].getMonth()]} {days[0].getFullYear()}
          </span>
          <button onClick={() => setWeekOffset((o) => o+1)} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-primary hover:underline">Hoy</button>
          )}
        </div>

        <div className="space-y-4">
          {days.map((day) => {
            const isToday = day.toISOString().slice(0,10) === today;
            const salidas = asgByDay(day);
            return (
              <div key={day.toISOString()}>
                <div className={`flex items-center gap-2 mb-2 ${isToday ? "text-primary" : "text-muted"}`}>
                  <span className="text-sm font-medium">
                    {day.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "short" })}
                  </span>
                  {isToday && <Badge variant="default" className="text-xs bg-primary text-white">Hoy</Badge>}
                  <span className="text-xs">({salidas.length} asignaciones)</span>
                </div>
                {salidas.length === 0 ? (
                  <p className="text-xs text-muted pl-2">Sin asignaciones.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {salidas.map((a) => {
                      const ruta = rutas.find((r) => r.id_ruta === a.id_ruta);
                      const chofer = usuarios.find((u) => u.id_usuario === a.id_chofer);
                      const bus = buses.find((b) => b.id_bus === a.id_bus);
                      const libre = a.cupos_disponibles - a.cupos_reservados;
                      const pct = Math.round((a.cupos_reservados/a.cupos_disponibles)*100);
                      return (
                        <Card key={a.id_asignacion} className="overflow-hidden">
                          {ruta && <div className="h-1" style={{ background: ruta.color_hex }} />}
                          <CardBody className="py-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="info" className="font-mono">{ruta?.codigo}</Badge>
                              <Badge variant={a.estado==="en_curso"?"success":a.estado==="completada"?"default":"info"}>
                                {a.estado}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm leading-tight">{ruta?.nombre?.split("—")[1]?.trim()??ruta?.nombre}</p>
                            <div className="space-y-1 text-xs text-muted">
                              <div className="flex items-center gap-1"><Clock className="w-3 h-3"/>{a.hora_salida} → {a.hora_regreso}</div>
                              {chofer && <div className="flex items-center gap-1"><User className="w-3 h-3"/>{chofer.nombre}</div>}
                              {bus && <div className="flex items-center gap-1"><BusIcon className="w-3 h-3"/>{bus.placa} · {bus.modelo}</div>}
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-muted">{libre} libres</span>
                                <span className={pct>=90?"text-state-error":pct>=70?"text-state-warn":"text-state-ok"}>{pct}%</span>
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
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
