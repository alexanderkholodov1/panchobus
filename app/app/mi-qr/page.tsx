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
import { Clock, MapPin, CalendarCheck, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";

export default function MiQrPage() {
  const { user } = useSession();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const load = () => {
    if (!user) return;
    Promise.all([db.getReservasByUsuario(user.id_usuario), db.getAsignaciones(), db.getRutas()])
      .then(([r, a, rt]) => {
        const activas = r
          .filter((x) => x.estado === "confirmada" || x.estado === "en_espera")
          .sort((x, y) => {
            const ax = a.find((z) => z.id_asignacion === x.id_asignacion);
            const ay = a.find((z) => z.id_asignacion === y.id_asignacion);
            return (ax?.fecha ?? "").localeCompare(ay?.fecha ?? "");
          });
        setReservas(activas);
        setAsignaciones(a);
        setRutas(rt);
      });
  };

  useEffect(() => { load(); }, [user]);

  const reserva = reservas[selectedIdx];
  const asg = asignaciones.find((a) => a.id_asignacion === reserva?.id_asignacion);
  const ruta = rutas.find((r) => r.id_ruta === asg?.id_ruta);
  const isHoy = asg?.fecha === new Date().toISOString().slice(0, 10);

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
          <p className="text-sm text-muted mb-1">Abordaje</p>
          <h1 className="font-display text-3xl">Mi QR</h1>
        </div>

        {reservas.length === 0 ? (
          <Card>
            <CardBody className="py-12 space-y-4">
              <AlertCircle className="w-10 h-10 text-muted mx-auto" />
              <p className="font-medium">Sin reservas activas</p>
              <p className="text-sm text-muted">Reserva tu cupo primero para obtener tu QR de abordaje.</p>
              <Link href="/app/reservar"><Button>Reservar ahora</Button></Link>
            </CardBody>
          </Card>
        ) : (
          <>
            {reservas.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 justify-center">
                {reservas.map((r, i) => {
                  const a = asignaciones.find((x) => x.id_asignacion === r.id_asignacion);
                  return (
                    <button key={r.id_reserva} onClick={() => setSelectedIdx(i)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        i === selectedIdx ? "bg-primary text-white" : "bg-surface-2 text-muted hover:bg-surface"
                      }`}>
                      {a ? new Date(a.fecha + "T12:00:00").toLocaleDateString("es-EC", { day: "numeric", month: "short" }) : `#${i + 1}`}
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
                      ? <><CheckCircle2 className="w-3.5 h-3.5" /> Confirmada</>
                      : <><Clock className="w-3.5 h-3.5" /> En espera</>}
                  </Badge>
                  <div className={`transition-all ${!isHoy ? "opacity-60 grayscale" : ""}`}>
                    {qrDataUrl ? (
                      <div className="p-4 bg-white rounded-2xl shadow-inner inline-block">
                        <img src={qrDataUrl} alt="QR de reserva" width={200} height={200} className="block" />
                      </div>
                    ) : (
                      <div className="p-6 bg-white rounded-2xl shadow-inner inline-block text-xs text-muted">
                        Generando QR...
                      </div>
                    )}
                  </div>
                  {!isHoy && (
                    <div className="bg-state-warn/10 text-state-warn text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />El QR se activa el día del viaje
                    </div>
                  )}
                  <div className="w-full space-y-2 text-sm">
                    {ruta && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Ruta</span>
                        <span className="font-medium">{ruta.codigo} · {ruta.nombre}</span>
                      </div>
                    )}
                    {asg && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted flex items-center gap-1"><CalendarCheck className="w-3.5 h-3.5" />Fecha</span>
                          <span className="font-medium">{new Date(asg.fecha + "T12:00:00").toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "long" })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Salida</span>
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
              <RefreshCw className="w-4 h-4" /> Actualizar
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
