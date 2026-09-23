"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/components/ui/toaster";
import type { Ruta } from "@/lib/types";
import { Plus, Pencil, Trash2, X, Check, Bus, MapPin } from "lucide-react";

const EMPTY_FORM = {
  codigo: "", nombre: "", descripcion: "", color_hex: "#E11B22",
  numero_asientos: "36", dias_operacion: ["L", "M", "X", "J", "V"], estado: "activa"
};
const DIAS_OPT = ["L", "M", "X", "J", "V", "S", "D"] as const;

export default function AdminRutasPage() {
  const { t, localized } = useI18n();
  const R = t.admin.routes;
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = () => db.getRutas().then((r) => setRutas([...r]));
  useEffect(() => { load(); }, []);

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleDia = (d: string) => setForm((f) => ({
    ...f,
    dias_operacion: f.dias_operacion.includes(d)
      ? f.dias_operacion.filter((x) => x !== d)
      : DIAS_OPT.filter((x) => x === d || f.dias_operacion.includes(x))
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    const codigo = form.codigo.trim().toUpperCase();
    if (!codigo || !form.nombre.trim()) return toast({ title: R.errRequired, variant: "error" });
    if (rutas.some((r) => r.codigo.toUpperCase() === codigo && r.id_ruta !== editing)) {
      return toast({ title: R.errDuplicate, variant: "error" });
    }
    setSaving(true);
    const editable = {
      codigo,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      color_hex: form.color_hex,
      numero_asientos: Math.max(1, Number(form.numero_asientos) || 1),
      dias_operacion: form.dias_operacion,
      estado: form.estado as Ruta["estado"],
      disponible: form.estado === "activa"
    };
    if (editing !== null) {
      const current = rutas.find((r) => r.id_ruta === editing);
      // Only the fields in the form change; stops, bus, driver and contact are preserved.
      // A new description replaces the seeded English translation with the text as written.
      const patch: Partial<Ruta> = { ...editable };
      if (current && current.descripcion !== editable.descripcion) patch.descripcion_en = undefined;
      await db.updateRuta(editing, patch);
      toast({ title: R.toastUpdated, variant: "success" });
    } else {
      await db.createRuta({ ...editable, numero_paradas: 0, placa_bus: null, telefono_contacto: "", nombre_chofer: "" });
      toast({ title: R.toastCreated, variant: "success" });
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    load();
  };

  const del = async (id: number) => {
    setDeleting(id);
    await db.deleteRuta(id);
    toast({ title: R.toastDeleted, variant: "info" });
    setDeleting(null);
    setConfirmDelete(null);
    load();
  };

  return (
    <AppShell role="admin">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted mb-1">{R.kicker}</p>
            <h1 className="font-display text-3xl">{R.title}</h1>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4" />{R.new}</Button>
        </div>

        {showForm && (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl">{editing !== null ? R.editTitle : R.newTitle}</h2>
                <button type="button" onClick={() => setShowForm(false)} aria-label={t.common.close} className="p-1 hover:bg-surface-2 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="codigo">{R.code}</Label>
                  <Input id="codigo" placeholder="A1" value={form.codigo} onChange={set("codigo")} maxLength={4} />
                </div>
                <div>
                  <Label htmlFor="nombre">{R.name}</Label>
                  <Input id="nombre" placeholder={R.namePlaceholder} value={form.nombre} onChange={set("nombre")} />
                </div>
              </div>
              <div>
                <Label htmlFor="desc">{R.description}</Label>
                <Input id="desc" placeholder={R.descriptionPlaceholder} value={form.descripcion} onChange={set("descripcion")} />
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="asientos">{R.seats}</Label>
                  <Input id="asientos" type="number" min={10} max={80} value={form.numero_asientos} onChange={set("numero_asientos")} />
                </div>
                <div>
                  <Label htmlFor="color">{R.color}</Label>
                  <div className="flex gap-2">
                    <input type="color" aria-label={R.color} value={form.color_hex} onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent" />
                    <Input id="color" value={form.color_hex} onChange={set("color_hex")} className="font-mono" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="estado">{R.status}</Label>
                  <Select id="estado" value={form.estado} onChange={set("estado")}>
                    <option value="activa">{t.status.route.activa}</option>
                    <option value="suspendida">{t.status.route.suspendida}</option>
                    <option value="inactiva">{t.status.route.inactiva}</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label>{R.days}</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {DIAS_OPT.map((d) => (
                    <button key={d} type="button" aria-pressed={form.dias_operacion.includes(d)} onClick={() => toggleDia(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border-2 ${
                        form.dias_operacion.includes(d) ? "border-primary bg-primary text-white" : "border-border hover:border-primary/40"
                      }`}>
                      {t.days[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
                <Button loading={saving} onClick={save}><Check className="w-4 h-4" />{t.common.save}</Button>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate max-w-[180px] sm:max-w-none">{r.nombre}</p>
                      <StatusBadge kind="route" value={r.estado} />
                    </div>
                    <p className="text-xs text-muted line-clamp-1 mt-0.5 hidden sm:block">{localized(r, "descripcion")}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted mt-0.5">
                      <span className="flex items-center gap-1 whitespace-nowrap"><MapPin className="w-3 h-3" />{t.common.stops(r.numero_paradas)}</span>
                      <span className="flex items-center gap-1 whitespace-nowrap"><Bus className="w-3 h-3" />{t.common.seats(r.numero_asientos)}</span>
                      <span className="whitespace-nowrap">{r.dias_operacion.map((d) => t.days[d as keyof typeof t.days] ?? d).join(" ")}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" aria-label={R.editLabel(r.codigo)} title={R.editLabel(r.codigo)} onClick={() => openEdit(r)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {confirmDelete === r.id_ruta ? (
                      <Button size="sm" variant="danger" loading={deleting === r.id_ruta} onClick={() => del(r.id_ruta)}>
                        {t.common.confirmDelete}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" aria-label={R.deleteLabel(r.codigo)} title={R.deleteLabel(r.codigo)}
                        className="text-state-error border-state-error/30 hover:bg-state-error/10"
                        onClick={() => setConfirmDelete(r.id_ruta)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
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
