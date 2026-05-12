"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import type { Asignacion, Parada, Ruta } from "@/lib/types";
import { MapPin, Search, Clock, ChevronRight, Bus } from "lucide-react";

// Convert hex to HSL, reduce saturation, return as hex
function desaturateHex(hex: string, satPct = 15): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  // Reduce saturation to satPct%
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

const DIA_LABELS: Record<string, string> = {
  L: "Lun", M: "Mar", X: "Mié", J: "Jue", V: "Vie", S: "Sáb", D: "Dom"
};

export default function RutasPage() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "activa" | "suspendida">("todas");

  const today = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toTimeString().slice(0, 5); // "HH:MM"

  useEffect(() => {
    Promise.all([db.getRutas(), db.getAllParadas(), db.getAsignaciones()]).then(([r, p, a]) => {
      setRutas(r);
      setParadas(p);
      setAsignaciones(a.filter((x) => x.fecha === today));
    });
  }, [today]);

  // Returns true if the route's today trip is done (completada or hora_regreso passed)
  const isRoutePast = (idRuta: number): boolean => {
    const asg = asignaciones.find((a) => a.id_ruta === idRuta);
    if (!asg) return false;
    return asg.estado === "completada" || asg.hora_regreso < nowTime;
  };

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
                          {r.estado !== "activa" && <B