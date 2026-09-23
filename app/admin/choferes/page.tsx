"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { pickDriverTrip } from "@/lib/trips";
import { initials, localISODate, routeShortName } from "@/lib/utils";
import type { Asignacion, Ruta, Usuario } from "@/lib/types";
import { Phone, Mail, Route } from "lucide-react";

export default function AdminChoferesPage() {
  const { t } = useI18n();
  const S = t.admin.staff;
  const [choferes, setChoferes] = useState<Usuario[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);

  useEffect(() => {
    Promise.all([db.getUsuarios(), db.getRutas(), db.getAsignaciones()])
      .then(([u, r, a]) => {
        setChoferes(u.filter((x) => x.rol === "chofer"));
        setRutas(r);
        setAsignaciones(a);
      });
  }, []);

  const today = localISODate();

  return (
    <AppShell role="admin">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">{S.kicker}</p>
          <h1 className="font-display text-3xl">{S.title}</h1>
        </div>

        <div className="space-y-3">
          {choferes.map((c) => {
            const mine = asignaciones.filter((a) => a.id_chofer === c.id_usuario && a.fecha === today);
            const { trip } = pickDriverTrip(mine, today);
            const rutaHoy = rutas.find((r) => r.id_ruta === trip?.id_ruta);
            const rutaPref = rutas.find((r) => r.id_ruta === c.id_ruta);
            return (
              <Card key={c.id_usuario}>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-lg shrink-0">
                      {initials(c.nombre)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-display text-lg">{c.nombre}</p>
                        <StatusBadge kind="user" value={c.estado} />
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1 min-w-0"><Mail className="w-3 h-3 shrink-0" /><span className="truncate">{c.correo_electronico}</span></span>
                        {c.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.telefono}</span>}
                        {rutaPref && <span className="flex items-center gap-1"><Route className="w-3 h-3" />{S.preferredRoute(rutaPref.codigo)}</span>}
                      </div>
                      {trip && rutaHoy ? (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <div className={`w-2 h-2 rounded-full ${trip.estado === "en_curso" ? "animate-pulse" : ""}`} style={{ background: rutaHoy.color_hex }} />
                          <span className="text-xs font-medium" style={{ color: rutaHoy.color_hex }}>
                            {S.todayTrip(rutaHoy.codigo, routeShortName(rutaHoy.nombre), trip.hora_salida)}
                          </span>
                          <StatusBadge kind="assignment" value={trip.estado} />
                        </div>
                      ) : (
                        c.estado === "activo" && <p className="mt-2 text-xs text-muted">{S.noTripToday}</p>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
