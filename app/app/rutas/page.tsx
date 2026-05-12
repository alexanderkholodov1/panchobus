"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import type { Parada, Ruta } from "@/lib/types";
import { MapPin, Search, Clock, ChevronRight, Bus } from "lucide-react";

const DIA_LABELS: Record<string, string> = {
  L: "Lun", M: "Mar", X: "Mié", J: "Jue", V: "Vie", S: "Sáb", D: "Dom"
};

export default function RutasPage() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "activa" | "suspendida">("todas");

  useEffect(() => {
    Promise.all([db.getRutas(), db.getAllParadas()]).then(([r, p]) => {
      setRutas(r);
      setParadas(p);
    });
  }, []);

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();

    // Build a map: id_ruta → set of parada names that match query
    const rutasConParadaCoincidente = query
      ? new Set(
          paradas
            .filter((p) => p.nombre.toLowerCase().includes(query))
            .map((p) => p.id_ruta)
        )
      : null;

    return rutas.filter((r) => {
      const matchQ =
        !query ||
        r.nombre.toLowerCase().includes(query) ||
        r.codigo.toLowerCase().includes(query) ||
        r.descripcion.toLowerCase().includes(query) ||
        (rutasConParadaCoincidente?.has(r.id_ruta) ?? false);
      const matchF = filtro === "todas" || r.estado === filtro;
      return matchQ && matchF;
    });
  }, [rutas, paradas, q, filtro]);

  // Find matching stop names for a given ruta (for search hint)
  const getMatchingParadas = (idRuta: number): string[] => {
    if (!q.trim()) return [];
    const query = q.toLowerCase();
    return paradas
      .filter((p) => p.id_ruta === idRuta && p.nombre.toLowerCase().includes(query))
      .map((p) => p.nombre)
      .slice(0, 2);
  };

  return (
    <AppShell role="estudiante">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">Explorar</p>
          <h1 className="font-display text-3xl sm:text-4xl">Rutas</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Buscar por nombre, código, barrio o parada…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(["todas", "activa", "suspendida"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filtro === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface border border-border hover:bg-surface-2"
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? "ruta" : "rutas"} encontradas
          {q.trim() && <span className="ml-1">para &ldquo;{q}&rdquo;</span>}
        </p>

        <div className="space-y-3">
          {filtered.map((r) => {
            const matchingParadas = getMatchingParadas(r.id_ruta);
            return (
              <Link key={r.id_ruta} href={`/app/rutas/${r.id_ruta}`}>
                <Card className="hover:shadow-card-lg transition-all group overflow-hidden cursor-pointer">
                  <div className="h-1" style={{ background: r.color_hex }} />
                  <CardBody>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: r.color_hex }}>
                        {r.codigo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display text-lg leading-tight">{r.nombre}</span>
                          {r.estado !== "activa" && <Badge variant="warning">{r.estado}</Badge>}
                        </div>
                        <p className="text-sm text-muted line-clamp-1 mb-2">{r.descripcion}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{r.numero_paradas} paradas</span>
                          <span className="flex items-center gap-1"><Bus className="w-3.5 h-3.5" />{r.numero_asientos} asientos</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r.dias_operacion.map((d) => DIA_LABELS[d] ?? d).join(" · ")}</span>
                        </div>
                        {/* Show matching stop names as search hint */}
                        {matchingParadas.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: r.color_hex }}>
                            <MapPin className="w-3 h-3" />
                            <span>Parada: {matchingParadas.join(", ")}</span>
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
              <p className="font-medium">Sin resultados</p>
              <p className="text-sm mt-1">Intenta con otro nombre de ruta o parada.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
