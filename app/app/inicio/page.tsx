"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import type { Asignacion, Reserva, Ruta } from "@/lib/types";
import {
  CalendarCheck, QrCode, Map, Clock, MapPin, ArrowRight, Bus, CheckCircle2, Hourglass
} from "lucide-react";

export default function InicioPage() {
  const { user } = useSession();
  const [misReservas, setMisReservas] = useState<Reserva[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [miRuta, setMiRuta] = useState<Ruta | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      db.getReservasByUsuario(user.id_usuario),
      db.getAsignaciones(),
      user.id_ruta ? db.getRuta(user.id_ruta) : Promise.resolve(null)
    ]).then(([reservas, asigs, ruta]) => {
      setMisReservas(reservas);
      setAsignaciones(asigs);
      setMiRuta(ruta);
    });
  }, [user]);

  const proximaReserva = misReservas
    .filter((r) => r.estado === "confirmada" || r.estado === "en_espera")
    .map((r) => ({ reserva: r, asignacion: asignaciones.find((a) => a.id_asignacion === r.id_asignacion) }))
    .filter((x) => x.asignacion)
    .sort((a, b) => a.asignacion!.fecha.localeCompare(b.asignacion!.fecha))[0];

  const today = new Date().toISOString().slice(0, 10);
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "¡Buenos días" : hora < 18 ? "¡Buenas tardes" : "¡Buenas noches";
  const nombre = user?.nombre.split(" ")[0] ?? "estudiante";

  const quickLinks = [
    { href: "/app/reservar", icon: CalendarCheck, label: "Reservar cupo", color: "bg-usfq-red text-white" },
    { href: "/app/mi-qr", icon: QrCode, label: "Mi QR", color: "bg-[#1A1718] text-white dark:bg-white dark:text-[#1A1718]" },
    { href: "/app/rutas", icon: Map, label: "Ver rutas", color: "bg-surface-2 text-foreground" },
    { href: "/app/mis-reservas", icon: Clock, label: "Mis reservas", color: "bg-surface-2 text-foreground" }
  ];

  return (
    <AppShell role="estudiante">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <p className="text-muted text-sm mb-1">Panel del estudiante</p>
          <h1 className="font-display text-3xl sm:text-4xl">{saludo}, {nombre}!</h1>
        </div>

        {proximaReserva ? (
          <Card className="border-l-4 overflow-hidden" style={{ borderLeftColor: "#E11B22" }}>
            <CardBody>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={proximaReserva.reserva.estado === "en_espera" ? "warning" : "success"}>
                      {proximaReserva.reserva.estado === "en_espera" ? (
                        <><Hourglass className="w-3 h-3" /> En espera #{proximaReserva.reserva.posicion_waitlist}</>
                      ) : (
                        <><CheckCircle2 className="w-3 h-3" /> Confirmada</>
                      )}
                    </Badge>
                    <span className="text-xs text-muted">Próxima reserva</span>
                  </div>
                  <p className="font-display text-xl leading-tight mb-1">Ruta {proximaReserva.asignacion?.id_ruta}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="w-4 h-4" />
                      {new Date(proximaReserva.asignacion!.fecha + "T12:00:00").toLocaleDateString("es-EC", {
                        weekday: "long", day: "numeric", month: "long"
                      })}
                    </span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{proximaReserva.asignacion!.hora_salida}</span>
                  </div>
                </div>
                <Link href="/app/mi-qr">
                  <Button size="sm"><QrCode className="w-4 h-4" />Ver QR</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="border border-dashed">
            <CardBody className="text-center py-6">
              <Bus className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="font-medium mb-1">Sin reservas próximas</p>
              <p className="text-sm text-muted mb-3">Reserva tu cupo para viajar sin esperas.</p>
              <Link href="/app/reservar"><Button>Reservar ahora <ArrowRight className="w-4 h-4" /></Button></Link>
            </CardBody>
          </Card>
        )}

        <div>
          <h2 className="font-display text-lg mb-3">Accesos rápidos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map((q) => {
              const Icon = q.icon;
              return (
                <Link key={q.href} href={q.href}>
                  <div className={`${q.color} rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:opacity-90 transition-opacity`}>
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium leading-tight">{q.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {miRuta && (
          <div>
            <h2 className="font-display text-lg mb-3">Mi ruta</h2>
            <Link href={`/app/rutas/${miRuta.id_ruta}`}>
              <Card className="hover:shadow-card-lg transition-shadow overflow-hidden group">
                <div className="h-1.5" style={{ background: miRuta.color_hex }} />
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="info">{miRuta.codigo}</Badge>
                        <Badge variant={miRuta.estado === "activa" ? "success" : "warning"}>{miRuta.estado}</Badge>
                      </div>
                      <p className="font-display text-xl">{miRuta.nombre}</p>
                      <p className="text-sm text-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />{miRuta.numero_paradas} paradas · {miRuta.dias_operacion.join(", ")}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                  </div>
                </CardBody>
              </Card>
            </Link>
          </div>
        )}

        <div>
          <h2 className="font-display text-lg mb-3">Resumen</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: misReservas.filter((r) => r.estado === "usada").length, label: "Viajes realizados" },
              { value: misReservas.filter((r) => r.estado === "confirmada" && asignaciones.find((a) => a.id_asignacion === r.id_asignacion && a.fecha >= today)).length, label: "Reservas activas" },
              { value: misReservas.filter((r) => r.estado === "cancelada").length, label: "Canceladas" }
            ].map((s) => (
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
