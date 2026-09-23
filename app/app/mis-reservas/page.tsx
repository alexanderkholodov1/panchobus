"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { useI18n } from "@/lib/i18n";
import { localISODate } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import type { Asignacion, Reserva, Ruta } from "@/lib/types";
import { QrCode, CalendarCheck, Clock, StickyNote, XCircle, CheckCircle2, Hourglass, Ban } from "lucide-react";

export default function MisReservasPage() {
  const { user } = useSession();
  const { t, fmtDate } = useI18n();
  const M = t.student.bookings;
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [canceling, setCanceling] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [tab, setTab] = useState<"proximas" | "historial">("proximas");

  const load = () => {
    if (!user) return;
    Promise.all([db.getReservasByUsuario(user.id_usuario), db.getAsignaciones(), db.getRutas()])
      .then(([r, a, rts]) => {
        setReservas([...r]);
        setAsignaciones(a);
        setRutas(rts);
      });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [user]);

  const enrich = (r: Reserva) => {
    const asg = asignaciones.find((a) => a.id_asignacion === r.id_asignacion);
    const ruta = rutas.find((rt) => rt.id_ruta === asg?.id_ruta);
    return { ...r, asg, ruta };
  };

  const today = localISODate();
  const isUpcoming = (r: ReturnType<typeof enrich>) =>
    (r.estado === "confirmada" || r.estado === "en_espera") && !!r.asg && r.asg.fecha >= today &&
    r.asg.estado !== "completada" && r.asg.estado !== "cancelada";
  const all = reservas.map(enrich);
  const proximas = all
    .filter(isUpcoming)
    .sort((a, b) => a.asg!.fecha.localeCompare(b.asg!.fecha) || a.asg!.hora_salida.localeCompare(b.asg!.hora_salida));
  const historial = all
    .filter((r) => !isUpcoming(r))
    .sort((a, b) => (b.asg?.fecha ?? "").localeCompare(a.asg?.fecha ?? "") || (b.asg?.hora_salida ?? "").localeCompare(a.asg?.hora_salida ?? ""));

  const cancelar = async (id: number) => {
    setCanceling(id);
    await db.cancelReserva(id);
    toast({ title: M.toastCancelled, variant: "info" });
    setCanceling(null);
    setConfirming(null);
    load();
  };

  const lista = tab === "proximas" ? proximas : historial;

  return (
    <AppShell role="estudiante">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">{M.kicker}</p>
          <h1 className="font-display text-3xl">{M.title}</h1>
        </div>

        <div role="tablist" className="flex gap-1 bg-surface-2 p-1 rounded-xl w-fit">
          {(["proximas", "historial"] as const).map((tb) => (
            <button key={tb} role="tab" aria-selected={tab === tb} onClick={() => setTab(tb)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === tb ? "bg-surface shadow text-foreground" : "text-muted hover:text-foreground"
              }`}>
              {tb === "proximas" ? M.upcoming(proximas.length) : M.history(historial.length)}
            </button>
          ))}
        </div>

        {lista.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{tab === "proximas" ? M.emptyUpcoming : M.emptyHistory}</p>
            {tab === "proximas" && <Link href="/app/reservar" className="mt-3 inline-block"><Button>{M.bookNow}</Button></Link>}
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map((r) => {
              const active = isUpcoming(r);
              return (
                <Card key={r.id_reserva} className="overflow-hidden">
                  {r.ruta && <div className="h-1" style={{ background: r.ruta.color_hex }} />}
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <StatusBadge kind="reservation" value={r.estado} />
                          {r.asg && (
                            <span className="text-xs text-muted capitalize">
                              {fmtDate(r.asg.fecha, { weekday: "short", day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                        {r.ruta && <p className="font-display text-lg leading-tight">{r.ruta.codigo} · {r.ruta.nombre}</p>}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted">
                          {r.asg && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{t.common.departureAt(r.asg.hora_salida)}</span>}
                          {r.estado === "en_espera" && r.posicion_waitlist != null && (
                            <span className="flex items-center gap-1 text-state-warn"><Hourglass className="w-3.5 h-3.5" />{M.position(r.posicion_waitlist)}</span>
                          )}
                          {r.observaciones && <span className="flex items-center gap-1"><StickyNote className="w-3.5 h-3.5" />{r.observaciones}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {active && (
                          <>
                            <Link href="/app/mi-qr" aria-label={M.viewQr} title={M.viewQr}>
                              <Button size="sm" variant="outline" tabIndex={-1}><QrCode className="w-4 h-4" /></Button>
                            </Link>
                            {confirming === r.id_reserva ? (
                              <Button size="sm" variant="danger" loading={canceling === r.id_reserva} onClick={() => cancelar(r.id_reserva)}>
                                {M.confirmCancel}
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" aria-label={M.cancel} title={M.cancel}
                                className="text-state-error hover:bg-state-error/10 border-state-error/30"
                                onClick={() => setConfirming(r.id_reserva)}>
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {r.estado === "usada" && <CheckCircle2 className="w-5 h-5 text-state-ok" aria-hidden />}
                        {r.estado === "cancelada" && <Ban className="w-5 h-5 text-muted" aria-hidden />}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
