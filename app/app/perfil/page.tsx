"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { toast } from "@/components/ui/toaster";
import type { Ruta } from "@/lib/types";
import { UserCircle2, Mail, Hash, Phone, MapPin, Route, Sun, Moon, Monitor, Save, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export default function PerfilPage() {
  const { user, logout, refresh } = useSession();
  const { setTheme } = useTheme();
  const router = useRouter();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [form, setForm] = useState({ nombre: "", telefono: "", direccion: "", id_ruta: "", idioma: "es", tema: "system" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.getRutas().then((r) => setRutas(r.filter((x) => x.estado === "activa")));
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm({
      nombre: user.nombre,
      telefono: user.telefono,
      direccion: user.direccion ?? "",
      id_ruta: user.id_ruta?.toString() ?? "",
      idioma: user.idioma ?? "es",
      tema: user.tema ?? "system"
    });
  }, [user]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setTheme(form.tema);
    await db.updateUsuario(user.id_usuario, {
      nombre: form.nombre,
      telefono: form.telefono,
      direccion: form.direccion,
      id_ruta: form.id_ruta ? Number(form.id_ruta) : null,
      idioma: form.idioma,
      tema: form.tema as "light" | "dark" | "system"
    });
    await refresh();
    toast({ title: "Perfil actualizado", variant: "success" });
    setSaving(false);
  };

  const onLogout = () => { logout(); router.replace("/"); };

  if (!user) return null;

  const initials = user.nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  return (
    <AppShell role="estudiante">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">Cuenta</p>
          <h1 className="font-display text-3xl">Mi perfil</h1>
        </div>

        {/* Avatar + rol */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-2xl">
            {initials}
          </div>
          <div>
            <p className="font-display text-xl">{user.nombre}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={user.rol === "admin" ? "warning" : user.rol === "chofer" ? "info" : "default"}>
                {user.rol}
              </Badge>
              <Badge variant={user.estado === "activo" ? "success" : "warning"}>{user.estado}</Badge>
            </div>
          </div>
        </div>

        {/* Read-only info */}
        <Card>
          <CardBody className="space-y-3 text-sm">
            <p className="font-display text-sm uppercase tracking-wider text-muted">Información de cuenta</p>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted" />
              <span className="text-muted">Correo:</span>
              <span className="font-medium">{user.correo_electronico}</span>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="w-4 h-4 text-muted" />
              <span className="text-muted">Banner:</span>
              <span className="font-medium font-mono">{user.codigo_banner}</span>
            </div>
          </CardBody>
        </Card>

        {/* Editable */}
        <Card>
          <CardBody className="space-y-4">
            <p className="font-display text-sm uppercase tracking-wider text-muted">Datos personales</p>
            <div>
              <Label htmlFor="nombre"><UserCircle2 className="w-3.5 h-3.5 inline mr-1" />Nombre completo</Label>
              <Input id="nombre" value={form.nombre} onChange={set("nombre")} />
            </div>
            <div>
              <Label htmlFor="tel"><Phone className="w-3.5 h-3.5 inline mr-1" />Teléfono</Label>
              <Input id="tel" value={form.telefono} onChange={set("telefono")} />
            </div>
            <div>
              <Label htmlFor="dir"><MapPin className="w-3.5 h-3.5 inline mr-1" />Sector / barrio</Label>
              <Input id="dir" value={form.direccion} onChange={set("direccion")} />
            </div>
            <div>
              <Label htmlFor="ruta"><Route className="w-3.5 h-3.5 inline mr-1" />Ruta de interés</Label>
              <Select id="ruta" value={form.id_ruta} onChange={set("id_ruta")}>
                <option value="">Sin preferencia</option>
                {rutas.map((r) => (
                  <option key={r.id_ruta} value={r.id_ruta}>{r.codigo} · {r.nombre}</option>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Preferencias */}
        <Card>
          <CardBody className="space-y-4">
            <p className="font-display text-sm uppercase tracking-wider text-muted">Preferencias</p>
            <div>
              <Label htmlFor="idioma">Idioma</Label>
              <Select id="idioma" value={form.idioma} onChange={set("idioma")}>
                <option value="es">Español</option>
                <option value="en">English</option>
              </Select>
            </div>
            <div>
              <Label>Tema</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { val: "light", label: "Claro", icon: Sun },
                  { val: "dark",  label: "Oscuro", icon: Moon },
                  { val: "system",label: "Sistema", icon: Monitor }
                ].map(({ val, label, icon: Icon }) => (
                  <button
                    key={val}
                    onClick={() => setForm((f) => ({ ...f, tema: val }))}
                    className={`flex-1 py-2.5 rounded-xl border-2 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                      form.tema === val ? "border-primary bg-usfq-red-tint/20 text-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Button className="w-full" size="lg" loading={saving} onClick={save}>
          <Save className="w-4 h-4" /> Guardar cambios
        </Button>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-state-error text-sm font-medium hover:bg-state-error/5 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </AppShell>
  );
}
