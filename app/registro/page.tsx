"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LangToggle } from "@/components/ui/lang-toggle";
import { AboutButton } from "@/components/about/about-project";
import { useSession } from "@/components/providers/demo-session";
import { useI18n } from "@/lib/i18n";
import { db } from "@/lib/db";
import { STAFF_DOMAIN, STUDENT_DOMAIN } from "@/lib/data/seed";
import type { Ruta } from "@/lib/types";
import { toast } from "@/components/ui/toaster";

export default function RegistroPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const R = t.register;
  const { register } = useSession();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "", email: "", codigo_banner: "", telefono: "",
    direccion: "", id_ruta: "", password: "", confirmPassword: ""
  });

  useEffect(() => {
    db.getRutas().then((r) => setRutas(r.filter((x) => x.estado === "activa")));
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const email = form.email.trim().toLowerCase();
    if (!email.endsWith(`@${STUDENT_DOMAIN}`) && !email.endsWith(`@${STAFF_DOMAIN}`))
      return setError(R.errDomain(STUDENT_DOMAIN, STAFF_DOMAIN));
    if (!/^\d{8}$/.test(form.codigo_banner)) return setError(R.errBanner);
    if (!/^\+?[\d\s-]{7,}$/.test(form.telefono.trim())) return setError(R.errPhone);
    if (form.password.length < 6) return setError(R.errPassword);
    if (form.password !== form.confirmPassword) return setError(R.errMatch);
    setLoading(true);
    try {
      const u = await register({
        nombre: form.nombre.trim(), email, password: form.password,
        codigo_banner: form.codigo_banner, telefono: form.telefono.trim(),
        direccion: form.direccion.trim(), id_ruta: form.id_ruta ? Number(form.id_ruta) : null
      });
      toast({ title: R.toastTitle, description: R.toastWelcome(u.nombre), variant: "success" });
      router.push("/app/inicio");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg === "EMAIL_EXISTS" ? R.errExists : msg && msg !== "SIGNUP_FAILED" ? msg : R.errGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-surface-2">
      <header className="px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Link href="/" aria-label="Pancho Bus"><Logo size={26} /></Link>
        <div className="flex items-center gap-2">
          <AboutButton />
          <LangToggle />
          <ThemeToggle className="hidden sm:inline-flex" />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl space-y-5">
          <div className="text-center space-y-1">
            <h1 className="font-display text-3xl sm:text-4xl">{R.title}</h1>
            <p className="text-muted text-sm">{R.subtitle}</p>
          </div>
          <Card>
            <CardBody>
              <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
                <div>
                  <Label htmlFor="nombre">{R.fullName}</Label>
                  <Input id="nombre" autoComplete="name" value={form.nombre} onChange={set("nombre")} required />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email">{R.email}</Label>
                    <Input id="email" type="email" autoComplete="email" placeholder={`${lang === "es" ? "nombre" : "name"}@${STUDENT_DOMAIN}`} value={form.email} onChange={set("email")} required />
                  </div>
                  <div>
                    <Label htmlFor="banner">{R.banner}</Label>
                    <Input id="banner" inputMode="numeric" placeholder="00912345" value={form.codigo_banner} onChange={set("codigo_banner")} required maxLength={8} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="telefono">{R.phone}</Label>
                    <Input id="telefono" type="tel" autoComplete="tel" placeholder="+593 99 000 0000" value={form.telefono} onChange={set("telefono")} required />
                  </div>
                  <div>
                    <Label htmlFor="direccion">{R.area}</Label>
                    <Input id="direccion" placeholder={R.areaPlaceholder} value={form.direccion} onChange={set("direccion")} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ruta">{R.route}</Label>
                  <Select id="ruta" value={form.id_ruta} onChange={set("id_ruta")}>
                    <option value="">{R.routePlaceholder}</option>
                    {rutas.map((r) => (
                      <option key={r.id_ruta} value={r.id_ruta}>{r.codigo} · {r.nombre}</option>
                    ))}
                  </Select>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="pwd">{R.password}</Label>
                    <Input id="pwd" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} required minLength={6} />
                  </div>
                  <div>
                    <Label htmlFor="cpwd">{R.confirmPassword}</Label>
                    <Input id="cpwd" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set("confirmPassword")} required minLength={6} />
                  </div>
                </div>
                {error && <p role="alert" className="text-sm text-state-error bg-state-error/10 px-3 py-2 rounded-lg">{error}</p>}
                <Button type="submit" size="lg" className="w-full" loading={loading}>{R.submit}</Button>
                <p className="text-center text-sm text-muted">
                  {R.haveAccount}{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline">{R.login}</Link>
                </p>
              </form>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}
