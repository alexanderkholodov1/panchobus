"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import type { Asignacion, Ruta } from "@/lib/types";
import { ChevronLeft, ChevronRight, Clock, Bus } from "lucide-react";
import Link from "next/link";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function getWeekDays(base: Date) {
  const monday = new Date(base);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function HorariosPage() {
  const { user } = useSession();
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [weekBase, setWeekBase] = useState(new Date());
  const [selectedRuta, setSelectedRuta] = useState<number | "todas">("todas");

  useEffect(() => {
    Promise.all([db.getAsignaciones(), db.getRutas()]).then(([a, r]) => {
      setAsignaciones(a);
      setRutas(r.filter((x) => x.estado === "activa"));
    });
  }, []);

  const days = getWeekDays(weekBase);
  const prev = () => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); };
  const next = () => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); };
  const today = new Date().toISOString().slice(0, 10);

  const asgByDay = (date: Date) => {
    const key = date.toISOString().slice(0, 10);
    return asignaciones
      .filter((a) => a.fecha === key && (selectedRuta === "todas" || a.id_ruta === selectedRuta))
      .sort((a, b) => a.hora_salida.localeCompare(b.hora_salida));
  };

  return (
    <AppShell role="estudiante">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">Planificación</p>
          <h1 className="font-display text-3xl">Horarios</h1>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Week nav */}
          <div className="flex items-center gap-2">
            <button onClick={prev} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium min-w-[160px] text-center">
              {DIAS[days[0].getDay()]} {days[0].getDate()} {MESES[days[0].getMonth()]} –{" "}
              {DIAS[days[6].getDay()]} {days[6].getDate()} {MESES[days[6].getMonth()]}
            </span>
            <button onClick={next} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Ruta filter */}
          <select
            className="h-9 px-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={selectedRuta === "todas" ? "" : selectedRuta}
            onChange={(e) => setSelectedRuta(e.target.value ? Number(e.target.value) : "todas")}
          >
            <option value="">Todas las rutas</option>
            {rutas.map((r) => (
              <option key={r.id_ruta} value={r.id_ruta}>{r.codigo} · {r.nombre}</option>
            ))}
          </select>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
          {days.map((day, i) => {
            const isToday = day.toISOString().slice(0, 10) === today;
            const salidas = asgByDay(day);
            return (
              <div key={i} className={`bg-surface p-2 min-h-[120px] ${isToday ? "bg-usfq-red-tint/20 dark:bg-usfq-red-tint/5" : ""}`}>
                {/* Day header */}
                <div className={`text-center mb-2 pb-2 border-b border-border`}>
                  <p className="text-xs text-muted">{DIAS[day.getDay()]}</p>
                  <p className={`text-lg font-display leading-tight ${isToday ? "text-primary font-bold" : ""}`}>
                    {day.getDate()}
                  </p>
                </div>
                {/* Asignaciones */}
                <div className="space-y-1">
                  {salidas.map((a) => {
                    const ruta = rutas.find((r) => r.id_ruta === a.id_ruta);
                    const libre = a.cupos_disponibles - a.cupos_reservados;
                    return (
                      <Link key={a.id_asignacion} href={`/app/reservar?asignacion=${a.id_asignacion}`}>
                        <div
                          className="rounded p-1.5 text-white cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ background: ruta?.color_hex ?? "#E11B22" }}
                          title={`${ruta?.nombre ?? "?"} · ${a.hora_salida} · ${libre} cupos`}
                        >
                          <p className="text-xs font-bold leading-tight">{ruta?.codigo}</p>
                          <p className="text-xs opacity-90 leading-tight">{a.hora_salida}</p>
                          {libre <= 0 && <p className="text-xs opacity-80 leading-tight">Lleno</p>}
                        </div>
                      </Link>
                    );
                  })}
                  {salidas.length === 0 && (
                    <p className="text-xs text-muted text-center py-2">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3">
          {rutas.map((r) => (
            <div key={r.id_ruta} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded" style={{ background: r.color_hex }} />
              <span className="text-muted">{r.codigo} · {r.nombre.split(" — ")[1] ?? r.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
