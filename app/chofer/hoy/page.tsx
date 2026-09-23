"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { useI18n } from "@/lib/i18n";
import { pickDriverTrip } from "@/lib/trips";
import { localISODate } from "@/lib/utils";
import type { Asignacion, Parada, Ruta } from "@/lib/types";
import { Navigation, Clock, MapPin, Bus, CheckCircle2, AlertCircle, Megaphone, X, CalendarClock } from "lucide-react";
import { toast } from "@/components/ui/toaster";

interface GeoCoords { lat: number; lng: number; velocidad: number | null; precision: number | null; }

export default function ChoferHoyPage() {
  const { user } = useSession();
  const { t, fmtDate } = useI18n();
  const H = t.driver.today;
  const [asignacion, setAsignacion] = useState<Asignacion | null>(null);
  const [isToday, setIsToday] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [tracking, setTracking] = useState(false);
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [avisoOpen, setAvisoOpen] = useState(false);
  const [avisoTexto, setAvisoTexto] = useState("");
  const [avisoLoading, setAvisoLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coordsRef = useRef<GeoCoords | null>(null);

  useEffect(() => {
    if (!user) return;
    db.getAsignacionesByChofer(user.id_usuario).then(async (asgs) => {
      const { trip, isToday: today } = pickDriverTrip(asgs, localISODate());
      setAsignacion(trip);
      setIsToday(today);
      if (trip) {
        const [r, p] = await Promise.all([db.getRuta(trip.id_ruta), db.getParadasByRuta(trip.id_ruta)]);
        setRuta(r);
        setParadas(p);
      }
      setLoaded(true);
    });
  }, [user]);

  useEffect(() => { coordsRef.current = coords; }, [coords]);

  useEffect(() => {
    if (!avisoOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAvisoOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [avisoOpen]);

  const enviarAviso = async () => {
    if (!user || !asignacion || !avisoTexto.trim()) return;
    setAvisoLoading(true);
    try {
      await db.createMensaje({
        remitente_id: user.id_usuario,
        destinatario_id: null,
        destinatario_ruta: asignacion.id_ruta,
        asunto: `${H.noticeSubject}${ruta ? ` ${ruta.codigo}` : ""}`,
        cuerpo: avisoTexto.trim(),
        leido: false,
      });
      toast({ title: H.toastNotice, description: H.toastNoticeText, variant: "success" });
      setAvisoTexto(""); setAvisoOpen(false);
    } catch { toast({ title: H.toastNoticeError, variant: "error" }); }
    finally { setAvisoLoading(false); }
  };

  const enviarUbicacion = async (c: GeoCoords) => {
    if (!asignacion) return;
    try {
      await fetch("/api/gps", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_asignacion: asignacion.id_asignacion, latitud: c.lat, longitud: c.lng, velocidad: c.velocidad, precision: c.precision }) });
    } catch { /* network errors are retried on the next tick */ }
  };

  const iniciarRuta = () => {
    setGpsError(null);
    if (!navigator.geolocation) { setGpsError(H.gpsUnsupported); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const c: GeoCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude, velocidad: pos.coords.speed, precision: pos.coords.accuracy };
        setCoords(c); coordsRef.current = c;
      },
      (err) => {
        const msgs: Record<number, string> = { 1: H.gpsDenied, 2: H.gpsUnavailable, 3: H.gpsTimeout };
        setGpsError(msgs[err.code] ?? H.gpsError);
        if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    intervalRef.current = setInterval(() => { if (coordsRef.current) enviarUbicacion(coordsRef.current); }, 15000);
    setTracking(true);
    toast({ title: H.toastGps, description: H.toastGpsText, variant: "success" });
  };

  const finalizarRuta = () => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setTracking(false); setCoords(null);
    toast({ title: H.toastFinished, variant: "info" });
  };

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  if (loaded && !asignacion) return (
    <AppShell role="chofer">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <Bus className="w-12 h-12 text-muted mx-auto" />
        <h1 className="font-display text-2xl">{H.none}</h1>
        <p className="text-muted text-sm">{H.noneText}</p>
      </div>
    </AppShell>
  );

  if (!asignacion) return <AppShell role="chofer"><div className="min-h-[50vh]" /></AppShell>;

  const canOperate = isToday && asignacion.estado !== "completada" && asignacion.estado !== "cancelada";

  return (
    <AppShell role="chofer">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">{H.kicker}</p>
          <h1 className="font-display text-3xl">{isToday ? H.title : H.nextTitle}</h1>
          {!isToday && (
            <p className="text-sm text-muted mt-2 flex items-start gap-1.5">
              <CalendarClock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{H.nextNote(`${fmtDate(asignacion.fecha)} · ${asignacion.hora_salida}`)}</span>
            </p>
          )}
        </div>

        <Card className="overflow-hidden">
          {ruta && <div className="h-2" style={{ background: ruta.color_hex }} />}
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge kind="assignment" value={asignacion.estado} />
              {ruta && <Badge variant="info">{ruta.codigo}</Badge>}
              <span className="text-xs text-muted capitalize">{fmtDate(asignacion.fecha, { weekday: "long", day: "numeric", month: "short" })}</span>
            </div>
            <h2 className="font-display text-2xl">{ruta?.nombre ?? `${t.common.route} ${asignacion.id_ruta}`}</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted" />
                <div><dt className="text-xs text-muted">{t.common.departure}</dt><dd className="font-medium">{asignacion.hora_salida}</dd></div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted" />
                <div><dt className="text-xs text-muted">{t.common.tripEnd}</dt><dd className="font-medium">{asignacion.hora_regreso}</dd></div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted" />
                <div><dt className="text-xs text-muted">{H.stopsLabel}</dt><dd className="font-medium">{paradas.length}</dd></div>
              </div>
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-muted" />
                <div><dt className="text-xs text-muted">{H.passengers}</dt><dd className="font-medium">{asignacion.cupos_reservados} / {asignacion.cupos_disponibles}</dd></div>
              </div>
            </dl>

            {canOperate && (
              <div className="space-y-2">
                {tracking ? (
                  <>
                    <div className="flex items-center gap-2 bg-state-ok/10 text-state-ok px-3 py-2 rounded-lg text-sm" role="status">
                      <div className="w-2 h-2 rounded-full bg-state-ok animate-pulse shrink-0" />
                      <span>{H.gpsOn}</span>
                    </div>
                    {coords && (
                      <div className="grid grid-cols-2 gap-2 text-xs bg-surface-2 rounded-lg px-3 py-2">
                        <div><p className="text-muted">{H.lat}</p><p className="font-mono font-medium">{coords.lat.toFixed(6)}</p></div>
                        <div><p className="text-muted">{H.lng}</p><p className="font-mono font-medium">{coords.lng.toFixed(6)}</p></div>
                        {coords.velocidad != null && <div><p className="text-muted">{H.speed}</p><p className="font-mono font-medium">{(coords.velocidad * 3.6).toFixed(1)} km/h</p></div>}
                        {coords.precision != null && <div><p className="text-muted">{H.accuracy}</p><p className="font-mono font-medium">±{coords.precision.toFixed(0)} m</p></div>}
                      </div>
                    )}
                    <Button variant="outline" className="w-full" onClick={finalizarRuta}><CheckCircle2 className="w-4 h-4" /> {H.finish}</Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full" size="lg" onClick={iniciarRuta}><Navigation className="w-4 h-4" /> {H.start}</Button>
                    {gpsError && <div role="alert" className="flex items-start gap-2 text-sm text-state-error bg-state-error/10 px-3 py-2 rounded-lg"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{gpsError}</span></div>}
                    <p className="text-xs text-muted text-center">{H.gpsHint}</p>
                  </>
                )}
              </div>
            )}

            {asignacion.estado !== "cancelada" && (
              <div className="border-t border-border pt-4">
                <Button variant="outline" className="w-full" onClick={() => setAvisoOpen(true)}>
                  <Megaphone className="w-4 h-4" /> {H.notice}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {avisoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setAvisoOpen(false)}>
            <div role="dialog" aria-modal="true" aria-labelledby="aviso-title" onClick={(e) => e.stopPropagation()} className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 id="aviso-title" className="font-display text-lg">{H.noticeTitle}</h3>
                <button type="button" onClick={() => setAvisoOpen(false)} aria-label={t.common.close} className="text-muted hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-muted">{H.noticeText}</p>
              <textarea
                autoFocus
                aria-label={H.noticeTitle}
                className="w-full h-28 px-3 py-2 rounded-lg border border-border bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                placeholder={H.noticePlaceholder}
                value={avisoTexto}
                maxLength={280}
                onChange={(e) => setAvisoTexto(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setAvisoOpen(false)}>{t.common.cancel}</Button>
                <Button className="flex-1" loading={avisoLoading} disabled={!avisoTexto.trim()} onClick={enviarAviso}>{H.send}</Button>
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="font-display text-xl mb-3">{H.stops(paradas.length)}</h2>
          <ol className="space-y-0">
            {paradas.map((p, i) => (
              <li key={p.id_parada} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      borderColor: ruta?.color_hex ?? "#E11B22",
                      background: p.tipo !== "intermedia" ? ruta?.color_hex : "transparent",
                      color: p.tipo !== "intermedia" ? "white" : ruta?.color_hex,
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < paradas.length - 1 && <div className="w-0.5 flex-1 my-1" style={{ background: `${ruta?.color_hex ?? "#E11B22"}40` }} />}
                </div>
                <div className="pb-3 flex-1">
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <p className="font-medium text-sm">{p.nombre}</p>
                      {p.tipo !== "intermedia" && <Badge variant="default" className="text-xs mt-0.5">{t.stopType[p.tipo]}</Badge>}
                    </div>
                    <p className="text-xs text-muted whitespace-nowrap">↑ {p.hora_salida} · ↓ {p.hora_regreso}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </AppShell>
  );
}
