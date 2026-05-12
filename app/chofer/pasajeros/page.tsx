"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import type { Asignacion, Reserva, Usuario } from "@/lib/types";
import { Users, CheckCircle2, Clock, Hourglass, XCircle } from "lucide-react";

export default function ChoferPasajerosPage() {
  const { user } = useSession();
  const [asignacion, setAsignacion] = useState<Asignacion | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    db.getAsignacionesByChofer(user.id_usuario).then(async (asgs) => {
      const todayAsgs = asgs.filter((a) => a.fecha === today);
      const hoy =
        todayAsgs.find((a) => a.estado === "en_curso") ??
        todayAsgs.sort((a, b) => a.hora_salida.localeCompare(b.hora_salida))[0] ??
        asgs[0] ??
        null;
      setAsignacion(hoy);
      if (hoy) {
        const [r, u] = await Promise.all([
          db.getReservasByAsignacion(hoy.id_asignacion),
          db.getUsuarios(),
        ]);
        setReservas(r);
        setUsuarios(u);
      }
    });
  }, [user]);

  const usadas = reservas.filter((r) => r.estado === "usada").length;
  const confirmadas = reservas.filter((r) => r.estado === "confirmada").length;
  const espera = reservas.filter((r) => r.estado === "en_espera").length;

  return (
    <AppShell role="chofer">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">Lista</p>
          <h1 className="font-display text-3xl">Pasajeros</h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardBody className="text-center py-3">
              <p className="font-display text-2xl text-state-ok">{usadas}</p>
              <p className="text-xs text-muted">Abordaron</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-3">
              <p className="font-display text-2xl text-primary">{confirmadas}</p>
              <p className="text-xs text-muted">Esperando</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-3">
              <p className="font-display text-2xl text-state-warn">{espera}</p>
              <p className="text-xs text-muted">Lista espera</p>
            </CardBody>
          </Card>
        </div>

        {asignacion && (
          <Card>
            <CardBody className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Ocupación</span>
                <span className="font-medium">
                  {usadas} / {asignacion.cupos_disponibles}
                </span>
              </div>
              <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-state-ok transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (usadas / asignacion.cupos_disponibles) * 100
                    )}%`,
                  }}
                />
              </div>
            </CardBody>
          </Card>
        )}

        <div className="space-y-2">
          {reservas.length === 0 && (
            <div className="text-center py-10 text-muted">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Sin pasajeros registrados.</p>
            </div>
          )}
          {reservas.map((r) => {
            const u = usuarios.find((x) => x.id_usuario === r.id_usuario);
            const Icon =
              r.estado === "usada"
                ? CheckCircle2
                : r.estado === "en_espera"
                ? Hourglass
                : r.estado === "cancelada"
                ? XCircle
                : Clock;
            const color =
              r.estado === "usada"
                ? "text-state-ok"
                : r.estado === "en_espera"
                ? "text-state-warn"
                : r.estado === "cancelada"
                ? "text-state-error"
                : "text-primary";
            return (
              <Card key={r.id_reserva}>
                <CardBody>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center font-bold text-sm shrink-0">
                      {u?.nombre
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {u?.nombre ?? "Desconocido"}
                      </p>
                      <p className="text-xs text-muted font-mono truncate">
                        {r.qr_token}
                      </p>
                    </div>
                    <Icon className={`w-5 h-5 ${color} shrink-0`} />
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
