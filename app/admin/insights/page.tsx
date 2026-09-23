"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import type { Dict } from "@/lib/i18n/es";
import { toast } from "@/components/ui/toaster";
import { addDaysISO, occupancyPct, routeShortName } from "@/lib/utils";
import type { Asignacion, Reserva, Ruta } from "@/lib/types";
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Bus, Users, BarChart2, Lightbulb, CheckCircle2 } from "lucide-react";

/** Findings are data, not text, so they render in whichever language is active. */
type Finding =
  | { tipo: "saturada"; ruta: Ruta; pct: number }
  | { tipo: "subutilizada"; ruta: Ruta; pct: number }
  | { tipo: "espera"; count: number }
  | { tipo: "noshow"; count: number }
  | { tipo: "top"; ruta: Ruta; total: number; pct: number };

/** Rule-based demand analysis over the last and next 7 days (no model involved). */
function analyzeData(rutas: Ruta[], asignaciones: Asignacion[], reservas: Reserva[]): Finding[] {
  const from = addDaysISO(-7);
  const to = addDaysISO(7);
  const trips = asignaciones.filter((a) => a.fecha >= from && a.fecha <= to && a.estado !== "cancelada");
  const inWindow = new Set(trips.map((a) => a.id_asignacion));

  const demanda = rutas
    .map((r) => {
      const asgs = trips.filter((a) => a.id_ruta === r.id_ruta);
      const cap = asgs.reduce((s, a) => s + a.cupos_disponibles, 0);
      const rsv = asgs.reduce((s, a) => s + a.cupos_reservados, 0);
      return { ruta: r, pct: occupancyPct(rsv, cap), total: rsv, trips: asgs.length };
    })
    .filter((d) => d.trips > 0)
    .sort((a, b) => b.pct - a.pct);

  const findings: Finding[] = [];
  demanda.filter((d) => d.pct >= 85).forEach((d) => findings.push({ tipo: "saturada", ruta: d.ruta, pct: d.pct }));
  demanda.filter((d) => d.pct < 40).forEach((d) => findings.push({ tipo: "subutilizada", ruta: d.ruta, pct: d.pct }));
  const espera = reservas.filter((r) => r.estado === "en_espera" && inWindow.has(r.id_asignacion)).length;
  if (espera > 0) findings.push({ tipo: "espera", count: espera });
  const noShows = reservas.filter((r) => r.estado === "no_show" && inWindow.has(r.id_asignacion)).length;
  if (noShows > 0) findings.push({ tipo: "noshow", count: noShows });
  const top = [...demanda].sort((a, b) => b.total - a.total)[0];
  if (top) findings.push({ tipo: "top", ruta: top.ruta, total: top.total, pct: top.pct });
  return findings;
}

function describe(f: Finding, I: Dict["admin"]["insights"]) {
  switch (f.tipo) {
    case "saturada": return { title: I.saturatedTitle(f.ruta.codigo), desc: I.saturatedDesc(f.pct), value: `${f.pct}%` };
    case "subutilizada": return { title: I.underusedTitle(f.ruta.codigo), desc: I.underusedDesc(f.pct), value: `${f.pct}%` };
    case "espera": return { title: I.waitlistTitle(f.count), desc: I.waitlistDesc, value: String(f.count) };
    case "noshow": return { title: I.noShowTitle, desc: I.noShowDesc(f.count), value: String(f.count) };
    case "top": return { title: I.topTitle(f.ruta.codigo), desc: I.topDesc(f.total, f.pct), value: I.topValue(f.total) };
  }
}

const META: Record<Finding["tipo"], { icon: typeof TrendingUp; color: string; bg: string }> = {
  saturada: { icon: TrendingUp, color: "text-state-error", bg: "bg-state-error/10 border-state-error/20" },
  subutilizada: { icon: TrendingDown, color: "text-state-warn", bg: "bg-state-warn/10 border-state-warn/20" },
  espera: { icon: AlertCircle, color: "text-state-warn", bg: "bg-state-warn/10 border-state-warn/20" },
  noshow: { icon: Lightbulb, color: "text-primary", bg: "bg-usfq-red-tint/40 border-primary/20" },
  top: { icon: Lightbulb, color: "text-primary", bg: "bg-usfq-red-tint/40 border-primary/20" }
};

export default function AdminInsightsPage() {
  const { t, fmtTime } = useI18n();
  const I = t.admin.insights;
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const run = async (notify: boolean) => {
    setLoading(true);
    const [r, a, rv] = await Promise.all([db.getRutas(), db.getAsignaciones(), db.getReservas()]);
    setRutas(r); setAsignaciones(a); setReservas(rv);
    const result = analyzeData(r, a, rv);
    setFindings(result);
    setLastRun(new Date());
    setLoading(false);
    if (notify) toast({ title: I.toastDone, description: I.toastCount(result.length), variant: "success" });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(false); }, []);

  const from = addDaysISO(-7);
  const to = addDaysISO(7);
  const trips = asignaciones.filter((a) => a.fecha >= from && a.fecha <= to && a.estado !== "cancelada");
  const capTotal = trips.reduce((s, a) => s + a.cupos_disponibles, 0);
  const rsvTotal = trips.reduce((s, a) => s + a.cupos_reservados, 0);

  return (
    <AppShell role="admin">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="max-w-2xl">
            <p className="text-sm text-muted mb-1">{I.kicker}</p>
            <h1 className="font-display text-3xl sm:text-4xl">{I.title}</h1>
            <p className="text-sm text-muted mt-2">{I.method}</p>
            {lastRun && <p className="text-xs text-muted mt-1">{I.lastRun(fmtTime(lastRun))}</p>}
          </div>
          <Button onClick={() => run(true)} loading={loading}>
            <RefreshCw className="w-4 h-4" />{I.run}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: I.kpiOccupancy, value: `${occupancyPct(rsvTotal, capTotal)}%`, icon: BarChart2, color: "text-primary" },
            { label: I.kpiBookings, value: reservas.length, icon: Users, color: "text-state-ok" },
            { label: I.kpiConfirmed, value: reservas.filter((r) => r.estado === "confirmada").length, icon: CheckCircle2, color: "text-panchobus-orange" },
            { label: I.kpiTrips, value: reservas.filter((r) => r.estado === "usada").length, icon: Bus, color: "text-muted" }
          ].map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.label}>
                <CardBody className="text-center py-4">
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${m.color}`} />
                  <p className={`font-display text-2xl ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-muted mt-1">{m.label}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <div>
          <h2 className="font-display text-xl mb-4">{I.findings(findings.length)}</h2>
          {findings.length === 0 && !loading && (
            <Card><CardBody className="text-center py-10 text-muted">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>{I.empty}</p>
            </CardBody></Card>
          )}
          <div className="space-y-3">
            {findings.map((f, i) => {
              const meta = META[f.tipo];
              const Icon = meta.icon;
              const text = describe(f, I);
              const ruta = "ruta" in f ? f.ruta : null;
              return (
                <div key={i} className={`rounded-2xl border p-4 ${meta.bg}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/60 dark:bg-black/20 flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`font-medium ${meta.color}`}>{text.title}</p>
                        <span className={`text-sm font-bold shrink-0 ${meta.color}`}>{text.value}</span>
                      </div>
                      <p className="text-sm text-muted">{text.desc}</p>
                      {ruta && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: ruta.color_hex }} />
                          <span className="text-xs text-muted">{ruta.codigo} · {ruta.nombre}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl mb-4">{I.demandByRoute}</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="text-left px-4 py-3 font-medium text-muted">{I.colRoute}</th>
                    <th scope="col" className="text-right px-4 py-3 font-medium text-muted">{I.colBooked}</th>
                    <th scope="col" className="text-right px-4 py-3 font-medium text-muted">{I.colCapacity}</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted w-40">{I.colOccupancy}</th>
                  </tr>
                </thead>
                <tbody>
                  {rutas.map((r) => {
                    const asgs = trips.filter((a) => a.id_ruta === r.id_ruta);
                    const cap = asgs.reduce((s, a) => s + a.cupos_disponibles, 0);
                    const rsv = asgs.reduce((s, a) => s + a.cupos_reservados, 0);
                    const pct = occupancyPct(rsv, cap);
                    const barColor = pct >= 85 ? "#C13030" : pct >= 60 ? "#E89F1F" : "#2A7D4F";
                    return (
                      <tr key={r.id_ruta} className="border-b border-border last:border-0">
                        <th scope="row" className="px-4 py-3 text-left font-normal">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: r.color_hex }} />
                            <span className="font-medium">{r.codigo}</span>
                            <span className="text-muted truncate max-w-[140px] hidden sm:block">{routeShortName(r.nombre)}</span>
                          </div>
                        </th>
                        <td className="px-4 py-3 text-right font-mono">{rsv}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted">{cap}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                            </div>
                            <span className="text-xs font-medium w-9 text-right" style={{ color: barColor }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
