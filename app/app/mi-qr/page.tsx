"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { useI18n } from "@/lib/i18n";
import { localISODate } from "@/lib/utils";
import type { Asignacion, Reserva, Ruta } from "@/lib/types";
import { Clock, MapPin, CalendarCheck, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";

export default function MiQrPage() {
  const { user } = useSession();
  const { t, fmtDate } = useI18n();
  const Q = t.student.qr;
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const load = () => {
    if (!user) return;
    Promise.all([db.getReservasByUsuario(user.id_usuario), db.getAsignaciones(), db.getRutas()])
      .then(([r, a, rt]) => {
        const today = localISODate();
        const asgOf = (x: Reserva) => a.find((z) => z.id_asignacion === x.id_asignacion);
        const activas = r
          .filter((x) => {
            const asg = asgOf(x);
            return (x.estado === "confirmada" || x.estado === "en_espera") && !!asg && asg.fecha >= today &&
              asg.estado !== "completada" && asg.estado !== "cancelada";
          })
          .sort((x, y) => {
            const ax = asgOf(x)!;
            const ay = asgOf(y)!;
            return ax.fecha.localeCompare(ay.fecha) || ax.hora_salida.localeCompare(ay.hora_salida);
          });
        setReservas(activas);
        setAsignaciones(a);
        setRutas(rt);
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user]);
  useEffect(() => { if (selectedIdx >= reservas.length) setSelectedIdx(0); }, [reservas, selectedIdx]);

  const reserva = reservas[selectedIdx];
  const asg = asignaciones.find((a) => a.id_asignacion === reserva?.id_asignacion);
  const ruta = rutas.find((r) => r.id_ruta === asg?.id_ruta);
  const isHoy = asg?.fecha === localISODate();
  const dimmed = !isHoy || reserva?.estado === "en_espera";

  useEffect(() => {
    const token = reserva?.qr_token;
    if (!token) { setQrDataUrl(null); return; }
    QRCode.toDataURL(token, {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 8,
      color: {
        dark: ruta?.color_hex ?? "#111111",
        light: "#FFFFFF"
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(null));
  }, [reserva?.qr_token, ruta?.color_hex]);

  return (
    <AppShell role="estudiante">
      <div className="max-w-sm mx-auto px-4 sm:px-6 py-8 space-y-6 text-center">
        <div>
          <p className="text-sm text-muted mb-1">{Q.kicker}</p>
          <h1 className="font-display text-3xl">{Q.title}</h1>
        </div>

        {reservas.length === 0 ? (
          <Card>
            <CardBody className="py-12 space-y-4">
              <AlertCircle className="w-10 h-10 text-muted mx-auto" />
              <p className="font-medium">{Q.empty}</p>
              <p className="text-sm text-muted">{Q.emptyText}</p>
              <Link href="/app/reservar"><Button>{Q.bookNow}</Button></Link>
            </CardBody>
          </Card>
        ) : (
          <>
            {reservas.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 justify-center">
                {reservas.map((r, i) => {
                  const a = asignaciones.find((x) => x.id_asignacion === r.id_asignacion);
                  return (
                    <button key={r.id_reserva} type="button" aria-pressed={i === selectedIdx} onClick={() => setSelectedIdx(i)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        i === selectedIdx ? "bg-primary text-white" : "bg-surface-2 text-muted hover:bg-surface"
                      }`}>
                      {a ? `${fmtDate(a.fecha, { day: "numeric", month: "short" })} · ${a.hora_salida}` : `#${i + 1}`}
                    </button>
                  );
                })}
              </div>
            )}

            {reserva && (
              <Card className="overflow-hidden">
                {ruta && <div className="h-2" style={{ background: ruta.color_hex }} />}
                <CardBody className="space-y-4 flex flex-col items-center">
                  <Badge variant={reserva.estado === "confirmada" ? "success" : "warning"}>
                    {reserva.estado === "confirmada"
                      ? <><CheckCircle2 className="w-3.5 h-3.5" /> {t.status.reservation.confirmada}</>
                      : <><Clock className="w-3.5 h-3.5" /> {t.common.waitlistPos(reserva.posicion_waitlist ?? 1)}</>}
                  </Badge>
                  <div className={`transition-all ${dimmed ? "opacity-60 grayscale" : ""}`}>
                    {qrDataUrl ? (
                      <div className="p-4 bg-white rounded-2xl shadow-inner inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrDataUrl} alt={Q.alt} width={200} height={200} className="block" />
                      </div>
                    ) : (
                      <div className="p-6 bg-white rounded-2xl shadow-inner inline-block text-xs text-muted">
                        {Q.generating}
                      </div>
                    )}
                  </div>
                  {reserva.estado === "en_espera" ? (
                    <div className="bg-state-warn/10 text-state-warn text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />{Q.waitlistNote}
                    </div>
                  ) : !isHoy && (
                    <div className="bg-state-warn/10 text-state-warn text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />{Q.notToday}
                    </div>
                  )}
                  <div className="w-full space-y-2 text-sm">
                    {ruta && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{t.common.route}</span>
                        <span className="font-medium">{ruta.codigo} · {ruta.nombre}</span>
                      </div>
                    )}
                    {asg && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted flex items-center gap-1"><CalendarCheck className="w-3.5 h-3.5" />{t.common.date}</span>
                          <span className="font-medium capitalize">{fmtDate(asg.fecha, { weekday: "short", day: "numeric", month: "long" })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{t.common.departure}</span>
                          <span className="font-medium">{asg.hora_salida}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="w-full bg-surface-2 rounded-lg px-3 py-2 text-xs text-muted font-mono break-all">{reserva.qr_token}</div>
                </CardBody>
              </Card>
            )}
            <Button variant="outline" onClick={load} className="w-full">
              <RefreshCw className="w-4 h-4" /> {Q.refresh}
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
