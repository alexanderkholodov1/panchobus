"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { toast } from "@/components/ui/toaster";
import type { Reserva } from "@/lib/types";
import { Camera, CameraOff, QrCode, CheckCircle2, XCircle, Search, AlertCircle } from "lucide-react";

type ScanResult = { ok: boolean; reserva?: Reserva; message: string };

// Load jsQR library from CDN (free, no API key required)
function loadJsQR(): Promise<(data: Uint8ClampedArray, width: number, height: number) => { data: string } | null> {
  return new Promise((resolve, reject) => {
    if ((window as any).jsQR) { resolve((window as any).jsQR); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    script.onload = () => resolve((window as any).jsQR);
    script.onerror = () => reject(new Error("No se pudo cargar jsQR"));
    document.head.appendChild(script);
  });
}

export default function ChoferEscanearPage() {
  const { user } = useSession();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraSupported] = useState(() => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const jsQRRef = useRef<((d: Uint8ClampedArray, w: number, h: number) => { data: string } | null) | null>(null);

  const processScan = useCallback(async (qrToken: string) => {
    if (!user) return;
    setLoading(true);
    setResult(null);

    const r = await db.scanQR(qrToken, user.id_usuario);
    if (!r) {
      setResult({ ok: false, message: "QR no encontrado. Verifica que el código es correcto." });
      toast({ title: "QR inválido", variant: "error" });
    } else if (r.estado === "usada" && r.qr_escaneado_por !== user.id_usuario) {
      setResult({ ok: false, reserva: r, message: "Este QR ya fue escaneado anteriormente." });
      toast({ title: "QR ya usado", variant: "error" });
    } else {
      setResult({ ok: true, reserva: r, message: "¡Abordaje confirmado!" });
      toast({ title: "Abordaje confirmado", variant: "success" });
      setToken("");
    }
    setLoading(false);
    stopCamera();
  }, [user]);

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
    const code = (jsQR as any)(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code?.data) {
      processScan(code.data);
      return; // Don't continue rAF — camera will be stopped after processScan
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [processScan]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setResult(null);

    try {
      jsQRRef.current = await loadJsQR();
    } catch {
      setCameraError("No se pudo cargar el escáner de QR.");
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
    } catch (err: any) {
      const msg =
        err.name === "NotAllowedError" ? "Permiso de cámara denegado." :
        err.name === "NotFoundError" ? "No se encontró cámara en este dispositivo." :
        "No se pudo acceder a la cámara.";
      setCameraError(msg);
    }
  };

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const scanManual = async () => {
    if (!token.trim() || !user) return;
    await processScan(token.trim());
  };

  return (
    <AppShell role="chofer">
      <div className="max-w-sm mx-auto px-4 sm:px-6 py-8 space-y-6 text-center">
        <div>
          <p className="text-sm text-muted mb-1">Abordaje</p>
          <h1 className="font-display text-3xl">Escanear QR</h1>
        </div>

        {/* Camera viewfinder */}
        <Card className="overflow-hidden">
          <div className="aspect-square bg-[#0F0E0E] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Decorative corners */}
            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-xl z-10 pointer-events-none" />
            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-xl z-10 pointer-events-none" />
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-xl z-10 pointer-events-none" />
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-xl z-10 pointer-events-none" />

            {/* Scanning line animation */}
            {cameraActive && (
              <div className="absolute left-10 right-10 h-0.5 bg-primary/70 z-10 pointer-events-none animate-scan-line" />
            )}

            {/* Video element */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? "opacity-100" : "opacity-0"}`}
              playsInline
              muted
            />
            {/* Hidden canvas for QR processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Idle / error state */}
            {!cameraActive && (
              <div className="flex flex-col items-center gap-3 z-10 px-8">
                <Camera className="w-12 h-12 text-white/30" />
                {cameraError ? (
                  <>
                    <p className="text-state-error text-sm">{cameraError}</p>
                    {!cameraSupported && (
                      <p className="text-white/30 text-xs">Tu navegador no soporta acceso a cámara.</p>
                    )}
                  </>
                ) : (
                  <p className="text-white/50 text-sm">
                    {cameraSupported
                      ? "Presiona \"Activar cámara\" para escanear"
                      : "Cámara no disponible — usa el input manual"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Camera controls */}
          {cameraSupported && (
            <div className="p-3 border-t border-border">
              {cameraActive ? (
                <Button variant="outline" className="w-full" onClick={stopCamera} size="sm">
                  <CameraOff className="w-4 h-4" /> Detener cámara
                </Button>
              ) : (
                <Button className="w-full" onClick={startCamera} size="sm">
                  <Camera className="w-4 h-4" /> Activar cámara
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Manual input fallback */}
        <div className="space-y-3 text-left">
          <p className="text-sm text-muted text-center">O ingresa el código manualmente</p>
          <div className="flex gap-2">
            <Input
              placeholder="DEMO-QR-asg-1-demo-student-x7k2"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scanManual()}
              className="font-mono text-xs"
            />
            <Button loading={loading} onClick={scanManual} disabled={!token.trim()}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted">
            Demo: usa <span className="font-mono">DEMO-QR-asg-1-demo-student-x7k2</span>
          </p>
        </div>

        {/* Result */}
        {result && (
          <Card className={`overflow-hidden border-2 ${result.ok ? "border-state-ok" : "border-state-error"}`}>
            <CardBody className="space-y-3">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                result.ok ? "bg-state-ok/10" : "bg-state-error/10"
              }`}>
                {result.ok
                  ? <CheckCircle2 className="w-8 h-8 text-state-ok" />
                  : <XCircle className="w-8 h-8 text-state-error" />
                }
              </div>
              <p className={`font-display text-xl ${result.ok ? "text-state-ok" : "text-state-error"}`}>
                {result.message}
              </p>
              {result.reserva && (
                <div className="text-sm text-muted space-y-1">
                  <p>Estado: <Badge variant={result.ok ? "success" : "error"}>{result.reserva.estado}</Badge></p>
                  {result.reserva.qr_escaneado_at && (
                    <p>Escaneado: {new Date(result.reserva.qr_escaneado_at).toLocaleTimeString("es-EC")}</p>
                  )}
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setResult(null); setToken(""); }}>
                Escanear otro
              </Button>
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
