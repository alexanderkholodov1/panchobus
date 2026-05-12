"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { toast } from "@/components/ui/toaster";
import type { Asignacion, Ruta } from "@/lib/types";
import { CalendarCheck, Clock, Bus, ArrowRight, ArrowLeft, CheckCircle2, Hourglass, MapPin } from "lucide-react";

type Step = "ruta" | "fecha" | "confirmar" | "exito";

function CuposPill({ reservados, total }: { reservados: number; total: number }) {
  const libre = total - reservados;
  const pct = (reservados / total) * 100;
  const color = pct >= 90 ? "text-state-error" : pct >= 70 ? "text-state-warn" : "text-state-ok";
  return <span className={`text-xs font-medium ${color}`}>{libre > 0 ? `${libre} cupos` : "Lista espera"}</span>;
}

function ReservarContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { user } = useSession();

  const [step, setStep] = useState<Step>("ruta");
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [selectedRuta, setSelectedRuta] = useState<number | null>(null);
  const [selectedAsignacion, setSelectedAsignacion] = useState<Asignacion | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([db.getRutas(), db.getAsignaciones()]).then(([r, a]) => {
      setRutas(r.filter((x) => x.estado === "activa"));
      const hoy = new Date().toISOString().slice(0, 10);
      setAsignaciones(a.filter((x) => x.fecha >= hoy && x.estado !== "completada"));
      const preRuta = search.get("ruta");
      const preAsg = search.get("asignacion");
      if (preRuta) { setSelectedRuta(Number(preRuta)); setStep("fecha"); }
      if (preAsg) {
        const found = a.find((x) => x.id_asignacion === Number(preAsg));
        if (found) { setSelectedRuta(found.id_ruta); setSelectedAsignacion(found); setStep("confirmar"); }
      }
    });
  }, [search]);

  const rutaSelObj = rutas.find((r) => r.id_ruta === selectedRuta);
  const asignacionesDeLaRuta = useMemo(
    () => asignaciones.filter((a) => a.id_ruta === selectedRuta).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [asignaciones, selectedRuta]
  );

  const onConfirmar = async () => {
    if (!user || !selectedAsignacion) return;
    setLoading(true);
    try {
      const r = await db.createReserva(user.id_usuario, selectedAsignacion.id_asignacion, observaciones || undefined);
      setQrToken(r.qr_token);
      setStep("exito");
      toast({ title: "¡Reserva confirmada!", variant: "success" });
    } catch (e: any) {
      toast({ title: "Error al reservar", description: e.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ["ruta", "fecha", "confirmar"];
  const stepIdx = STEPS.indexOf(step);

  return (
    <AppShell role="estudiante">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {step !== "exito" && (
          <>
            <div>
              <p className="text-sm text-muted mb-1">Nuevo viaje</p>
              <h1 className="font-display text-3xl">Reservar cupo</h1>
            </div>
            <div className="flex items-center gap-2">
              {["Ruta", "Horario", "Confirmar"].map((label, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    i < stepIdx ? "bg-primary text-white" :
                    i === stepIdx ? "bg-primary text-white ring-4 ring-primary/20" : "bg-surface-2 text-muted"
                  }`}>
                    {i < stepIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${i === stepIdx ? "text-foreground font-medium" : "text-muted"}`}>{label}</span>
                  {i < 2 && <div className={`flex-1 h-0.5 ${i < stepIdx ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>
          </>
        )}

        {step === "ruta" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Selecciona tu ruta de interés</p>
            {rutas.map((r) => (
              <button key={r.id_ruta} className={`w-full text-left transition-all rounded-2xl border-2 overflow-hidden ${selectedRuta === r.id_ruta ? "border-primary" : "border-border hover:border-primary/40"}`}
                onClick={() => setSelectedRuta(r.id_ruta)}>
                <div className="h-1" style={{ background: r.color_hex }} />
                <div className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: r.color_hex }}>{r.codigo}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-tight">{r.nombre}</p>
                    <p className="text-xs text-muted mt-0.5">{r.numero_paradas} paradas · {r.dias_operacion.join(" ")}</p>
                  </div>
                  {selectedRuta === r.id_ruta && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </div>
              </button>
            ))}
            <Button className="w-full mt-2" disabled={!selectedRuta} onClick={() => setStep("fecha")}>
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === "fecha" && (
          <div className="space-y-4">
            <button onClick={() => setStep("ruta")} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Cambiar ruta
            </button>
            {rutaSelObj && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 text-sm">
                <div className="w-4 h-4 rounded" style={{ background: rutaSelObj.color_hex }} />
                <span className="font-medium">{rutaSelObj.codigo} · {rutaSelObj.nombre}</span>
              </div>
            )}
            <p className="text-sm text-muted">Elige fecha y horario disponible</p>
            {asignacionesDeLaRuta.length === 0 ? (
              <Card><CardBody className="text-center py-8 text-muted">
                <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Sin salidas programadas para esta ruta.</p>
              </CardBody></Card>
            ) : (
              <div className="space-y-2">
                {asignacionesDeLaRuta.map((a) => {
                  const libre = a.cupos_disponibles - a.cupos_reservados;
                  const isSel = selectedAsignacion?.id_asignacion === a.id_asignacion;
                  return (
                    <button key={a.id_asignacion}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSel ? "border-primary bg-usfq-red-tint/20" : "border-border hover:border-primary/40"}`}
                      onClick={() => setSelectedAsignacion(a)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{new Date(a.fecha + "T12:00:00").toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })}</p>
                          <p className="text-sm text-muted flex items-center gap-1 mt-0.5"><Clock className="w-3.5 h-3.5" /> Salida {a.hora_salida} · Regreso {a.hora_regreso}</p>
                        </div>
                        <div className="text-right">
                          <CuposPill reservados={a.cupos_reservados} total={a.cupos_disponibles} />
                          {isSel && <CheckCircle2 className="w-5 h-5 text-primary mt-1 ml-auto" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <Button className="w-full" disabled={!selectedAsignacion} onClick={() => setStep("confirmar")}>
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === "confirmar" && selectedAsignacion && rutaSelObj && (
          <div className="space-y-4">
            <button onClick={() => setStep("fecha")} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Cambiar horario
            </button>
            <Card>
              <div className="h-1.5" style={{ background: rutaSelObj.color_hex }} />
              <CardBody className="space-y-4">
                <h2 className="font-display text-xl">Resumen de reserva</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-1.5"><MapPin className="w-4 h-4" />Ruta</span>
                    <span className="font-medium">{rutaSelObj.codigo} · {rutaSelObj.nombre}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-1.5"><CalendarCheck className="w-4 h-4" />Fecha</span>
                    <span className="font-medium">{new Date(selectedAsignacion.fecha + "T12:00:00").toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "long" })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-1.5"><Clock className="w-4 h-4" />Salida</span>
                    <span className="font-medium">{selectedAsignacion.hora_salida}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-1.5"><Bus className="w-4 h-4" />Cupos libres</span>
                    <CuposPill reservados={selectedAsignacion.cupos_reservados} total={selectedAsignacion.cupos_disponibles} />
                  </div>
                </div>
                {selectedAsignacion.cupos_reservados >= selectedAsignacion.cupos_disponibles && (
                  <div className="bg-state-warn/10 text-state-warn px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Hourglass className="w-4 h-4 shrink-0" />Sin cupos disponibles. Entrarás a lista de espera.
                  </div>
                )}
                <div>
                  <Label htmlFor="obs">Observaciones (opcional)</Label>
                  <Input id="obs" placeholder="Ej: viaje de regreso también" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                </div>
              </CardBody>
            </Card>
            <Button className="w-full" size="lg" loading={loading} onClick={onConfirmar}>
              Confirmar reserva <CheckCircle2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === "exito" && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-state-ok/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-state-ok" />
            </div>
            <div>
              <h2 className="font-display text-3xl mb-2">¡Reserva lista!</h2>
              <p className="text-muted text-sm">Tu cupo está asegurado. Muestra el QR al personal de la ruta el día del viaje.</p>
            </div>
            <div className="bg-surface-2 rounded-xl px-4 py-3 text-xs text-muted font-mono break-all">{qrToken}</div>
            <div className="flex flex-col gap-2">
              <Link href="/app/mi-qr"><Button className="w-full" size="lg">Ver mi QR</Button></Link>
              <Link href="/app/mis-reservas"><Button className="w-full" variant="outline">Mis reservas</Button></Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ReservarPage() {
  return (
    <Suspense fallback={null}>
      <ReservarContent />
    </Suspense>
  );
}
