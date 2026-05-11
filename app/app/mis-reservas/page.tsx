"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { toast } from "@/components/ui/toaster";
import type { Asignacion, Reserva, Ruta } from "@/lib/types";
import { QrCode, CalendarCheck, Clock, MapPin, XCircle, CheckCircle2, Hourglass, Ban } from "lucide-react";

const ESTADO_META: Record<string, { label: string; variant: "success"|"warning"|"info"|"default"|"error" }> = {
  confirmada: { label: "Confirmada", variant: "success" },
  en_espera:  { label: "En espera",  variant: "warning" },
  usada:      { label: "Usada",      variant: "info" },
  cancelada:  { label: "Cancelada",  variant: "default" },
  no_show:    { label: "No presentó",variant: "error" }
};

export default function MisReservasPage() {
  const { user } = useSession();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [canceling, setCanceling] = useState<string | null>(null);
  const [tab, setTab] = useState<"proximas" | "historial">("proximas");

  useEffect(() => {
    if (!user) return;
    Promise.all([db.getReservasByUsuario(user.id_usuario), db.getAsignaciones(), db.getRutas()])
      .then(([r, a, rutas]) => {
        setReservas(r.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
        setAsignaciones(a);
        setRutas(rutas);
      });
  }, [user]);

  const enrich = (r: Reserva) => {
    const asg = asignaciones.find((a) => a.id_asignacion === r.id_asignacion);
    const ruta = rutas.find((rt) => rt.id_ruta === asg?.id_ruta);
    return { ...r, asg, ruta };
  };

  const today = new Date().toISOString().slice(0, 10);
  const proximas = reservas.map(enrich).filter((r) => (r.estado === "confirmada" || r.estado === "en_espera") && r.asg && r.asg.fecha >= today);
  const historial = reservas.map(enrich).filter((r) => r.estado === "usada" || r.estado === "cancelada" || r.estado === "no_show" || (r.asg && r.asg.fecha < today));

  const cancelar = async (id: string) => {
    setCanceling(id);
    await db.cancelReserva(id);
    setReservas((prev) => prev.map((r) => r.id_reserva === id ? { ...r, estado: "cancelada" } : r));
    toast({ title: "Reserva cancelada", variant: "info" });
    setCanceling(null);
  };

  const lista = tab === "proximas" ? proximas : historial;

  return (
    <AppShell role="estudiante">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">Tus viajes</p>
          <h1 className="font-display text-3xl">Mis reservas</h1>
        </div>

        <div className="flex gap-1 bg-surface-2 p-1 rounded-xl w-fit">
          {(["proximas", "historial"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-surface shadow text-foreground" : "text-muted hover:text-foreground"
              }`}>
              {t === "proximas" ? `Próximas (${proximas.length})` : `Historial (${historial.length})`}
            </button>
          ))}
        </div>

        {lista.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{tab === "proximas" ? "Sin reservas próximas" : "Sin historial aún"}</p>
            {tab === "proximas" && <Link href="/app/reservar" className="mt-3 inline-block"><Button>Reservar ahora</Button></Link>}
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map((r) => {
              const meta = ESTADO_META[r.estado] ?? { label: r.estado, variant: "default" };
              return (
                <Card key={r.id_reserva} className="overflow-hidden">
                  {r.ruta && <div className="h-1" style={{ background: r.ruta.color_hex }} />}
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={meta.variant as any}>{meta.label}</Badge>
                          {r.asg && (
                            <span className="text-xs text-muted">
                              {new Date(r.asg.fecha + "T12:00:00").toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                        {r.ruta && <p className="font-display text-lg leading-tight">{r.ruta.codigo} · {r.ruta.nombre}</p>}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted">
                          {r.asg && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Salida {r.asg.hora_salida}</span>}
                          {r.estado === "en_espera" && r.posicion_waitlist && (
                            <span className="flex items-center gap-1 text-state-warn"><Hourglass className="w-3.5 h-3.5" />Posición #{r.posicion_waitlist}</span>
                          )}
                          {r.observaciones && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{r.observaciones}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {(r.estado === "confirmada" || r.estado === "en_espera") && (
                          <>
                            <Link href="/app/mi-qr"><Button size="sm" variant="outline"><QrCode className="w-4 h-4" /></Button></Link>
                            <Button size="sm" variant="outline" className="text-state-error hover:bg-state-error/10 border-state-error/30"
                              loading={canceling === r.id_reserva} onClick={() => cancelar(r.id_reserva)}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {r.estado === "usada" && <CheckCircle2 className="w-5 h-5 text-state-ok" />}
                        {r.estado === "cancelada" && <Ban className="w-5 h-5 text-muted" />}
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
