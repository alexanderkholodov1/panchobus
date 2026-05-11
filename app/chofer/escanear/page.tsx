"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { toast } from "@/components/ui/toaster";
import type { Reserva } from "@/lib/types";
import { Camera, QrCode, CheckCircle2, XCircle, AlertCircle, Search } from "lucide-react";

type ScanResult = { ok: boolean; reserva?: Reserva; message: string };

export default function ChoferEscanearPage() {
  const { user } = useSession();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const scan = async () => {
    if (!token.trim() || !user) return;
    setLoading(true);
    setResult(null);
    const r = await db.scanQR(token.trim(), user.id_usuario);
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
  };

  return (
    <AppShell role="chofer">
      <div className="max-w-sm mx-auto px-4 sm:px-6 py-8 space-y-6 text-center">
        <div>
          <p className="text-sm text-muted mb-1">Abordaje</p>
          <h1 className="font-display text-3xl">Escanear QR</h1>
        </div>

        {/* Camera placeholder */}
        <Card className="overflow-hidden">
          <div className="aspect-square bg-[#0F0E0E] flex flex-col items-center justify-center gap-4 relative">
            <div className="absolute inset-8 border-2 border-white/20 rounded-2xl" />
            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-xl" />
            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-xl" />
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-xl" />
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-xl" />
            <Camera className="w-12 h-12 text-white/30" />
            <p className="text-white/50 text-sm px-8">
              Apunta la cámara al QR del pasajero
            </p>
            <p className="text-white/30 text-xs">
              (Cámara activa en versión PWA instalada)
            </p>
          </div>
        </Card>

        {/* Manual input */}
        <div className="space-y-3">
          <p className="text-sm text-muted">O ingresa el código manualmente</p>
          <div>
            <div className="flex gap-2">
              <Input
                placeholder="DEMO-QR-asg-1-demo-student-x7k2"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scan()}
                className="font-mono text-xs"
              />
              <Button loading={loading} onClick={scan} disabled={!token.trim()}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted mt-1.5">
              Demo: usa el token <span className="font-mono">DEMO-QR-asg-1-demo-student-x7k2</span>
            </p>
          </div>
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
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
