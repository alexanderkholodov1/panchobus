"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSession } from "@/components/providers/demo-session";
import { toast } from "@/components/ui/toaster";
import { ShieldCheck, GraduationCap, Bus } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { loginByCredentials, loginAs } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectByRole = (rol: string) => {
    const next = search.get("next");
    if (next) return router.push(next);
    if (rol === "admin") router.push("/admin/dashboard");
    else if (rol === "chofer") router.push("/chofer/hoy");
    else router.push("/app/inicio");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!email.endsWith("@usfq.edu.ec") && !email.endsWith("@estud.usfq.edu.ec")) {
        throw new Error("Solo correos institucionales USFQ son permitidos.");
      }
      if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
      const u = await loginByCredentials(email, password);
      if (!u) throw new Error("Usuario no encontrado en el sistema.");
      toast({ title: "Sesión iniciada", description: `Bienvenido, ${u.nombre}`, variant: "success" });
      redirectByRole(u.rol);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: "estudiante" | "admin" | "chofer") => {
    setLoading(true);
    await loginAs(role);
    toast({ title: "Modo demo activo", description: `Entrando como ${role}`, variant: "info" });
    redirectByRole(role);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-surface-2">
      <header className="px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/"><Logo size={26} /></Link>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-1">
            <h1 className="font-display text-3xl sm:text-4xl">Inicia sesión</h1>
            <p className="text-muted text-sm">Accede con tu cuenta institucional USFQ</p>
          </div>
          <Card>
            <CardBody className="space-y-4">
              <form onSubmit={onSubmit} className="space-y-3.5">
                <div>
                  <Label htmlFor="email">Correo institucional</Label>
                  <Input id="email" type="email" placeholder="tu.correo@estud.usfq.edu.ec" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                {error && <p className="text-sm text-state-error bg-state-error/10 px-3 py-2 rounded-lg">{error}</p>}
                <Button type="submit" size="lg" className="w-full" loading={loading}>Iniciar sesión</Button>
              </form>
              <p className="text-center text-sm text-muted">
                ¿No tienes cuenta?{" "}
                <Link href="/registro" className="text-primary font-medium hover:underline">Regístrate</Link>
              </p>
            </CardBody>
          </Card>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-xs uppercase tracking-wider text-muted">Demo · acceso rápido</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["estudiante", "admin", "chofer"] as const).map((role) => {
              const icons = { estudiante: GraduationCap, admin: ShieldCheck, chofer: Bus };
              const Icon = icons[role];
              return (
                <button key={role} onClick={() => demoLogin(role)} className="p-3 rounded-xl bg-surface border border-border hover:border-primary hover:bg-usfq-red-tint/30 transition-all text-center">
                  <Icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                  <span className="text-xs font-medium block capitalize">{role}</span>
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-muted">Los accesos demo permiten explorar las 3 experiencias sin necesidad de cuenta.</p>
        </div>
      </main>
    </div>
  );
}

e