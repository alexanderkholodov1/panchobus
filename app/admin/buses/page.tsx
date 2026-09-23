"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import type { Bus, BusStatus, Ruta } from "@/lib/types";
import { Bus as BusIcon, Wrench, XCircle, CheckCircle2 } from "lucide-react";

const ICONS: Record<BusStatus, typeof CheckCircle2> = { activo: CheckCircle2, mantenimiento: Wrench, inactivo: XCircle };
const COUNT_COLOR: Record<BusStatus, string> = { activo: "text-state-ok", mantenimiento: "text-state-warn", inactivo: "text-state-error" };

export default function AdminBusesPage() {
  const { t } = useI18n();
  const B = t.admin.buses;
  const [buses, setBuses] = useState<Bus[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);

  useEffect(() => {
    Promise.all([db.getBuses(), db.getRutas()]).then(([b, r]) => { setBuses(b); setRutas(r); });
  }, []);

  return (
    <AppShell role="admin">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">{B.kicker}</p>
          <h1 className="font-display text-3xl">{B.title}</h1>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(["activo", "mantenimiento", "inactivo"] as const).map((estado) => (
            <Card key={estado}>
              <CardBody className="text-center py-4">
                <p className={`font-display text-3xl ${COUNT_COLOR[estado]}`}>{buses.filter((b) => b.estado === estado).length}</p>
                <p className="text-xs text-muted mt-1">{t.status.bus[estado]}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          {buses.map((b) => {
            const Icon = ICONS[b.estado] ?? BusIcon;
            const ruta = rutas.find((r) => r.placa_bus === b.placa);
            return (
              <Card key={b.id_bus}>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                      <BusIcon className="w-5 h-5 text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium font-mono">{b.placa}</p>
                        <StatusBadge kind="bus" value={b.estado} icon={<Icon className="w-3.5 h-3.5" />} />
                      </div>
                      <p className="text-sm text-muted">{b.modelo} · {B.capacity(b.capacidad)}</p>
                    </div>
                    <div className="text-right text-xs shrink-0">
                      {ruta ? (
                        <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: ruta.color_hex }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: ruta.color_hex }} />
                          {B.assignedRoute(ruta.codigo)}
                        </span>
                      ) : (
                        <span className="text-muted">{B.noRoute}</span>
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
