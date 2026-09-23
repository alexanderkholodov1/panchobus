"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { useI18n } from "@/lib/i18n";
import { localISODate } from "@/lib/utils";
import type { Asignacion, Mensaje, Reserva, Ruta } from "@/lib/types";
import { CalendarCheck, QrCode, Map, Clock, MapPin, ArrowRight, Bus, CheckCircle2, Hourglass, Megaphone, X } from "lucide-react";

export default function InicioPage() {
  const { user } = useSession();
  const { t, fmtDate, localized } = useI18n();
  const H = t.student.home;
  const [misReservas, setMisReservas] = useState<Reserva[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [avisos, setAvisos] = useState<Mensaje[]>([]);
  const [avisosDescartados, setAvisosDescartados] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      db.getReservasByUsuario(user.id_usuario),
      db.getAsignaciones(),
      db.getRutas(),
      db.getMensajesDeUsuario(user.id_usuario),
    ]).then(([reservas, asigs, rts, mensajes]) => {
      setMisReservas(reservas);
      setAsignaciones(asigs);
      setRutas(rts);
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      // Route notices and platform-wide announcements from the last 24 h.
      setAvisos(mensajes.filter((m) => m.destinatario_id == null && m.remitente_id !== user.id_usuario && m.created_at >= cutoff));
    });
  }, [user]);

  const today = localISODate();
  const findAsg = (id: number) => asignaciones.find((a) => a.id_asignacion === id);
  const proxima = misReservas
    .filter((r) => r.estado === "confirmada" || r.estado === "en_espera")
    .map((r) => ({ reserva: r, asignacion: findAsg(r.id_asignacion) }))
    .filter((x): x is { reserva: Reserva; asignacion: Asignacion } =>
      !!x.asignacion && x.asignacion.fecha >= today && x.asignacion.estado !== "completada" && x.asignacion.estado !== "cancelada")
    .sort((a, b) => a.asignacion.fecha.localeCompare(b.asignacion.fecha) || a.asignacion.hora_salida.localeCompare(b.asignacion.hora_salida))[0];
  const proximaRuta = proxima ? rutas.find((r) => r.id_ruta === proxima.asignacion.id_ruta) : undefined;
  const miRuta = user?.id_ruta ? rutas.find((r) => r.id_ruta === user.id_ruta) : undefined;

  const hora = new Date().getHours();
  const nombre = user?.nombre.split(" ")[0] ?? "";
  const saludo = hora < 12 ? H.greetingMorning(nombre) : hora < 19 ? H.greetingAfternoon(nombre) : H.greetingEvening(nombre);

  const quickLinks = [
    { href: "/app/reservar", icon: CalendarCheck, label: H.qlBook, color: "bg-usfq-red text-white" },
    { href: "/app/mi-qr", icon: QrCode, label: H.qlQr, color: "bg-[#1A1718] text-white dark:bg-white dark:text-[#1A1718]" },
    { href: "/app/rutas", icon: Map, label: H.qlRoutes, color: "bg-surface-2 text-foreground" },
    { href: "/app/mis-reservas", icon: Clock, label: H.qlBookings, color: "bg-surface-2 text-foreground" }
  ];

  const stats = [
    { value: misReservas.filter((r) => r.estado === "usada").length, label: H.tripsTaken },
    { value: misReservas.filter((r) => (r.estado === "confirmada" || r.estado === "en_espera") && (findAsg(r.id_asignacion)?.fecha ?? "") >= today).length, label: H.activeBookings },
    { value: misReservas.filter((r) => r.estado === "cancelada").length, label: H.cancelled }
  ];

  return (
    <AppShell role="estudiante">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <p className="text-muted text-sm mb-1">{H.kicker}</p>
          <h1 className="font-display text-3xl sm:text-4xl">{saludo}</h1>
        </div>

        {avisos.filter((a) => !avisosDescartados.includes(a.id_mensaje)).map((aviso) => (
          <div key={aviso.id_mensaje} role="status" className="flex items-start gap-3 bg-state-warn/10 border border-state-warn/30 text-state-warn px-4 py-3 rounded-xl">
            <Megaphone className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{localized(aviso, "asunto")}</p>
              <p className="text-sm mt-0.5 text-foreground/80">{localized(aviso, "cuerpo")}</p>
            </div>
            <button onClick={() => setAvisosDescartados((prev) => [...prev, aviso.id_mensaje])} aria-label={H.dismiss} className="text-state-warn/60 hover:text-state-warn shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {proxima ? (
          <Card className="border-l-4 overflow-hidden" style={{ borderLeftColor: proximaRuta?.color_hex ?? "#E11B22" }}>
            <CardBody>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {proxima.reserva.estado === "en_espera"
                      ? <Badge variant="warning"><Hourglass className="w-3 h-3" /> {t.common.waitlistPos(proxima.reserva.posicion_waitlist ?? 1)}</Badge>
                      : <Badge variant="success"><CheckCircle2 className="w-3 h-3" /> {H.confirmed}</Badge>}
                    <span className="text-xs text-muted">{H.nextBooking}</span>
                  </div>
                  <p className="font-display text-xl leading-tight mb-1">
                    {proximaRuta ? `${proximaRuta.codigo} · ${proximaRuta.nombre}` : t.common.route}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="w-4 h-4" />
                      <span className="capitalize">{fmtDate(proxima.asignacion.fecha)}</span>
                    </span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{proxima.asignacion.hora_salida}</span>
                  </div>
                </div>
                <Link href="/app/mi-qr"><Button size="sm"><QrCode className="w-4 h-4" />{H.viewQr}</Button></Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="border border-dashed">
            <CardBody className="text-center py-6">
              <Bus className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="font-medium mb-1">{H.noUpcoming}</p>
              <p className="text-sm text-muted mb-3">{H.noUpcomingText}</p>
              <Link href="/app/reservar"><Button>{H.bookNow} <ArrowRight className="w-4 h-4" /></Button></Link>
            </CardBody>
          </Card>
        )}

        <div>
          <h2 className="font-display text-lg mb-3">{H.quickLinks}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map((ql) => {
              const Icon = ql.icon;
              return (
                <Link key={ql.href} href={ql.href} className={`${ql.color} rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:opacity-90 transition-opacity`}>
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium leading-tight">{ql.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {miRuta && (
          <div>
            <h2 className="font-display text-lg mb-3">{H.myRoute}</h2>
            <Link href={`/app/rutas/${miRuta.id_ruta}`} className="block">
              <Card className="hover:shadow-card-lg transition-shadow overflow-hidden group">
                <div className="h-1.5" style={{ background: miRuta.color_hex }} />
                <CardBody>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="info">{miRuta.codigo}</Badge>
                        <StatusBadge kind="route" value={miRuta.estado} />
                      </div>
                      <p className="font-display text-xl">{miRuta.nombre}</p>
                      <p className="text-sm text-muted line-clamp-1 mt-0.5">{localized(miRuta, "descripcion")}</p>
                      <p className="text-sm text-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />{t.common.stops(miRuta.numero_paradas)} · {miRuta.dias_operacion.map((d) => t.days[d as keyof typeof t.days] ?? d).join(" · ")}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </CardBody>
              </Card>
            </Link>
          </div>
        )}

        <div>
          <h2 className="font-display text-lg mb-3">{H.summary}</h2>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardBody className="text-center py-4">
                  <p className="font-display text-3xl text-primary">{s.value}</p>
                  <p className="text-xs text-muted mt-1">{s.label}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
