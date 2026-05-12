"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import type { Asignacion, Parada, Ruta } from "@/lib/types";
import { MapPin, Clock, Bus, User, Phone, CalendarCheck, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

const IS_SUPABASE =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  const [mapReady, setMapReady] = useState(false);
  const [busLat, setBusLat] = useState<number | null>(null);
  const [busLng, setBusLng] = useState<number | null>(null);
  const busMarkerRef = useRef<any>(null);
  const activeAsignacionId = useRef<number | null>(null);

  useEffect(() => {
    const rid = Number(id);
    Promise.all([db.getRuta(rid), db.getParadasByRuta(rid), db.getAsignacionesByRuta(rid)]).then(([r, p, a]) => {
      if (!r) { router.replace("/app/rutas"); return; }
      setRuta(r);
      setParadas(p);
      const today = new Date().toISOString().slice(0, 10);
      setAsignaciones(a.filter((x) => x.fecha >= today).slice(0, 5));
      const active = a.find((x) => x.fecha === today && x.estado === "en_curso");
      activeAsignacionId.current = active?.id_asignacion ?? null;
    });
  }, [id, router]);

  useEffect(() => {
    if (!ruta || paradas.length === 0) return;
    const validParadas = paradas.filter((p) => p.latitud && p.longitud);
    if (validParadas.length === 0) return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = (color: string, stops: Parada[]) => {
      const L = (window as any).L;
      const mapEl = document.getElementById("route-map");
      if (!mapEl) return;
      if ((mapEl as any)._leaflet_id) {
        const prior = (window as any)._panchoMap;
        if (prior) { prior.remove(); (window as any)._panchoMap = null; }
      }
      const center: [number, number] = [stops[0].latitud!, stops[0].longitud!];
      const map = L.map("route-map", { zoomControl: true, scrollWheelZoom: false }).setView(center, 13);
      (window as any)._panchoMap = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "\u00a9 <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>", maxZoom: 19,
      }).addTo(map);
      const latlngs: [number, number][] = stops.map((p) => [p.latitud!, p.longitud!]);
      L.polyline(latlngs, { color, weight: 5, opacity: 0.8 }).addTo(map);
      stops.forEach((parada, i) => {
        const isEndpoint = parada.tipo !== "intermedia";
        const html = `<div style="width:28px;height:28px;border-radius:50%;background:${isEndpoint ? color : "#ffffff"};border:3px solid ${color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${isEndpoint ? "#ffffff" : color};box-shadow:0 2px 8px rgba(0,0,0,0.3);">${i + 1}</div>`;
        const icon = L.divIcon({ html, className: "", iconSize: [28, 28], iconAnchor: [14, 14] });
        L.marker([parada.latitud!, parada.longitud!], { icon }).addTo(map)
          .bindPopup(`<b>${parada.nombre}</b><br/><small>${parada.tipo} &nbsp;\u00b7&nbsp; \u2191 ${parada.hora_salida}</small>`);
      });
      map.fitBounds(L.latLngBounds(latlngs), { padding: [32, 32] });
      setMapReady(true);
    };

    if ((window as any).L) {
      initMap(ruta.color_hex, validParadas);
    } else {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => initMap(ruta.color_hex, validParadas);
      document.head.appendChild(script);
    }
    return () => {
      const prior = (window as any)._panchoMap;
      if (prior) { prior.remove(); (window as any)._panchoMap = null; }
      setMapReady(false);
    };
  }, [ruta, paradas]);

  useEffect(() => {
    if (!IS_SUPABASE) return;
    const asgId = activeAsignacionId.current;
    if (!asgId) return;
    const { createBrowserClient } = require("@supabase/ssr");
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const channel = supabase.channel(`bus-location-${asgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bus_locations", filter: `id_asignacion=eq.${asgId}` },
        (payload: any) => {
          const row = payload.new ?? payload.record;
          if (row?.latitud != null && row?.longitud != null) { setBusLat(row.latitud); setBusLng(row.longitud); }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ruta]);

  useEffect(() => {
    if (busLat === null || busLng === null) return;
    const map = (window as any)._panchoMap;
    const L = (window as any).L;
    if (!map || !L) return;
    const busHtml = `<div style="width:32px;height:32px;border-radius:50%;background:#1A1718;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.4);"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M4 16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7c0-3.5-3.6-4-8-4S4 3.5 4 7v9zm4 2a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM4 11h16v2H4v-2z"/></svg></div>`;
    const busIcon = L.divIcon({ html: busHtml, className: "", iconSize: [32, 32], iconAnchor: [16, 16] });
    if (busMarkerRef.current) {
      busMarkerRef.current.setLatLng([busLat, busLng]);
    } else {
      busMarkerRef.current = L.marker([busLat, busLng], { icon: busIcon, zIndexOffset: 1000 })
        .addTo(map).bindPopup("<b>Bus en ruta</b><br/><small>Posici\u00f3n en tiempo real</small>");
    }
  }, [busLat, busLng]);

  if (!ruta) return (
    <AppShell role="estudiante">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    </AppShell>
  );

  const hasMapData = paradas.some((p) => p.latitud && p.longitud);

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
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{ruta.dias_operacion.join(" \u00b7 ")}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Badge variant={ruta.estado === "activa" ? "success" : ruta.estado === "suspendida" ? "warning" : "default"}>
            {ruta.estado === "activa" ? <><CheckCircle2 className="w-3.5 h-3.5" /> Activa</> : <><AlertCircle className="w-3.5 h-3.5" /> {ruta.estado}</>}
          </Badge>
          <div className="flex-1" />
          {ruta.estado === "activa" && (
            <Link href={`/app/reservar?ruta=${ruta.id_ruta}`}><Button>Reservar cupo <ArrowRight className="w-4 h-4" /></Button></Link>
          )}
        </div>

        <Card>
          <CardBody className="space-y-3">
            <p className="font-display text-sm uppercase tracking-wider text-muted">Operador</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
              <div><p className="font-medium">{ruta.nombre_chofer}</p><p className="text-xs text-muted">Chofer asignado</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><Bus className="w-4 h-4 text-primary" /></div>
              <div><p className="font-medium">{ruta.placa_bus ?? "Sin asignar"}</p><p className="text-xs text-muted">Placa del bus</p></div>
            </div>
            {ruta.telefono_contacto && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><Phone className="w-4 h-4 text-primary" /></div>
                <div><p className="font-medium">{ruta.telefono_contacto}</p><p className="text-xs text-muted">Contacto</p></div>
              </div>
            )}
          </CardBody>
        </Card>

        <div>
          <h2 className="font-display text-xl mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Mapa de la ruta
            {busLat !== null && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-state-ok bg-state-ok/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-state-ok animate-pulse" />
                Bus en ruta
              </span>
            )}
          </h2>
          <div className="rounded-2xl overflow-hidden border border-border shadow-sm relative">
            {hasMapData ? (
              <>
                {!mapReady && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-2">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      <p className="text-xs text-muted">Cargando mapa\u2026</p>
                    </div>
                  </div>
                )}
                <div id="route-map" style={{ height: "360px", width: "100%" }} className="bg-surface-2" />
              </>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2 bg-surface-2 text-muted">
                <MapPin className="w-8 h-8 opacity-30" />
                <p className="text-sm">Coordenadas no disponibles para esta ruta</p>
              </div>
            )}
          </div>
          {hasMapData && <p className="text-xs text-muted mt-1.5 text-right">Mapa: \u00a9 OpenStreetMap contributors</p>}
        </div>

        <div>
          <h2 className="font-display text-xl mb-3">Paradas ({paradas.length})</h2>
          <div className="space-y-0">
            {paradas.map((p, i) => (
              <div key={p.id_parada} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ borderColor: ruta.color_hex, background: p.tipo !== "intermedia" ? ruta.color_hex : "transparent", color: p.tipo !== "intermedia" ? "white" : ruta.color_hex }}>
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
                    <div className="text-right text-xs text-muted shrink-0"><p>\u2191 {p.hora_salida}</p><p>\u2193 {p.hora_regreso}</p></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {asignaciones.length > 0 && (
          <div>
            <h2 className="font-display text-xl mb-3">Pr\u00f3ximas salidas</h2>
            <div className="space-y-3">
              {asignaciones.map((a) => {
                const libre = a.cupos_disponibles - a.cupos_reservados;
                return (
                  <Card key={a.id_asignacion}>
                    <CardBody className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {new Date(a.fecha + "T12:00:00").toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" })} \u00b7 {a.hora_salida}
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
                            <Button size="sm" variant={libre > 0 ? "default" : "outline"}>{libre > 0 ? "Reservar" : "Lista espera"}</Button>
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
