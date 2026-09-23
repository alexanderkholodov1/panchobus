"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { useI18n, type Lang } from "@/lib/i18n";
import { initials as toInitials } from "@/lib/utils";
import { useSession } from "@/components/providers/demo-session";
import { toast } from "@/components/ui/toaster";
import type { Ruta } from "@/lib/types";
import { UserCircle2, Mail, Hash, Phone, MapPin, Route, Sun, Moon, Monitor, Save, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export default function PerfilPage() {
  const { user, logout, refresh } = useSession();
  const { setTheme, theme } = useTheme();
  const { t, lang, setLang } = useI18n();
  const P = t.student.profile;
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
      idioma: lang,
      tema: theme ?? user.tema ?? "system"
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setTheme(form.tema);
    setLang(form.idioma as Lang);
    await db.updateUsuario(user.id_usuario, {
      nombre: form.nombre,
      telefono: form.telefono,
      direccion: form.direccion,
      id_ruta: form.id_ruta ? Number(form.id_ruta) : null,
      idioma: form.idioma,
      tema: form.tema as "light" | "dark" | "system"
    });
    await refresh();
    toast({ title: t.student.profile.toastSaved, variant: "success" });
    setSaving(false);
  };

  const onLogout = () => { logout(); router.replace("/"); };

  if (!user) return null;

  const initials = toInitials(user.nombre);

  return (
    <AppShell role="estudiante">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">{P.kicker}</p>
          <h1 className="font-display text-3xl">{P.title}</h1>
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
                {t.roles[user.rol]}
              </Badge>
              <StatusBadge kind="user" value={user.estado} />
            </div>
          </div>
        </div>

        {/* Read-only info */}
        <Card>
          <CardBody className="space-y-3 text-sm">
            <p className="font-display text-sm uppercase tracking-wider text-muted">{P.accountInfo}</p>
            <div className="flex items-center gap-3 min-w-0">
              <Mail className="w-4 h-4 text-muted shrink-0" />
              <span className="text-muted">{P.email}:</span>
              <span className="font-medium truncate">{user.correo_electronico}</span>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="w-4 h-4 text-muted" />
              <span className="text-muted">{P.banner}:</span>
              <span className="font-medium font-mono">{user.codigo_banner}</span>
            </div>
          </CardBody>
        </Card>

        {/* Editable */}
        <Card>
          <CardBody className="space-y-4">
            <p className="font-display text-sm uppercase tracking-wider text-muted">{P.personal}</p>
            <div>
              <Label htmlFor="nombre"><UserCircle2 className="w-3.5 h-3.5 inline mr-1" />{P.fullName}</Label>
              <Input id="nombre" value={form.nombre} onChange={set("nombre")} />
            </div>
            <div>
              <Label htmlFor="tel"><Phone className="w-3.5 h-3.5 inline mr-1" />{P.phone}</Label>
              <Input id="tel" value={form.telefono} onChange={set("telefono")} />
            </div>
            <div>
              <Label htmlFor="dir"><MapPin className="w-3.5 h-3.5 inline mr-1" />{P.area}</Label>
              <Input id="dir" value={form.direccion} onChange={set("direccion")} />
            </div>
            <div>
              <Label htmlFor="ruta"><Route className="w-3.5 h-3.5 inline mr-1" />{P.route}</Label>
              <Select id="ruta" value={form.id_ruta} onChange={set("id_ruta")}>
                <option value="">{P.noPreference}</option>
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
            <p className="font-display text-sm uppercase tracking-wider text-muted">{P.preferences}</p>
            <div>
              <Label htmlFor="idioma">{P.language}</Label>
              <Select id="idioma" value={form.idioma} onChange={set("idioma")}>
                <option value="es">Español</option>
                <option value="en">English</option>
              </Select>
            </div>
            <div>
              <Label>{P.theme}</Label>
              <div className="flex gap-2 mt-1" role="radiogroup" aria-label={P.theme}>
                {[
                  { val: "light", label: t.theme.light, icon: Sun },
                  { val: "dark",  label: t.theme.dark, icon: Moon },
                  { val: "system",label: t.theme.system, icon: Monitor }
                ].map(({ val, label, icon: Icon }) => (
                  <button
                    key={val}
                    type="button"
                    role="radio"
                    aria-checked={form.tema === val}
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
          <Save className="w-4 h-4" /> {P.save}
        </Button>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-state-error text-sm font-medium hover:bg-state-error/5 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {P.logout}
        </button>
      </div>
    </AppShell>
  );
}
