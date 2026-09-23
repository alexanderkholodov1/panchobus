"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { useI18n } from "@/lib/i18n";
import { pickDriverTrip } from "@/lib/trips";
import { initials, localISODate, occupancyPct } from "@/lib/utils";
import type { Asignacion, Reserva, ReservationStatus, Ruta, Usuario } from "@/lib/types";
import { Users } from "lucide-react";

const ORDER: Record<ReservationStatus, number> = { confirmada: 0, usada: 1, en_espera: 2, no_show: 3, cancelada: 4 };

export default function ChoferPasajerosPage() {
  const { user } = useSession();
  const { t, fmtDate } = useI18n();
  const P = t.driver.passengers;
  const [asignacion, setAsignacion] = useState<Asignacion | null>(null);
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    db.getAsignacionesByChofer(user.id_usuario).then(async (asgs) => {
      const { trip } = pickDriverTrip(asgs, localISODate());
      setAsignacion(trip);
      if (trip) {
        const [r, u, rt] = await Promise.all([
          db.getReservasByAsignacion(trip.id_asignacion),
          db.getUsuarios(),
          db.getRuta(trip.id_ruta),
        ]);
        setReservas(r.filter((x) => x.estado !== "cancelada"));
        setUsuarios(u);
        setRuta(rt);
      }
      setLoaded(true);
    });
  }, [user]);

  const count = (e: ReservationStatus) => reservas.filter((r) => r.estado === e).length;
  const usadas = count("usada");
  const nameOf = (id: string) => usuarios.find((x) => x.id_usuario === id)?.nombre ?? t.common.unknown;
  const sorted = [...reservas].sort((a, b) =>
    ORDER[a.estado] - ORDER[b.estado] ||
    (a.posicion_waitlist ?? 0) - (b.posicion_waitlist ?? 0) ||
    nameOf(a.id_usuario).localeCompare(nameOf(b.id_usuario)));

  return (
    <AppShell role="chofer">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">{P.kicker}</p>
          <h1 className="font-display text-3xl">{P.title}</h1>
          {asignacion && ruta && (
            <p className="text-sm text-muted mt-1 capitalize">
              {P.tripOf(ruta.codigo, fmtDate(asignacion.fecha, { weekday: "short", day: "numeric", month: "short" }), asignacion.hora_salida)}
            </p>
          )}
        </div>

        {loaded && !asignacion ? (
          <div className="text-center py-10 text-muted">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>{P.noTrip}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { v: usadas, l: P.boarded, c: "text-state-ok" },
                { v: count("confirmada"), l: P.waiting, c: "text-primary" },
                { v: count("en_espera"), l: P.waitlist, c: "text-state-warn" },
                { v: count("no_show"), l: P.noShow, c: "text-state-error" },
              ].map((s) => (
                <Card key={s.l}>
                  <CardBody className="text-center py-3">
                    <p className={`font-display text-2xl ${s.c}`}>{s.v}</p>
                    <p className="text-xs text-muted">{s.l}</p>
                  </CardBody>
                </Card>
              ))}
            </div>

            {asignacion && (
              <Card>
                <CardBody className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{P.occupancy}</span>
                    <span className="font-medium">{usadas} / {asignacion.cupos_reservados}</span>
                  </div>
                  <div className="h-3 bg-surface-2 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={asignacion.cupos_reservados} aria-valuenow={usadas}>
                    <div className="h-full rounded-full bg-state-ok transition-all" style={{ width: `${occupancyPct(usadas, asignacion.cupos_reservados)}%` }} />
                  </div>
                </CardBody>
              </Card>
            )}

            <ul className="space-y-2">
              {loaded && reservas.length === 0 && (
                <li className="text-center py-10 text-muted">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>{P.empty}</p>
                </li>
              )}
              {sorted.map((r) => {
                const name = nameOf(r.id_usuario);
                return (
                  <li key={r.id_reserva}>
                    <Card>
                      <CardBody className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center font-bold text-sm shrink-0" aria-hidden>
                            {initials(name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{name}</p>
                            <p className="text-xs text-muted font-mono truncate">{r.qr_token}</p>
                          </div>
                          <StatusBadge kind="reservation" value={r.estado} className="shrink-0" />
                        </div>
                      </CardBody>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}
