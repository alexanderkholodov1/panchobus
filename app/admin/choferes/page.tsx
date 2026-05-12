"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import type { Asignacion, Ruta, Usuario } from "@/lib/types";
import { Phone, Mail, Route } from "lucide-react";

export default function AdminChoferesPage() {
  const [choferes, setChoferes] = useState<Usuario[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);

  useEffect(() => {
    Promise.all([db.getUsuarios(), db.getRutas(), db.getAsignaciones()])
      .then(([u,r,a]) => {
        setChoferes(u.filter((x) => x.rol === "chofer"));
        setRutas(r);
        setAsignaciones(a);
      });
  }, []);

  const today = new Date().toISOString().slice(0,10);

  return (
    <AppShell role="admin">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">Personal</p>
          <h1 className="font-display text-3xl">Choferes</h1>
        </div>

        <div className="space-y-3">
          {choferes.map((c) => {
            const asgHoy = asignaciones.find((a) => a.id_chofer === c.id_usuario && a.fecha === today);
            const rutaHoy = rutas.find((r) => r.id_ruta === asgHoy?.id_ruta);
            const rutaPref = rutas.find((r) => r.id_ruta === c.id_ruta);
            return (
              <Card key={c.id_usuario}>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-lg shrink-0">
                      {c.nombre.split(" ").slice(0,2).map((n)=>n[0]).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-display text-lg">{c.nombre}</p>
                        <Badge variant={c.estado==="activo"?"success":"warning"}>{c.estado}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3"/>{c.correo_electronico}</span>
                        {c.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{c.telefono}</span>}
                        {rutaPref && <span className="flex items-center gap-1"><Route className="w-3 h-3"/>Ruta pref: {rutaPref.codigo}</span>}
                      </div>
                      {asgHoy && rutaHoy && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: rutaHoy.color_hex }} />
                          <span className="text-xs font-medium" style={{ color: rutaHoy.color_hex }}>
                            Hoy: {rutaHoy.codigo} · {rutaHoy.nombre.split("—")[1]?.trim()??rutaHoy.nombre} · Salida {asgHoy.hora_salida}
                          </span>
                          <Badge variant={asgHoy.estado==="en_curso"?"success":"info"}>{asgHoy.estado}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
