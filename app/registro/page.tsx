"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSession } from "@/components/providers/demo-session";
import { db } from "@/lib/db";
import type { Ruta } from "@/lib/types";
import { toast } from "@/components/ui/toaster";

export default function RegistroPage() {
  const router = useRouter();
  const { register } = useSession();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    codigo_banner: "",
    telefono: "",
    direccion: "",
    id_ruta: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    db.getRutas().then((r) => setRutas(r.filter((x) => x.estado === "activa")));
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones (cumple recomendaciones del profesor)
    if (!form.email.endsWith("@usfq.edu.ec") && !form.email.endsWith("@estud.usfq.edu.ec")) {
      return setError("Debes usar tu correo institucional @usfq.edu.ec o @estud.usfq.edu.ec");
    }
    if (!/^\d{8}$/.test(form.codigo_banner)) {
      return setError("El código Banner debe tener 8 dígitos.");
    }
    if (!/^[+\d\s-]{7,}$/.test(form.telefono)) {
      return setError("Ingresa un teléfono válido.");
    }
    if (form.password.length < 6) {
      return setError("La contraseña debe tener al menos 6 caracteres.");
    }
    if (form.password !== form.confirmPassword) {
      return setError("Las contraseñas no coinciden.");
    }

    setLoading(true);
    try {
      const u = await register({
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        codigo_banner: form.codigo_banner,
        telefono: form.telefono,
        direccion: form.direccion,
        id_ruta: form.id_ruta ? Number(form.id_ruta) : null
      });
      toast({
        title: "Cuenta creada",
        description: `Bienvenido, ${u.nombre}`,
        variant: "success"
      });
      router.push("/app/inicio");
    } catch (err: any) {
      setError(err.message ?? "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-surface-2">
      <header className="px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo size={26} />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl space-y-5">
          <div className="text-center space-y-1">
            <h1 className="font-display text-3xl sm:text-4xl">Crear cuenta</h1>
            <p className="text-muted text-sm">
              Tu libertad, comienza aquí.
            </p>
          </div>

          <Card>
            <CardBody>
              <form onSubmit={onSubmit} className="space-y-3.5">
                <div>
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input id="nombre" value={form.nombre} onChange={set("nombre")} required />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email">Correo institucional</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@estud.usfq.edu.ec"
                      value={form.email}
                      onChange={set("email")}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="banner">Código Banner</Label>
                    <Input
                      id="banner"
                      placeholder="00332509"
                      value={form.codigo_banner}
                      onChange={set("codigo_banner")}
                      required
                      maxLength={8}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      placeholder="+593 99 123 4567"
                      value={form.telefono}
                      onChange={set("telefono")}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="direccion">Sector / barrio</Label>
                    <Input
                      id="direccion"
                      placeholder="Cumbayá"
                      value={form.direccion}
                      onChange={set("direccion")}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ruta">Ruta de interés</Label>
                  <Select id="ruta" value={form.id_ruta} onChange={set("id_ruta")}>
                    <option value="">Selecciona tu ruta</option>
                    {rutas.map((r) => (
                      <option key={r.id_ruta} value={r.id_ruta}>
                        {r.codigo} · {r.nombre}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="pwd">Contraseña</Label>
                    <Input
                      id="pwd"
                      type="password"
                      value={form.password}
                      onChange={set("password")}
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpwd">Confirmar contraseña</Label>
                    <Input
                      id="cpwd"
                      type="password"
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-state-error bg-state-error/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full" loading={loading}>
                  Crear cuenta
                </Button>

                <p className="text-center text-sm text-muted">
                  ¿Ya tienes cuenta?{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline">
                    Inicia sesión
                  </Link>
                </p>
              </form>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}
