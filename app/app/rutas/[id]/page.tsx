"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import type { Asignacion, Parada, Ruta } from "@/lib/types";
import { MapPin, Clock, Bus, User, Phone, CalendarCheck, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

function CuposBar({ reservados, total }: { reservados: number; total: number }) {
  const pct = Math.min(100, Math.round((reservados / total) * 100));
  const color = pct >= 90 ? "#C13030" : pct >= 70 ? "#E89F1F" : "#2A7D4F";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted">{total - reservados} cupos libres</span>
        <span style={{ color }}>{pct}% ocupado</span>
      </div>
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function RutaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);

  useEffect(() => {
    const rid = Number(id);
    Promise.all([db.getRuta(rid), db.getParadasByRuta(rid), db.getAsignacionesByRuta(rid)]).then(([r, p, a]) => {
      if (!r) { router.replace("/app/rutas"); return; }
      setRuta(r);
      setParadas(p);
      setAsignaciones(a.filter((x) => x.fecha >= new Date().toISOString().slice(0, 10)).slice(0, 5));
    });
  }, [id, router]);

  if (!ruta) {
    return (
      <AppShell role="estudiante">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="estudiante">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Link href="/app/rutas" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />Volver a rutas
        </Link>

        <div className="overflow-hidden rounded-2xl" style={{ background: `linear-gradient(135deg, ${ruta.color_hex}, ${ruta.color_hex}CC)` }}>
          <div className="p-6 text-white">
            <Badge className="bg-white/20 border-white/30 text-white mb-3">{ruta.codigo}</Badge>
            <h1 className="font-display text-3xl sm:text-4xl mb-1">{ruta.nombre}</h1>
            <p className="text-white/80 text-sm">{ruta.descripcion}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/90">
              <span className="flex items-center gap-1.5"><Bus className="w-4 h-4" />{ruta.numero_asientos} asientos</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{ruta.numero_paradas} paradas</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{ruta.dias_operacion.join(" · ")}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Badge variant={ruta.estado === "activa" ? "success" : ruta.estado === "suspendida" ? "warning" : "default"}>
            {ruta.estado === "activa" ? <><CheckCircle2 className="w-3.5 h-3.5" /> Activa</> : <><AlertCircle className="w-3.5 h-3.5" /> {ruta.estado}</>}
          </Badge>
          <div className="flex-1" />
          {ruta.estado === "activa" && (
            <Link href={`/app/reservar?ruta=${ruta.id_ruta}`}>
              <Button>Reservar cupo <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          )}
        </div>

        <Card>
          <CardBody className="space-y-3">
            <p className="font-display text-sm uppercase tracking-wider text-muted">Operador</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{ruta.nombre_chofer}</p>
                <p className="text-xs text-muted">Chofer asignado</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Bus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{ruta.placa_bus ?? "Sin asignar"}</p>
                <p className="text-xs text-muted">Placa del bus</p>
              </div>
            </div>
            {ruta.telefono_contacto && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{ruta.telefono_contacto}</p>
                  <p className="text-xs text-muted">Contacto</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <div>
          <h2 className="font-display text-xl mb-3">Paradas ({paradas.length})</h2>
          <div className="space-y-0">
            {paradas.map((p, i) => (
              <div key={p.id_parada} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ borderColor: ruta.color_hex,
                      background: p.tipo !== "intermedia" ? ruta.color_hex : "transparent",
                      color: p.tipo !== "intermedia" ? "white" : ruta.color_hex }}>
                    {i + 1}
                  </div>
                  {i < paradas.length - 1 && <div className="w-0.5 flex-1 my-1" style={{ background: `${ruta.color_hex}40` }} />}
                </div>
                <div className="pb-4 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium leading-tight">{p.nombre}</p>
                      {p.tipo !== "intermedia" && <Badge variant="default" className="text-xs mt-1">{p.tipo === "origen" ? "Origen" : "Destino"}</Badge>}
                    </div>
                    <div className="text-right text-xs text-muted shrink-0">
                      <p>↑ {p.hora_salida}</p>
                      <p>↓ {p.hora_regreso}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {asignaciones.length > 0 && (
          <div>
            <h2 className="font-display text-xl mb-3">Próximas salidas</h2>
            <div className="space-y-3">
              {asignaciones.map((a) => {
                const libre = a.cupos_disponibles - a.cupos_reservados;
                return (
                  <Card key={a.id_asignacion}>
                    <CardBody className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {new Date(a.fecha + "T12:00:00").toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" })}
                          {" "}· {a.hora_salida}
                        </p>
                        <Badge variant={a.estado === "en_curso" ? "success" : a.estado === "completada" ? "default" : "info"}>{a.estado}</Badge>
                      </div>
                      <CuposBar reservados={a.cupos_reservados} total={a.cupos_disponibles} />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted flex items-center gap-1">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          {libre > 0 ? `${libre} cupos disponibles` : "Sin cupos (lista espera)"}
                        </span>
                        {a.estado === "programada" && (
                          <Link href={`/app/reservar?asignacion=${a.id_asignacion}`}>
                            <Button size="sm" variant={libre > 0 ? "default" : "outline"}>
                              {libre > 0 ? "Reservar" : "Lista espera"}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
