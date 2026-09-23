"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { db, type ScanOutcome } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { useI18n } from "@/lib/i18n";
import { pickDriverTrip } from "@/lib/trips";
import { localISODate } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import type { Asignacion, Reserva, Ruta, Usuario } from "@/lib/types";
import { Camera, CameraOff, CheckCircle2, XCircle, Search } from "lucide-react";

type JsQR = (data: Uint8ClampedArray, width: number, height: number, opts?: { inversionAttempts: string }) => { data: string } | null;

// jsQR is loaded on demand from a CDN (free, no API key).
function loadJsQR(): Promise<JsQR> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { jsQR?: JsQR };
    if (w.jsQR) { resolve(w.jsQR); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    script.onload = () => (w.jsQR ? resolve(w.jsQR) : reject(new Error("jsQR")));
    script.onerror = () => reject(new Error("jsQR"));
    document.head.appendChild(script);
  });
}

export default function ChoferEscanearPage() {
  const { user } = useSession();
  const { t, fmtDate, fmtTime } = useI18n();
  const S = t.driver.scan;
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanOutcome | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [trip, setTrip] = useState<Asignacion | null>(null);
  const [samples, setSamples] = useState<Reserva[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const jsQRRef = useRef<JsQR | null>(null);

  useEffect(() => { setCameraSupported(!!navigator.mediaDevices?.getUserMedia); }, []);

  const loadContext = useCallback(async () => {
    if (!user) return;
    const [mine, u, r, all] = await Promise.all([db.getAsignacionesByChofer(user.id_usuario), db.getUsuarios(), db.getRutas(), db.getAsignaciones()]);
    const { trip: current } = pickDriverTrip(mine, localISODate());
    setTrip(current);
    setUsuarios(u);
    setRutas(r);
    setAsignaciones(all);
    if (current) {
      const res = await db.getReservasByAsignacion(current.id_asignacion);
      setSamples(res.filter((x) => x.estado === "confirmada").slice(0, 4));
    }
  }, [user]);

  useEffect(() => { loadContext(); }, [loadContext]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const processScan = useCallback(async (qrToken: string) => {
    if (!user) return;
    setLoading(true);
    setResult(null);
    const outcome = await db.scanQR(qrToken, user.id_usuario);
    setResult(outcome);
    if (outcome.status === "ok") {
      toast({ title: S.ok, variant: "success" });
      setToken("");
    } else {
      toast({ title: outcome.status === "not_found" ? S.notFound : outcome.status === "already_used" ? S.used : outcome.status === "waitlisted" ? S.waitlisted : S.cancelled, variant: "error" });
    }
    setLoading(false);
    stopCamera();
    loadContext();
  }, [user, S, stopCamera, loadContext]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const jsQR = jsQRRef.current;
    if (!video || !canvas || !jsQR || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) { rafRef.current = requestAnimationFrame(scanFrame); return; }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
    if (code?.data) {
      processScan(code.data);
      return;
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [processScan]);

  const startCamera = async () => {
    setCameraError(null);
    setResult(null);
    try {
      jsQRRef.current = await loadJsQR();
    } catch {
      setCameraError(S.loadError);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : "";
      setCameraError(name === "NotAllowedError" ? S.camDenied : name === "NotFoundError" ? S.camNotFound : S.camError);
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const scanManual = async () => {
    if (!token.trim() || !user) return;
    await processScan(token.trim());
  };

  const reserva = result && result.status !== "not_found" ? result.reserva : null;
  const resAsg = reserva ? asignaciones.find((a) => a.id_asignacion === reserva.id_asignacion) : undefined;
  const resRuta = resAsg ? rutas.find((r) => r.id_ruta === resAsg.id_ruta) : undefined;
  const message = result
    ? result.status === "ok" ? S.ok
      : result.status === "already_used" ? S.used
      : result.status === "waitlisted" ? S.waitlisted
      : result.status === "cancelled" ? S.cancelled
      : S.notFound
    : "";
  const ok = result?.status === "ok";

  return (
    <AppShell role="chofer">
      <div className="max-w-sm mx-auto px-4 sm:px-6 py-8 space-y-6 text-center">
        <div>
          <p className="text-sm text-muted mb-1">{S.kicker}</p>
          <h1 className="font-display text-3xl">{S.title}</h1>
        </div>

        <Card className="overflow-hidden">
          <div className="aspect-square bg-[#0F0E0E] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-xl z-10 pointer-events-none" />
            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-xl z-10 pointer-events-none" />
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-xl z-10 pointer-events-none" />
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-xl z-10 pointer-events-none" />
            {cameraActive && <div className="absolute left-10 right-10 h-0.5 bg-primary/70 z-10 pointer-events-none animate-scan-line" />}
            <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? "opacity-100" : "opacity-0"}`} playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {!cameraActive && (
              <div className="flex flex-col items-center gap-3 z-10 px-8">
                <Camera className="w-12 h-12 text-white/30" />
                {cameraError ? (
                  <>
                    <p className="text-state-error text-sm" role="alert">{cameraError}</p>
                    {!cameraSupported && <p className="text-white/40 text-xs">{S.unsupported}</p>}
                  </>
                ) : (
                  <p className="text-white/60 text-sm">{cameraSupported ? S.idle : S.noCamera}</p>
                )}
              </div>
            )}
          </div>
          {cameraSupported && (
            <div className="p-3 border-t border-border">
              {cameraActive ? (
                <Button variant="outline" className="w-full" onClick={stopCamera} size="sm">
                  <CameraOff className="w-4 h-4" /> {S.stopCamera}
                </Button>
              ) : (
                <Button className="w-full" onClick={startCamera} size="sm">
                  <Camera className="w-4 h-4" /> {S.startCamera}
                </Button>
              )}
            </div>
          )}
        </Card>

        <div className="space-y-3 text-left">
          <p className="text-sm text-muted text-center">{S.manual}</p>
          <Label htmlFor="qr-manual" className="sr-only">{S.manualLabel}</Label>
          <div className="flex gap-2">
            <Input
              id="qr-manual"
              placeholder="PB-000-XXXX"
              value={token}
              autoCapitalize="characters"
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scanManual()}
              className="font-mono text-xs"
            />
            <Button loading={loading} onClick={scanManual} disabled={!token.trim()} aria-label={S.validate} title={S.validate}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          {db.isDemo() && samples.length > 0 && trip && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted">{S.demoHint}</p>
              <div className="flex flex-wrap gap-1.5">
                {samples.map((s) => (
                  <button key={s.id_reserva} type="button" onClick={() => setToken(s.qr_token)}
                    className="px-2 py-1 rounded-md bg-surface-2 border border-border text-[11px] font-mono hover:border-primary transition-colors">
                    {s.qr_token}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {result && (
          <Card className={`overflow-hidden border-2 ${ok ? "border-state-ok" : "border-state-error"}`} role="status" aria-live="polite">
            <CardBody className="space-y-3">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${ok ? "bg-state-ok/10" : "bg-state-error/10"}`}>
                {ok ? <CheckCircle2 className="w-8 h-8 text-state-ok" /> : <XCircle className="w-8 h-8 text-state-error" />}
              </div>
              <p className={`font-display text-xl ${ok ? "text-state-ok" : "text-state-error"}`}>{message}</p>
              {reserva && (
                <dl className="text-sm text-muted space-y-1.5 text-left bg-surface-2 rounded-lg px-3 py-2">
                  <div className="flex justify-between gap-2"><dt>{S.passenger}</dt><dd className="font-medium text-foreground">{usuarios.find((u) => u.id_usuario === reserva.id_usuario)?.nombre ?? t.common.unknown}</dd></div>
                  {resAsg && (
                    <div className="flex justify-between gap-2"><dt>{S.trip}</dt><dd className="font-medium text-foreground text-right">{resRuta?.codigo} · {fmtDate(resAsg.fecha, { day: "numeric", month: "short" })} · {resAsg.hora_salida}</dd></div>
                  )}
                  <div className="flex justify-between gap-2 items-center"><dt>{t.common.status}</dt><dd><StatusBadge kind="reservation" value={reserva.estado} /></dd></div>
                  {reserva.qr_escaneado_at && (
                    <div className="flex justify-between gap-2"><dt>{S.scannedAt}</dt><dd>{fmtTime(reserva.qr_escaneado_at)}</dd></div>
                  )}
                </dl>
              )}
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setResult(null); setToken(""); }}>
                {S.scanAnother}
              </Button>
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
