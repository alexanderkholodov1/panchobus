"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { addDaysISO, localISODate, occupancyPct, routeShortName } from "@/lib/utils";
import type { Asignacion, Ruta, Usuario } from "@/lib/types";
import { Users, Bus, CalendarCheck, TrendingUp, AlertCircle, Clock, ArrowRight, BarChart3 } from "lucide-react";

export default function AdminDashboardPage() {
  const { t, fmtDate } = useI18n();
  const D = t.admin.dashboard;
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);

  useEffect(() => {
    Promise.all([db.getRutas(), db.getUsuarios(), db.getAsignaciones()]).then(([r, u, a]) => {
      setRutas(r); setUsuarios(u); setAsignaciones(a);
    });
  }, []);

  const today = localISODate();
  const asgHoy = asignaciones
    .filter((a) => a.fecha === today && a.estado !== "cancelada")
    .sort((a, b) => a.hora_salida.localeCompare(b.hora_salida));
  const seatsToday = asgHoy.reduce((s, a) => s + a.cupos_reservados, 0);
  const capToday = asgHoy.reduce((s, a) => s + a.cupos_disponibles, 0);
  const pendientes = usuarios.filter((u) => u.estado === "pendiente");

  const kpis = [
    { label: D.kpiSeatsToday, value: seatsToday, icon: CalendarCheck, color: "text-primary", href: "/admin/reservas" },
    { label: D.kpiOccupancy, value: `${occupancyPct(seatsToday, capToday)}%`, icon: TrendingUp, color: "text-state-ok", href: "/admin/asignaciones" },
    { label: D.kpiActiveRoutes, value: rutas.filter((r) => r.estado === "activa").length, icon: Bus, color: "text-panchobus-orange", href: "/admin/rutas" },
    { label: D.kpiPending, value: pendientes.length, icon: Users, color: pendientes.length > 0 ? "text-state-warn" : "text-muted", href: "/admin/usuarios" }
  ];

  // Demand over the current 7-day window (today and the next six days).
  const weekEnd = addDaysISO(6);
  const rutasMasDemandadas = rutas
    .map((r) => {
      const asgs = asignaciones.filter((a) => a.id_ruta === r.id_ruta && a.fecha >= today && a.fecha <= weekEnd && a.estado !== "cancelada");
      const total = asgs.reduce((s, a) => s + a.cupos_reservados, 0);
      const cap = asgs.reduce((s, a) => s + a.cupos_disponibles, 0);
      return { ...r, total, pct: occupancyPct(total, cap) };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <AppShell role="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <p className="text-sm text-muted mb-1">{D.kicker}</p>
          <h1 className="font-display text-3xl sm:text-4xl">{D.title}</h1>
          <p className="text-sm text-muted mt-1 capitalize">
            {fmtDate(today, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Link key={k.label} href={k.href} className="block">
                <Card className="hover:shadow-card-lg transition-shadow cursor-pointer group h-full">
                  <CardBody className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Icon className={`w-5 h-5 ${k.color}`} />
                      <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className={`font-display text-3xl ${k.color}`}>{k.value}</p>
                    <p className="text-xs text-muted">{k.label}</p>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>

        {pendientes.length > 0 && (
          <Card className="border-state-warn/40 bg-state-warn/5">
            <CardBody>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-state-warn shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{D.pendingAlert(pendientes.length)}</p>
                  <p className="text-xs text-muted truncate">{pendientes.map((u) => `${u.nombre} (${t.roles[u.rol]})`).join(", ")}</p>
                </div>
                <Link href="/admin/usuarios" className="text-sm text-state-warn font-medium hover:underline whitespace-nowrap">
                  {D.review} <ArrowRight className="w-3 h-3 inline" />
                </Link>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl">{D.todayDepartures}</h2>
              <Link href="/admin/asignaciones" className="text-sm text-primary hover:underline">{D.viewAll}</Link>
            </div>
            <div className="space-y-2">
              {asgHoy.length === 0 && (
                <Card><CardBody className="text-center text-muted py-6">{D.noToday}</CardBody></Card>
              )}
              {asgHoy.map((a) => {
                const ruta = rutas.find((r) => r.id_ruta === a.id_ruta);
                const libre = a.cupos_disponibles - a.cupos_reservados;
                const pct = occupancyPct(a.cupos_reservados, a.cupos_disponibles);
                return (
                  <Card key={a.id_asignacion} className="overflow-hidden">
                    {ruta && <div className="h-1" style={{ background: ruta.color_hex }} />}
                    <CardBody className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{ruta?.codigo} · {routeShortName(ruta?.nombre)}</p>
                          <p className="text-xs text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />{a.hora_salida} · {t.common.freeSeats(Math.max(0, libre))}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2 shrink-0">
                          <div className="w-16" aria-label={t.common.occupied(pct)}>
                            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-muted text-right mt-0.5">{pct}%</p>
                          </div>
                          <StatusBadge kind="assignment" value={a.estado} />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl">{D.topRoutes}</h2>
              <Link href="/admin/rutas" className="text-sm text-primary hover:underline">{D.manage}</Link>
            </div>
            <div className="space-y-2">
              {rutasMasDemandadas.map((r, i) => (
                <Card key={r.id_ruta}>
                  <CardBody className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted w-5">#{i + 1}</span>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: r.color_hex }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.codigo} · {routeShortName(r.nombre)}</p>
                        <p className="text-xs text-muted">{t.common.occupied(r.pct)}</p>
                      </div>
                      <p className="text-sm font-bold text-primary whitespace-nowrap">{D.booked(r.total)}</p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-[#1A1718] to-[#2D2527] text-white overflow-hidden border-0">
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display text-lg">{D.insightsTitle}</p>
                  <p className="text-sm text-white/70">{D.insightsText}</p>
                </div>
              </div>
              <Link href="/admin/insights" className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium whitespace-nowrap text-center">
                {D.insightsCta} <ArrowRight className="w-4 h-4 inline" />
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
