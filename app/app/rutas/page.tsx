"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { localHHMM, localISODate } from "@/lib/utils";
import type { Asignacion, Parada, Ruta } from "@/lib/types";
import { MapPin, Search, Clock, ChevronRight, Bus } from "lucide-react";

function desaturateHex(hex: string, satPct = 15): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  const ns = satPct / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q2 = l < 0.5 ? l * (1 + ns) : l + ns - l * ns;
  const p2 = 2 * l - q2;
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(hue2rgb(p2, q2, h + 1/3))}${toHex(hue2rgb(p2, q2, h))}${toHex(hue2rgb(p2, q2, h - 1/3))}`;
}

export default function RutasPage() {
  const { t, localized } = useI18n();
  const T = t.student.routes;
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "activa" | "suspendida">("todas");

  const today = localISODate();
  const nowTime = localHHMM();

  useEffect(() => {
    Promise.all([db.getRutas(), db.getAllParadas(), db.getAsignaciones()]).then(([r, p, a]) => {
      setRutas(r);
      setParadas(p);
      setAsignaciones(a.filter((x) => x.fecha === today));
    });
  }, [today]);

  // A route is "done for today" only when every one of today's departures has finished.
  const isRoutePast = (idRuta: number): boolean => {
    const asgs = asignaciones.filter((a) => a.id_ruta === idRuta);
    if (asgs.length === 0) return false;
    return asgs.every((a) => a.estado === "completada" || a.estado === "cancelada" || a.hora_regreso < nowTime);
  };

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    const rutasConParadaCoincidente = query
      ? new Set(paradas.filter((p) => p.nombre.toLowerCase().includes(query)).map((p) => p.id_ruta))
      : null;
    return rutas.filter((r) => {
      const matchQ = !query || r.nombre.toLowerCase().includes(query) || r.codigo.toLowerCase().includes(query) || localized(r, "descripcion").toLowerCase().includes(query) || (rutasConParadaCoincidente?.has(r.id_ruta) ?? false);
      const matchF = filtro === "todas" || r.estado === filtro;
      return matchQ && matchF;
    });
  }, [rutas, paradas, q, filtro, localized]);

  const getMatchingParadas = (idRuta: number): string[] => {
    if (!q.trim()) return [];
    const query = q.toLowerCase();
    return paradas.filter((p) => p.id_ruta === idRuta && p.nombre.toLowerCase().includes(query)).map((p) => p.nombre).slice(0, 2);
  };

  return (
    <AppShell role="estudiante">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">{T.kicker}</p>
          <h1 className="font-display text-3xl sm:text-4xl">{T.title}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input type="search" aria-label={T.searchPlaceholder} className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder={T.searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {(["todas", "activa", "suspendida"] as const).map((f) => (
              <button key={f} aria-pressed={filtro === f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtro === f ? "bg-primary text-primary-foreground" : "bg-surface border border-border hover:bg-surface-2"}`}>
                {f === "todas" ? T.filterAll : f === "activa" ? T.filterActive : T.filterSuspended}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted" aria-live="polite">{T.found(filtered.length)}{q.trim() && <span className="ml-1">{T.foundFor(q.trim())}</span>}</p>
        <div className="space-y-3">
          {filtered.map((r) => {
            const matchingParadas = getMatchingParadas(r.id_ruta);
            const past = isRoutePast(r.id_ruta);
            const displayColor = past ? desaturateHex(r.color_hex) : r.color_hex;
            return (
              <Link key={r.id_ruta} href={`/app/rutas/${r.id_ruta}`} className="block">
                <Card className={`hover:shadow-card-lg transition-all group overflow-hidden cursor-pointer${past ? " opacity-60" : ""}`}>
                  <div className="h-1" style={{ background: displayColor }} />
                  <CardBody>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: displayColor }}>
                        {r.codigo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-display text-lg leading-tight">{r.nombre}</span>
                          {r.estado !== "activa" && <StatusBadge kind="route" value={r.estado} />}
                          {past && <Badge variant="default">{T.doneToday}</Badge>}
                        </div>
                        <p className="text-sm text-muted line-clamp-1 mb-2">{localized(r, "descripcion")}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{t.common.stops(r.numero_paradas)}</span>
                          <span className="flex items-center gap-1"><Bus className="w-3.5 h-3.5" />{t.common.seats(r.numero_asientos)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r.dias_operacion.map((d) => t.days[d as keyof typeof t.days] ?? d).join(" · ")}</span>
                        </div>
                        {matchingParadas.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: displayColor }}>
                            <MapPin className="w-3 h-3" />
                            <span>{T.stopMatch(matchingParadas.join(", "))}</span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted">
              <Bus className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{T.noResults}</p>
              <p className="text-sm mt-1">{T.noResultsText}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
