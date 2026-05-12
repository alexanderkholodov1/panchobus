"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { toast } from "@/components/ui/toaster";
import type { Asignacion, Reserva, Ruta } from "@/lib/types";
import {
  Sparkles, TrendingUp, TrendingDown, AlertCircle,
  RefreshCw, Bus, Users, BarChart2
} from "lucide-react";

interface Insight {
  tipo: "saturada" | "subutilizada" | "recomendacion" | "alerta";
  titulo: string;
  desc: string;
  ruta?: Ruta;
  valor?: string;
}

function analyzeData(rutas: Ruta[], asignaciones: Asignacion[], reservas: Reserva[]): Insight[] {
  const insights: Insight[] = [];

  const demanda = rutas.map((r) => {
    const asgs = asignaciones.filter((a) => a.id_ruta === r.id_ruta);
    const totalCapacidad = asgs.reduce((s, a) => s + a.cupos_disponibles, 0);
    const totalReservados = asgs.reduce((s, a) => s + a.cupos_reservados, 0);
    const pct = totalCapacidad > 0 ? (totalReservados / totalCapacidad) * 100 : 0;
    return { ruta: r, pct, totalReservados, totalCapacidad, asgs };
  }).sort((a, b) => b.pct - a.pct);

  demanda.filter((d) => d.pct >= 85).forEach((d) => {
    insights.push({
      tipo: "saturada",
      titulo: `Ruta ${d.ruta.codigo} saturada`,
      desc: `Ocupación promedio del ${Math.round(d.pct)}%. Se recomienda aumentar frecuencia o agregar bus en horario pico.`,
      ruta: d.ruta,
      valor: `${Math.round(d.pct)}%`
    });
  });

  demanda.filter((d) => d.pct < 40 && d.asgs.length > 0).forEach((d) => {
    insights.push({
      tipo: "subutilizada",
      titulo: `Ruta ${d.ruta.codigo} subutilizada`,
      desc: `Ocupación promedio del ${Math.round(d.pct)}%. Considera reducir frecuencia o combinar con ruta cercana.`,
      ruta: d.ruta,
      valor: `${Math.round(d.pct)}%`
    });
  });

  const waitlists = reservas.filter((r) => r.estado === "en_espera");
  if (waitlists.length > 0) {
    insights.push({
      tipo: "alerta",
      titulo: `${waitlists.length} pasajero${waitlists.length > 1 ? "s" : ""} en lista de espera`,
      desc: "Hay estudiantes esperando cupo. Considera habilitar buses adicionales para las rutas afectadas.",
      valor: `${waitlists.length}`
    });
  }

  const noShows = reservas.filter((r) => r.estado === "no_show");
  if (noShows.length > 0) {
    insights.push({
      tipo: "recomendacion",
      titulo: "Patrón de no-shows detectado",
      desc: `${noShows.length} no-shows registrados. Implementar recordatorio automático 1h antes del viaje podría reducirlos.`,
      valor: `${noShows.length}`
    });
  }

  if (demanda.length > 0) {
    const top = demanda[0];
    insights.push({
      tipo: "recomendacion",
      titulo: `Ruta más demandada: ${top.ruta.codigo}`,
      desc: `${top.totalReservados} reservas totales con ${Math.round(top.pct)}% de ocupación. Priorizar mantenimiento del bus asignado.`,
      ruta: top.ruta,
      valor: `${top.totalReservados} reservas`
    });
  }

  return insights;
}

const TIPO_META: Record<string, { icon: typeof Sparkles; color: string; bg: string }> = {
  saturada:     { icon: TrendingUp,   color: "text-state-error",  bg: "bg-state-error/10 border-state-error/20" },
  subutilizada: { icon: TrendingDown, color: "text-state-warn",   bg: "bg-state-warn/10 border-state-warn/20" },
  alerta:       { icon: AlertCircle,  color: "text-state-warn",   bg: "bg-state-warn/10 border-state-warn/20" },
  recomendacion:{ icon: Sparkles,     color: "text-primary",      bg: "bg-usfq-red-tint/30 border-primary/20" }
};

export default function AdminInsightsPage() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const load = async () => {
    const [r, a, rv] = await Promise.all([db.getRutas(), db.getAsignaciones(), db.getReservas()]);
    setRutas(r); setAsignaciones(a); setReservas(rv);
    return { r, a, rv };
  };

  const run = async () => {
    setLoading(true);
    const { r, a, rv } = await load();
    const result = analyzeData(r, a, rv);
    setInsights(result);
    setLastRun(new Date());
    setLoading(false);
    toast({ title: "Análisis completado", description: result.length + " hallazgos generados", variant: "success" });
  };

  useEffect(() => { run(); }, []);

  const totalReservas = reservas.length;
  const confirmadas = reservas.filter((r) => r.estado === "confirmada").length;
  const usadas = reservas.filter((r) => r.estado === "usada").length;
  const ocupGlobal = asignaciones.length
    ? Math.round(asignaciones.reduce((s, a) => s + (a.cupos_reservados / a.cupos_disponibles) * 100, 0) / asignaciones.length)
    : 0;

  return (
    <AppShell role="admin">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-muted mb-1">Inteligencia artificial</p>
            <h1 className="font-display text-3xl sm:text-4xl">Insights IA</h1>
            {lastRun && (
              <p className="text-xs text-muted mt-1">
                Último análisis: {lastRun.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <Button onClick={run} loading={loading}>
            <RefreshCw className="w-4 h-4" />Analizar ahora
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Ocupación global", value: `${ocupGlobal}%`, icon: BarChart2, color: "text-primary" },
            { label: "Total reservas", value: totalReservas, icon: Users, color: "text-state-ok" },
            { label: "Confirmadas", value: confirmadas, icon: Sparkles, color: "text-panchobus-orange" },
            { label: "Viajes realizados", value: usadas, icon: Bus, color: "text-muted" }
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
          <h2 className="font-display text-xl mb-4">Hallazgos ({insights.length})</h2>
          {insights.length === 0 && !loading && (
            <Card><CardBody className="text-center py-10 text-muted">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Haz clic en "Analizar ahora" para generar insights.</p>
            </CardBody></Card>
          )}
          <div className="space-y-3">
            {insights.map((ins, i) => {
              const meta = TIPO_META[ins.tipo];
              const Icon = meta.icon;
              return (
                <div key={i} className={`rounded-2xl border p-4 ${meta.bg}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/50 dark:bg-black/20 flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`font-medium ${meta.color}`}>{ins.titulo}</p>
                        {ins.valor && <span className={`text-sm font-bold shrink-0 ${meta.color}`}>{ins.valor}</span>}
                      </div>
                      <p className="text-sm text-muted">{ins.desc}</p>
                      {ins.ruta && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: ins.ruta.color_hex }} />
                          <span className="text-xs text-muted">{ins.ruta.codigo} · {ins.ruta.nombre}</span>
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
          <h2 className="font-display text-xl mb-4">Demanda por ruta</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted">Ruta</th>
                    <th className="text-right px-4 py-3 font-medium text-muted">Reservas</th>
                    <th className="text-right px-4 py-3 font-medium text-muted">Capacidad</th>
                    <th className="px-4 py-3 font-medium text-muted w-32">Ocupación</th>
                  </tr>
                </thead>
                <tbody>
                  {rutas.map((r) => {
                    const asgs = asignaciones.filter((a) => a.id_ruta === r.id_ruta);
                    const cap = asgs.reduce((s, a) => s + a.cupos_disponibles, 0);
                    const rsv = asgs.reduce((s, a) => s + a.cupos_reservados, 0);
                    const pct = cap > 0 ? Math.round((rsv / cap) * 100) : 0;
                    const barColor = pct >= 85 ? "#C13030" : pct >= 60 ? "#E89F1F" : "#2A7D4F";
                    return (
                      <tr key={r.id_ruta} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: r.color_hex }} />
                            <span className="font-medium">{r.codigo}</span>
                            <span className="text-muted truncate max-w-[120px] hidden sm:block">{r.nombre.split("—")[1]?.trim()??r.nombre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{rsv}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted">{cap}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                            </div>
                            <span className="text-xs font-medium w-8 text-right" style={{ color: barColor }}>{pct}%</span>
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
