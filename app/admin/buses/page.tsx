"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import type { Bus } from "@/lib/types";
import { Bus as BusIcon, Wrench, XCircle, CheckCircle2 } from "lucide-react";

const ESTADO_COLORS: Record<string, "success" | "warning" | "error"> = {
  activo: "success", mantenimiento: "warning", inactivo: "error"
};
const ESTADO_ICONS: Record<string, typeof CheckCircle2> = {
  activo: CheckCircle2, mantenimiento: Wrench, inactivo: XCircle
};

export default function AdminBusesPage() {
  const [buses, setBuses] = useState<Bus[]>([]);

  useEffect(() => { db.getBuses().then(setBuses); }, []);

  return (
    <AppShell role="admin">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">Flota</p>
          <h1 className="font-display text-3xl">Buses</h1>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(["activo","mantenimiento","inactivo"] as const).map((estado) => {
            const count = buses.filter((b) => b.estado === estado).length;
            return (
              <Card key={estado}>
                <CardBody className="text-center py-4">
                  <p className={`font-display text-3xl text-state-${estado === "activo" ? "ok" : estado === "mantenimiento" ? "warn" : "error"}`}>{count}</p>
                  <p className="text-xs text-muted mt-1 capitalize">{estado}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <div className="space-y-2">
          {buses.map((b) => {
            const Icon = ESTADO_ICONS[b.estado] ?? BusIcon;
            const variant = ESTADO_COLORS[b.estado] ?? "default";
            return (
              <Card key={b.id_bus}>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                      <BusIcon className="w-5 h-5 text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium font-mono">{b.placa}</p>
                        <Badge variant={variant as any}>
                          <Icon className="w-3.5 h-3.5" />{b.estado.replace("_"," ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted">{b.modelo} · {b.capacidad} asientos</p>
                    </div>
                    <div className="text-right text-xs text-muted">
                      <span className={b.estado === "activo" ? "text-state-ok" : "text-muted"}>
                        {b.capacidad} asientos
                      </span>
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
