"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { useI18n } from "@/lib/i18n";
import { isBookable } from "@/lib/trips";
import { localHHMM, localISODate, occupancyPct } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import type { Asignacion, Reserva, Ruta } from "@/lib/types";
import { CalendarCheck, Clock, Bus, ArrowRight, ArrowLeft, CheckCircle2, Hourglass, MapPin, AlertCircle } from "lucide-react";

type Step = "ruta" | "fecha" | "confirmar" | "exito";

function CuposPill({ reservados, total }: { reservados: number; total: number }) {
  const { t } = useI18n();
  const libre = total - reservados;
  const pct = occupancyPct(reservados, total);
  const color = pct >= 90 ? "text-state-error" : pct >= 70 ? "text-state-warn" : "text-state-ok";
  return <span className={`text-xs font-medium ${color}`}>{libre > 0 ? t.common.freeSeats(libre) : t.common.waitlist}</span>;
}

function ReservarContent() {
  const search = useSearchParams();
  const { user } = useSession();
  const { t, fmtDate } = useI18n();
  const B = t.student.book;

  const [step, setStep] = useState<Step>("ruta");
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [misActivas, setMisActivas] = useState<Set<number>>(new Set());
  const [selectedRuta, setSelectedRuta] = useState<number | null>(null);
  const [selectedAsignacion, setSelectedAsignacion] = useState<Asignacion | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Reserva | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([db.getRutas(), db.getAsignaciones(), db.getReservasByUsuario(user.id_usuario)]).then(([r, a, mine]) => {
      const activas = r.filter((x) => x.estado === "activa");
      setRutas(activas);
      const today = localISODate();
      const now = localHHMM();
      const bookable = a.filter((x) => isBookable(x, today, now) && activas.some((rt) => rt.id_ruta === x.id_ruta));
      setAsignaciones(bookable);
      setMisActivas(new Set(mine.filter((m) => m.estado === "confirmada" || m.estado === "en_espera").map((m) => m.id_asignacion)));
      const preRuta = search.get("ruta");
      const preAsg = search.get("asignacion");
      if (preAsg) {
        const found = bookable.find((x) => x.id_asignacion === Number(preAsg));
        if (found) {
          setSelectedRuta(found.id_ruta);
          setSelectedAsignacion(found);
          setStep("confirmar");
        } else {
          setNotice(B.unavailable);
        }
      } else if (preRuta && activas.some((rt) => rt.id_ruta === Number(preRuta))) {
        setSelectedRuta(Number(preRuta));
        setStep("fecha");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, user]);

  const rutaSelObj = rutas.find((r) => r.id_ruta === selectedRuta);
  const asignacionesDeLaRuta = useMemo(
    () => asignaciones
      .filter((a) => a.id_ruta === selectedRuta)
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_salida.localeCompare(b.hora_salida)),
    [asignaciones, selectedRuta]
  );

  const onConfirmar = async () => {
    if (!user || !selectedAsignacion) return;
    setLoading(true);
    try {
      const r = await db.createReserva(user.id_usuario, selectedAsignacion.id_asignacion, observaciones.trim() || undefined);
      setResult(r);
      setStep("exito");
      toast({ title: r.estado === "en_espera" ? B.toastWaitlist : B.toastConfirmed, variant: r.estado === "en_espera" ? "warning" : "success" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      toast({ title: B.toastError, description: msg === "DUPLICATE_BOOKING" ? B.errDuplicate : msg, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const STEPS: Step[] = ["ruta", "fecha", "confirmar"];
  const stepIdx = STEPS.indexOf(step);
  const selectedFull = selectedAsignacion ? selectedAsignacion.cupos_reservados >= selectedAsignacion.cupos_disponibles : false;

  return (
    <AppShell role="estudiante">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {step !== "exito" && (
          <>
            <div>
              <p className="text-sm text-muted mb-1">{B.kicker}</p>
              <h1 className="font-display text-3xl">{B.title}</h1>
            </div>
            <ol className="flex items-center gap-2" aria-label={B.title}>
              {B.steps.map((label, i) => (
                <li key={label} className="flex items-center gap-2 flex-1" aria-current={i === stepIdx ? "step" : undefined}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    i < stepIdx ? "bg-primary text-white" :
                    i === stepIdx ? "bg-primary text-white ring-4 ring-primary/20" : "bg-surface-2 text-muted"
                  }`}>
                    {i < stepIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${i === stepIdx ? "text-foreground font-medium" : "text-muted"}`}>{label}</span>
                  {i < 2 && <div className={`flex-1 h-0.5 ${i < stepIdx ? "bg-primary" : "bg-border"}`} />}
                </li>
              ))}
            </ol>
            {notice && (
              <div role="status" className="flex items-center gap-2 bg-state-warn/10 text-state-warn px-3 py-2 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{notice}
              </div>
            )}
          </>
        )}

        {step === "ruta" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">{B.pickRoute}</p>
            {rutas.map((r) => (
              <button key={r.id_ruta} type="button" aria-pressed={selectedRuta === r.id_ruta}
                className={`w-full text-left transition-all rounded-2xl border-2 overflow-hidden ${selectedRuta === r.id_ruta ? "border-primary" : "border-border hover:border-primary/40"}`}
                onClick={() => { setSelectedRuta(r.id_ruta); setSelectedAsignacion(null); }}>
                <div className="h-1" style={{ background: r.color_hex }} />
                <div className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: r.color_hex }}>{r.codigo}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-tight">{r.nombre}</p>
                    <p className="text-xs text-muted mt-0.5">{t.common.stops(r.numero_paradas)} · {r.dias_operacion.map((d) => t.days[d as keyof typeof t.days] ?? d).join(" ")}</p>
                  </div>
                  {selectedRuta === r.id_ruta && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </div>
              </button>
            ))}
            <Button className="w-full mt-2" disabled={!selectedRuta} onClick={() => setStep("fecha")}>
              {t.common.continue} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === "fecha" && (
          <div className="space-y-4">
            <button type="button" onClick={() => setStep("ruta")} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> {B.changeRoute}
            </button>
            {rutaSelObj && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 text-sm">
                <div className="w-4 h-4 rounded" style={{ background: rutaSelObj.color_hex }} />
                <span className="font-medium">{rutaSelObj.codigo} · {rutaSelObj.nombre}</span>
              </div>
            )}
            <p className="text-sm text-muted">{B.pickTrip}</p>
            {asignacionesDeLaRuta.length === 0 ? (
              <Card><CardBody className="text-center py-8 text-muted">
                <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>{B.noTrips}</p>
              </CardBody></Card>
            ) : (
              <div className="space-y-2">
                {asignacionesDeLaRuta.map((a) => {
                  const isSel = selectedAsignacion?.id_asignacion === a.id_asignacion;
                  const alreadyMine = misActivas.has(a.id_asignacion);
                  return (
                    <button key={a.id_asignacion} type="button" disabled={alreadyMine} aria-pressed={isSel}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${isSel ? "border-primary bg-usfq-red-tint/20" : "border-border hover:border-primary/40"}`}
                      onClick={() => setSelectedAsignacion(a)}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium capitalize">{fmtDate(a.fecha)}</p>
                          <p className="text-sm text-muted flex items-center gap-1 mt-0.5"><Clock className="w-3.5 h-3.5" /> {t.common.departureEnd(a.hora_salida, a.hora_regreso)}</p>
                          {alreadyMine && <p className="text-xs text-primary mt-1">{B.errDuplicate}</p>}
                        </div>
                        <div className="text-right shrink-0">
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
              {t.common.continue} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === "confirmar" && selectedAsignacion && rutaSelObj && (
          <div className="space-y-4">
            <button type="button" onClick={() => setStep("fecha")} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> {B.changeTrip}
            </button>
            <Card>
              <div className="h-1.5" style={{ background: rutaSelObj.color_hex }} />
              <CardBody className="space-y-4">
                <h2 className="font-display text-xl">{B.summary}</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted flex items-center gap-1.5"><MapPin className="w-4 h-4" />{t.common.route}</dt>
                    <dd className="font-medium text-right">{rutaSelObj.codigo} · {rutaSelObj.nombre}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted flex items-center gap-1.5"><CalendarCheck className="w-4 h-4" />{t.common.date}</dt>
                    <dd className="font-medium capitalize">{fmtDate(selectedAsignacion.fecha, { weekday: "short", day: "numeric", month: "long" })}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted flex items-center gap-1.5"><Clock className="w-4 h-4" />{t.common.departure}</dt>
                    <dd className="font-medium">{selectedAsignacion.hora_salida}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted flex items-center gap-1.5"><Bus className="w-4 h-4" />{B.freeSeats}</dt>
                    <dd><CuposPill reservados={selectedAsignacion.cupos_reservados} total={selectedAsignacion.cupos_disponibles} /></dd>
                  </div>
                </dl>
                {selectedFull && (
                  <div className="bg-state-warn/10 text-state-warn px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Hourglass className="w-4 h-4 shrink-0" />{B.fullWarning}
                  </div>
                )}
                <div>
                  <Label htmlFor="obs">{B.notes} ({t.common.optional})</Label>
                  <Input id="obs" placeholder={B.notesPlaceholder} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} maxLength={120} />
                </div>
              </CardBody>
            </Card>
            <Button className="w-full" size="lg" loading={loading} onClick={onConfirmar}>
              {selectedFull ? B.joinWaitlist : B.confirm} <CheckCircle2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === "exito" && result && (
          <div className="text-center space-y-6 py-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${result.estado === "en_espera" ? "bg-state-warn/10" : "bg-state-ok/10"}`}>
              {result.estado === "en_espera"
                ? <Hourglass className="w-10 h-10 text-state-warn" />
                : <CheckCircle2 className="w-10 h-10 text-state-ok" />}
            </div>
            <div>
              <h2 className="font-display text-3xl mb-2">{result.estado === "en_espera" ? B.waitlistTitle : B.successTitle}</h2>
              <p className="text-muted text-sm">
                {result.estado === "en_espera" ? B.waitlistText(result.posicion_waitlist ?? 1) : B.successText}
              </p>
            </div>
            <div className="bg-surface-2 rounded-xl px-4 py-3 text-xs text-muted font-mono break-all">{result.qr_token}</div>
            <div className="flex flex-col gap-2">
              <Link href="/app/mi-qr"><Button className="w-full" size="lg">{B.viewQr}</Button></Link>
              <Link href="/app/mis-reservas"><Button className="w-full" variant="outline">{B.myBookings}</Button></Link>
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
