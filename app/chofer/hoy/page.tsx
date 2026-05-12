"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import type { Asignacion, Parada, Ruta } from "@/lib/types";
import { Navigation, Clock, MapPin, Bus, CheckCircle2, AlertCircle, Megaphone, X } from "lucide-react";
import { toast } from "@/components/ui/toaster";

interface GeoCoords { lat: number; lng: number; velocidad: number | null; precision: number | null; }

export default function ChoferHoyPage() {
  const { user } = useSession();
  const [asignacion, setAsignacion] = useState<Asignacion | null>(null);
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
    const today = new Date().toISOString().slice(0, 10);
    db.getAsignacionesByChofer(user.id_usuario).then(async (asgs) => {
      const hoy = asgs.find((a) => a.fecha === today) ?? asgs[0] ?? null;
      setAsignacion(hoy);
      if (hoy) {
        const [r, p] = await Promise.all([db.getRuta(hoy.id_ruta), db.getParadasByRuta(hoy.id_ruta)]);
        setRuta(r);
        setParadas(p);
      }
    });
  }, [user]);

  useEffect(() => { coordsRef.current = coords; }, [coords]);

  const enviarAviso = async () => {
    if (!user || !asignacion || !avisoTexto.trim()) return;
    setAvisoLoading(true);
    try {
      await db.createMensaje({
        remitente_id: user.id_usuario,
        destinatario_id: null,
        destinatario_ruta: asignacion.id_ruta,
        asunto: "Aviso de ruta",
        cuerpo: avisoTexto.trim(),
        leido: false,
      });
      toast({ title: "Aviso enviado", description: "Los pasajeros lo ver\u00e1n al iniciar sesi\u00f3n.", variant: "success" });
      setAvisoTexto(""); setAvisoOpen(false);
    } catch { toast({ title: "Error al enviar aviso", variant: "error" }); }
    finally { setAvisoLoading(false); }
  };

  const enviarUbicacion = async (c: GeoCoords) => {
    if (!asignacion) return;
    try {
      await fetch("/api/gps", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_asignacion: asignacion.id_asignacion, latitud: c.lat, longitud: c.lng, velocidad: c.velocidad, precision: c.precision }) });
    } catch {}
  };

  const iniciarRuta = () => {
    setGpsError(null);
    if (!navigator.geolocation) { setGpsError("Este dispositivo no soporta geolocalizaci\u00f3n."); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => { const c: GeoCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude, velocidad: pos.coords.speed, precision: pos.coords.accuracy }; setCoords(c); coordsRef.current = c; },
      (err) => { const msgs: Record<number,string> = {1:"Permiso de ubicaci\u00f3n denegado.",2:"No se pudo determinar la ubicaci\u00f3n.",3:"Tiempo de espera agotado."}; setGpsError(msgs[err.code]??"Error de geolocalizaci\u00f3n."); setTracking(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    intervalRef.current = setInterval(() => { if (coordsRef.current) enviarUbicacion(coordsRef.current); }, 15000);
    setTracking(true);
    toast({ title: "GPS activo", description: "Enviando ubicaci\u00f3n cada 15 s", variant: "success" });
  };

  const finalizarRuta = () => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setTracking(false); setCoords(null);
    toast({ title: "Ruta finalizada", variant: "info" });
  };

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  if (!asignacion) return (
    <AppShell role="chofer">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 text-center space-y-4">
        <Bus className="w-12 h-12 text-muted mx-auto" />
        <h1 className="font-display text-2xl">Sin asignaci\u00f3n para hoy</h1>
        <p className="text-muted text-sm">Consulta con administraci\u00f3n si esto es un error.</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell role="chofer">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">Panel de ruta</p>
          <h1 className="font-display text-3xl">Mi ruta de hoy</h1>
        </div>

        <Card className="overflow-hidden">
          {ruta && <div className="h-2" style={{ background: ruta.color_hex }} />}
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={asignacion.estado === "en_curso" ? "success" : asignacion.estado === "completada" ? "default" : "info"}>{asignacion.estado}</Badge>
              {ruta && <Badge variant="info">{ruta.codigo}</Badge>}
            </div>
            <h2 className="font-display text-2xl">{ruta?.nombre ?? `Ruta ${asignacion.id_ruta}`}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted" /><div><p className="text-xs text-muted">Salida</p><p className="font-medium">{asignacion.hora_salida}</p></div></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted" /><div><p className="text-xs text-muted">Regreso</p><p className="font-medium">{asignacion.hora_regreso}</p></div></div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted" /><div><p className="text-xs text-muted">Paradas</p><p className="font-medium">{paradas.length}</p></div></div>
              <div className="flex items-center gap-2"><Bus className="w-4 h-4 text-muted" /><div><p className="text-xs text-muted">Pasajeros</p><p className="font-medium">{asignacion.cupos_reservados} / {asignacion.cupos_disponibles}</p></div></div>
            </div>

            {asignacion.estado !== "completada" && (
              <div className="space-y-2">
                {tracking ? (
                  <>
                    <div className="flex items-center gap-2 bg-state-ok/10 text-state-ok px-3 py-2 rounded-lg text-sm">
                      <div className="w-2 h-2 rounded-full bg-state-ok animate-pulse shrink-0" />
                      <span>GPS activo \u2014 transmitiendo en tiempo real</span>
                    </div>
                    {coords && (
                      <div className="grid grid-cols-2 gap-2 text-xs bg-surface-2 rounded-lg px-3 py-2">
                        <div><p className="text-muted">Latitud</p><p className="font-mono font-medium">{coords.lat.toFixed(6)}</p></div>
                        <div><p className="text-muted">Longitud</p><p className="font-mono font-medium">{coords.lng.toFixed(6)}</p></div>
                        {coords.velocidad != null && <div><p className="text-muted">Velocidad</p><p className="font-mono font-medium">{(coords.velocidad * 3.6).toFixed(1)} km/h</p></div>}
                        {coords.precision != null && <div><p className="text-muted">Precisi\u00f3n</p><p className="font-mono font-medium">\u00b1{coords.precision.toFixed(0)} m</p></div>}
                      </div>
                    )}
                    <Button variant="outline" className="w-full" onClick={finalizarRuta}><CheckCircle2 className="w-4 h-4" /> Finalizar ruta</Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full" size="lg" onClick={iniciarRuta}><Navigation className="w-4 h-4" /> Iniciar ruta \u00b7 Activar GPS</Button>
                    {gpsError && <div className="flex items-start gap-2 text-sm text-state-error bg-state-error/10 px-3 py-2 rounded-lg"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{gpsError}</span></div>}
                    <p className="text-xs text-muted text-center">Se requieren permisos de ubicaci\u00f3n en el navegador.</p>
                  </>
                )}
              </div>
            )}

            {asignacion.estado !== "completada" && (
              <div className="border-t border-border pt-4">
                <Button variant="outline" className="w-full" onClick={() => setAvisoOpen(true)}>
                  <Megaphone className="w-4 h-4" /> Enviar aviso a pasajeros
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {avisoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">Aviso a pasajeros</h3>
                <button onClick={() => setAvisoOpen(false)} className="text-muted hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-muted">El mensaje aparecer\u00e1 en el inicio de todos los pasajeros de esta ruta.</p>
              <textarea className="w-full h-28 px-3 py-2 rounded-lg border border-border bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                placeholder="Ej: El bus llegar\u00e1 con 10 minutos de retraso\u2026"
                value={avisoTexto} onChange={(e) => setAvisoTexto(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setAvisoOpen(false)}>Cancelar</Button>
                <Button className="flex-1" loading={avisoLoading} disabled={!avisoTexto.trim()} onClick={enviarAviso}>Enviar</Button>
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="font-display text-xl mb-3">Paradas ({paradas.length})</h2>
          <div className="space-y-0">
            {paradas.map((p, i) => (
              <div key={p.id_parada} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ borderColor: ruta?.color_hex ?? "#E11B22", background: p.tipo !== "intermedia" ? ruta?.color_hex : "transparent", color: p.tipo !== "intermedia" ? "white" : ruta?.color_hex }}>
                    {i + 1}
                  </div>
                  {i < paradas.length - 1 && <div className="w-0.5 flex-1 my-1" style={{ background: `${ruta?.color_hex ?? "#E11B22"}40` }} />}
                </div>
                <div className="pb-3 flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{p.nombre}</p>
                      {p.tipo !== "intermedia" && <Badge variant="default" className="text-xs mt-0.5">{p.tipo}</Badge>}
                    </div>
                    <p className="text-xs text-muted">\u2191 {p.hora_salida}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
