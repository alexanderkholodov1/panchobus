"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import type { Asignacion, Reserva, Ruta, Usuario } from "@/lib/types";
import {
  Users, Bus, CalendarCheck, TrendingUp, AlertCircle,
  CheckCircle2, Clock, ArrowRight, Sparkles
} from "lucide-react";

export default function AdminDashboardPage() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  useEffect(() => {
    Promise.all([
      db.getRutas(), db.getUsuarios(), db.getAsignaciones(), db.getReservas()
    ]).then(([r, u, a, rv]) => {
      setRutas(r); setUsuarios(u); setAsignaciones(a); setReservas(rv);
    });
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const asgHoy = asignaciones.filter((a) => a.fecha === today);
  const reservasHoy = reservas.filter((r) => {
    const a = asignaciones.find((x) => x.id_asignacion === r.id_asignacion);
    return a?.fecha === today;
  });
  const pendientes = usuarios.filter((u) => u.estado === "pendiente" && u.rol !== "estudiante");
  const ocupPromedio = asgHoy.length
    ? Math.round(asgHoy.reduce((s, a) => s + (a.cupos_reservados / a.cupos_disponibles) * 100, 0) / asgHoy.length)
    : 0;

  const kpis = [
    { label: "Reservas hoy", value: reservasHoy.length, icon: CalendarCheck, color: "text-primary", href: "/admin/reservas" },
    { label: "Ocupación prom.", value: `${ocupPromedio}%`, icon: TrendingUp, color: "text-state-ok", href: "/admin/asignaciones" },
    { label: "Rutas activas", value: rutas.filter((r) => r.estado === "activa").length, icon: Bus, color: "text-panchobus-orange", href: "/admin/rutas" },
    { label: "Usuarios pendientes", value: pendientes.length, icon: Users, color: pendientes.length > 0 ? "text-state-warn" : "text-muted", href: "/admin/usuarios" }
  ];

  const rutasMasDemandadas = rutas
    .map((r) => ({
      ...r,
      total: asignaciones.filter((a) => a.id_ruta === r.id_ruta).reduce((s, a) => s + a.cupos_reservados, 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <AppShell role="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <p className="text-sm text-muted mb-1">Panel de administración</p>
          <h1 className="font-display text-3xl sm:text-4xl">Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            {new Date().toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Link key={k.label} href={k.href}>
                <Card className="hover:shadow-card-lg transition-shadow cursor-pointer group">
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Rutas hoy */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl">Salidas de hoy</h2>
              <Link href="/admin/asignaciones" className="text-sm text-primary hover:underline">Ver todo</Link>
            </div>
            <div className="space-y-2">
              {asgHoy.length === 0 && (
                <Card><CardBody className="text-center text-muted py-6">Sin asignaciones para hoy.</CardBody></Card>
              )}
              {asgHoy.map((a) => {
                const ruta = rutas.find((r) => r.id_ruta === a.id_ruta);
                const libre = a.cupos_disponibles - a.cupos_reservados;
                const pct = Math.round((a.cupos_reservados / a.cupos_disponibles) * 100);
                return (
                  <Card key={a.id_asignacion} className="overflow-hidden">
                    {ruta && <div className="h-1" style={{ background: ruta.color_hex }} />}
                    <CardBody className="py-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-sm">{ruta?.codigo} · {ruta?.nombre?.split("—")[1]?.trim() ?? ruta?.nombre}</p>
                          <p className="text-xs text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />{a.hora_salida} · {libre} cupos libres
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <div className="w-16">
                            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-muted text-right mt-0.5">{pct}%</p>
                          </div>
                          <Badge variant={a.estado === "en_curso" ? "success" : a.estado === "completada" ? "default" : "info"}>
                            {a.estado}
                          </Badge>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Rutas por demanda */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl">Top rutas</h2>
              <Link href="/admin/rutas" className="text-sm text-primary hover:underline">Gestionar</Link>
            </div>
            <div className="space-y-2">
              {rutasMasDemandadas.map((r, i) => (
                <Card key={r.id_ruta}>
                  <CardBody className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted w-4">#{i + 1}</span>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: r.color_hex }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.codigo} · {r.nombre?.split("—")[1]?.trim() ?? r.nombre}</p>
                      </div>
                      <p className="text-sm font-bold text-primary">{r.total}</p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Alertas */}
        {pendientes.length > 0 && (
          <Card className="border-state-warn/40 bg-state-warn/5">
            <CardBody>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-state-warn shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{pendientes.length} usuario{pendientes.length > 1 ? "s" : ""} pendiente{pendientes.length > 1 ? "s" : ""} de aprobación</p>
                  <p className="text-xs text-muted">{pendientes.map((u) => u.nombre).join(", ")}</p>
                </div>
                <Link href="/admin/usuarios" className="text-sm text-state-warn font-medium hover:underline whitespace-nowrap">
                  Revisar <ArrowRight className="w-3 h-3 inline" />
                </Link>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Insights CTA */}
        <Card className="bg-gradient-to-br from-[#1A1718] to-[#2D2527] text-white overflow-hidden">
          <CardBody>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display text-lg">Insights con IA</p>
                  <p className="text-sm text-white/70">Analiza demanda y detecta rutas saturadas automáticamente.</p>
                </div>
              </div>
              <Link href="/admin/insights">
                <button className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium whitespace-nowrap">
                  Ver análisis <ArrowRight className="w-4 h-4 inline" />
                </button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
