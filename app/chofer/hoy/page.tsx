"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import type { Asignacion, Parada, Ruta } from "@/lib/types";
import { Navigation, Clock, MapPin, Bus, Play, CheckCircle2, Calendar } from "lucide-react";
import { toast } from "@/components/ui/toaster";

export default function ChoferHoyPage() {
  const { user } = useSession();
  const [asignacion, setAsignacion] = useState<Asignacion | null>(null);
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [tracking, setTracking] = useState(false);

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

  const iniciarRuta = () => {
    setTracking(true);
    toast({ title: "GPS activo", description: "Enviando ubicación cada 15s", variant: "success" });
    // En producción: navigator.geolocation.watchPosition → POST /api/gps
  };

  const finalizarRuta = () => {
    setTracking(false);
    toast({ title: "Ruta finalizada", variant: "info" });
  };

  if (!asignacion) {
    return (
      <AppShell role="chofer">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 text-center space-y-4">
          <Bus className="w-12 h-12 text-muted mx-auto" />
          <h1 className="font-display text-2xl">Sin asignación para hoy</h1>
          <p className="text-muted text-sm">Consulta con administración si esto es un error.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="chofer">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">Panel del chofer</p>
          <h1 className="font-display text-3xl">Mi ruta de hoy</h1>
        </div>

        {/* Asignación info */}
        <Card className="overflow-hidden">
          {ruta && <div className="h-2" style={{ background: ruta.color_hex }} />}
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={asignacion.estado==="en_curso"?"success":asignacion.estado==="completada"?"default":"info"}>
                {asignacion.estado}
              </Badge>
              {ruta && <Badge variant="info">{ruta.codigo}</Badge>}
            </div>
            <h2 className="font-display text-2xl">{ruta?.nombre ?? `Ruta ${asignacion.id_ruta}`}</h2>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Salida</p>
                  <p className="font-medium">{asignacion.hora_salida}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Regreso</p>
                  <p className="font-medium">{asignacion.hora_regreso}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Paradas</p>
                  <p className="font-medium">{paradas.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Pasajeros</p>
                  <p className="font-medium">{asignacion.cupos_reservados} / {asignacion.cupos_disponibles}</p>
                </div>
              </div>
            </div>

            {/* GPS button */}
            {asignacion.estado !== "completada" && (
              tracking ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-state-ok/10 text-state-ok px-3 py-2 rounded-lg text-sm">
                    <div className="w-2 h-2 rounded-full bg-state-ok animate-pulse" />
                    GPS activo — enviando ubicación en tiempo real
                  </div>
                  <Button variant="outline" className="w-full" onClick={finalizarRuta}>
                    <CheckCircle2 className="w-4 h-4" /> Finalizar ruta
                  </Button>
                </div>
              ) : (
                <Button className="w-full" size="lg" onClick={iniciarRuta}>
                  <Play className="w-4 h-4" /> Iniciar ruta · Activar GPS
                </Button>
              )
            )}
          </CardBody>
        </Card>

        {/* Paradas timeline */}
        <div>
          <h2 className="font-display text-xl mb-3">Paradas ({paradas.length})</h2>
          <div className="space-y-0">
            {paradas.map((p, i) => (
              <div key={p.id_parada} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ borderColor: ruta?.color_hex ?? "#E11B22",
                      background: p.tipo !== "intermedia" ? ruta?.color_hex : "transparent",
                      color: p.tipo !== "intermedia" ? "white" : ruta?.color_hex }}>
                    {i + 1}
                  </div>
                  {i < paradas.length - 1 && (
                    <div className="w-0.5 flex-1 my-1" style={{ background: `${ruta?.color_hex ?? "#E11B22"}40` }} />
                  )}
                </div>
                <div className="pb-3 flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{p.nombre}</p>
                      {p.tipo !== "intermedia" && (
                        <Badge variant="default" className="text-xs mt-0.5">{p.tipo}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted">↑ {p.hora_salida}</p>
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
