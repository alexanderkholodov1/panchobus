"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { isBookable } from "@/lib/trips";
import { localHHMM, localISODate, routeShortName } from "@/lib/utils";
import type { Asignacion, Ruta } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

function getWeekDays(offsetWeeks: number) {
  const monday = new Date();
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day) + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function HorariosPage() {
  const { t, fmtDate } = useI18n();
  const S = t.student.schedule;
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedRuta, setSelectedRuta] = useState<number | "todas">("todas");

  useEffect(() => {
    Promise.all([db.getAsignaciones(), db.getRutas()]).then(([a, r]) => {
      setAsignaciones(a.filter((x) => x.estado !== "cancelada"));
      setRutas(r.filter((x) => x.estado === "activa"));
    });
  }, []);

  const days = getWeekDays(weekOffset);
  const today = localISODate();
  const now = localHHMM();

  const asgByDay = (date: Date) => {
    const key = localISODate(date);
    return asignaciones
      .filter((a) => a.fecha === key && rutas.some((r) => r.id_ruta === a.id_ruta) && (selectedRuta === "todas" || a.id_ruta === selectedRuta))
      .sort((a, b) => a.hora_salida.localeCompare(b.hora_salida));
  };

  const rangeLabel = `${fmtDate(days[0], { day: "numeric", month: "short" })} – ${fmtDate(days[6], { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <AppShell role="estudiante">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">{S.kicker}</p>
          <h1 className="font-display text-3xl">{S.title}</h1>
          <p className="text-sm text-muted mt-1">{S.hint}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset((o) => o - 1)} aria-label={S.prevWeek} title={S.prevWeek} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium min-w-[170px] text-center" aria-live="polite">{rangeLabel}</span>
            <button onClick={() => setWeekOffset((o) => o + 1)} aria-label={S.nextWeek} title={S.nextWeek} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs text-primary hover:underline">{S.thisWeek}</button>
            )}
          </div>

          <select
            aria-label={t.common.route}
            className="h-9 px-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={selectedRuta === "todas" ? "" : selectedRuta}
            onChange={(e) => setSelectedRuta(e.target.value ? Number(e.target.value) : "todas")}
          >
            <option value="">{S.allRoutes}</option>
            {rutas.map((r) => (
              <option key={r.id_ruta} value={r.id_ruta}>{r.codigo} · {r.nombre}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden min-w-[640px]">
            {days.map((day) => {
              const key = localISODate(day);
              const isToday = key === today;
              const salidas = asgByDay(day);
              return (
                <div key={key} className={`p-2 min-h-[140px] ${isToday ? "bg-usfq-red-tint/40 dark:bg-usfq-red/10" : "bg-surface"}`}>
                  <div className="text-center mb-2 pb-2 border-b border-border">
                    <p className="text-xs text-muted capitalize">{fmtDate(day, { weekday: "short" })}</p>
                    <p className={`text-lg font-display leading-tight ${isToday ? "text-primary font-bold" : ""}`}>{day.getDate()}</p>
                  </div>
                  <div className="space-y-1">
                    {salidas.map((a) => {
                      const ruta = rutas.find((r) => r.id_ruta === a.id_ruta);
                      const libre = a.cupos_disponibles - a.cupos_reservados;
                      const bookable = isBookable(a, today, now);
                      const content = (
                        <div
                          className={`rounded p-1.5 text-white transition-opacity ${bookable ? "hover:opacity-90 cursor-pointer" : "opacity-45"}`}
                          style={{ background: ruta?.color_hex ?? "#E11B22" }}
                          title={S.tooltip(ruta?.nombre ?? "", a.hora_salida, Math.max(0, libre))}
                        >
                          <p className="text-xs font-bold leading-tight">{ruta?.codigo}</p>
                          <p className="text-xs opacity-90 leading-tight">{a.hora_salida}</p>
                          {libre <= 0 && <p className="text-[10px] opacity-90 leading-tight">{S.full}</p>}
                        </div>
                      );
                      return bookable ? (
                        <Link key={a.id_asignacion} href={`/app/reservar?asignacion=${a.id_asignacion}`} className="block">{content}</Link>
                      ) : (
                        <div key={a.id_asignacion}>{content}</div>
                      );
                    })}
                    {salidas.length === 0 && <p className="text-xs text-muted text-center py-2">—</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted mb-2">{S.legend}</p>
          <div className="flex flex-wrap gap-3">
            {rutas.map((r) => (
              <div key={r.id_ruta} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded" style={{ background: r.color_hex }} />
                <span className="text-muted">{r.codigo} · {routeShortName(r.nombre)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
