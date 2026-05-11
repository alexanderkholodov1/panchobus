"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { db } from "@/lib/db";
import { toast } from "@/components/ui/toaster";
import type { Ruta } from "@/lib/types";
import { Plus, Pencil, Trash2, X, Check, Bus, MapPin } from "lucide-react";

const EMPTY_FORM = {
  codigo: "", nombre: "", descripcion: "", color_hex: "#E11B22",
  numero_asientos: "36", dias_operacion: ["L","M","X","J","V"], estado: "activa"
};

const DIAS_OPT = ["L","M","X","J","V","S","D"];
const DIAS_LABELS: Record<string,string> = { L:"Lun",M:"Mar",X:"Mié",J:"Jue",V:"Vie",S:"Sáb",D:"Dom" };

export default function AdminRutasPage() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => db.getRutas().then(setRutas);
  useEffect(() => { load(); }, []);

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleDia = (d: string) => setForm((f) => ({
    ...f,
    dias_operacion: f.dias_operacion.includes(d)
      ? f.dias_operacion.filter((x) => x !== d)
      : [...f.dias_operacion, d]
  }));

  const openNew = () => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true); };
  const openEdit = (r: Ruta) => {
    setForm({
      codigo: r.codigo, nombre: r.nombre, descripcion: r.descripcion,
      color_hex: r.color_hex, numero_asientos: r.numero_asientos.toString(),
      dias_operacion: r.dias_operacion, estado: r.estado
    });
    setEditing(r.id_ruta);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.codigo || !form.nombre) return toast({ title: "Completa código y nombre", variant: "error" });
    setSaving(true);
    const payload = {
      codigo: form.codigo.toUpperCase(),
      nombre: form.nombre,
      descripcion: form.descripcion,
      color_hex: form.color_hex,
      numero_asientos: Number(form.numero_asientos),
      dias_operacion: form.dias_operacion,
      estado: form.estado as Ruta["estado"],
      numero_paradas: 0,
      placa_bus: null,
      telefono_contacto: "",
      nombre_chofer: "",
      disponible: form.estado === "activa"
    };
    if (editing !== null) {
      await db.updateRuta(editing, payload);
      toast({ title: "Ruta actualizada", variant: "success" });
    } else {
      await db.createRuta(payload);
      toast({ title: "Ruta creada", variant: "success" });
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const del = async (id: number) => {
    setDeleting(id);
    await db.deleteRuta(id);
    toast({ title: "Ruta eliminada", variant: "info" });
    setDeleting(null);
    load();
  };

  return (
    <AppShell role="admin">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted mb-1">Gestión</p>
            <h1 className="font-display text-3xl">Rutas</h1>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4" />Nueva ruta</Button>
        </div>

        {showForm && (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl">{editing ? "Editar ruta" : "Nueva ruta"}</h2>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-surface-2 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input id="codigo" placeholder="A1" value={form.codigo} onChange={set("codigo")} maxLength={4} />
                </div>
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" placeholder="USFQ — Lumbisí" value={form.nombre} onChange={set("nombre")} />
                </div>
              </div>
              <div>
                <Label htmlFor="desc">Descripción</Label>
                <Input id="desc" placeholder="Descripción breve de la ruta" value={form.descripcion} onChange={set("descripcion")} />
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="asientos">Asientos</Label>
                  <Input id="asientos" type="number" min={10} max={80} value={form.numero_asientos} onChange={set("numero_asientos")} />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={form.color_hex} onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                    <Input value={form.color_hex} onChange={set("color_hex")} className="font-mono" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select id="estado" value={form.estado} onChange={set("estado")}>
                    <option value="activa">Activa</option>
                    <option value="suspendida">Suspendida</option>
                    <option value="inactiva">Inactiva</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Días de operación</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {DIAS_OPT.map((d) => (
                    <button key={d} onClick={() => toggleDia(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border-2 ${
                        form.dias_operacion.includes(d) ? "border-primary bg-primary text-white" : "border-border hover:border-primary/40"
                      }`}>
                      {DIAS_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button loading={saving} onClick={save}><Check className="w-4 h-4" />Guardar</Button>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="space-y-2">
          {rutas.map((r) => (
            <Card key={r.id_ruta} className="overflow-hidden">
              <div className="h-1" style={{ background: r.color_hex }} />
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: r.color_hex }}>
                    {r.codigo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{r.nombre}</p>
                      <Badge variant={r.estado === "activa" ? "success" : "warning"}>{r.estado}</Badge>
                    </div>
                    <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
                      <MapPin className="w-3 h-3" />{r.numero_paradas} paradas ·
                      <Bus className="w-3 h-3" />{r.numero_asientos} asientos ·
                      {r.dias_operacion.map((d) => DIAS_LABELS[d]).join(" ")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-state-error border-state-error/30 hover:bg-state-error/10"
                      loading={deleting === r.id_ruta} onClick={() => del(r.id_ruta)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
