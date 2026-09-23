"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LangToggle } from "@/components/ui/lang-toggle";
import { AboutButton } from "@/components/about/about-project";
import { useSession } from "@/components/providers/demo-session";
import { toast } from "@/components/ui/toaster";
import { useI18n } from "@/lib/i18n";
import { STAFF_DOMAIN, STUDENT_DOMAIN } from "@/lib/data/seed";
import { ShieldCheck, GraduationCap, Bus } from "lucide-react";

type Role = "estudiante" | "admin" | "chofer";

function safeNext(next: string | null): string | null {
  // Only allow in-app paths, never absolute URLs (open-redirect guard).
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

function LoginContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { t } = useI18n();
  const { loginByCredentials, loginAs, logout } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<Role | "form" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectByRole = (rol: string) => {
    const next = safeNext(search.get("next"));
    if (next) return router.push(next);
    if (rol === "admin") router.push("/admin/dashboard");
    else if (rol === "chofer") router.push("/chofer/hoy");
    else router.push("/app/inicio");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalized = email.trim().toLowerCase();
    if (!normalized.endsWith(`@${STUDENT_DOMAIN}`) && !normalized.endsWith(`@${STAFF_DOMAIN}`)) {
      return setError(t.login.errDomain(STUDENT_DOMAIN, STAFF_DOMAIN));
    }
    if (password.length < 6) return setError(t.login.errPassword);
    setLoading("form");
    try {
      const u = await loginByCredentials(normalized, password);
      if (!u) return setError(t.login.errNotFound);
      if (u.estado === "suspendido") {
        logout();
        return setError(t.login.errSuspended);
      }
      toast({ title: t.login.toastTitle, description: t.login.toastWelcome(u.nombre), variant: "success" });
      redirectByRole(u.rol);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.login.errNotFound);
    } finally {
      setLoading(null);
    }
  };

  const demoLogin = async (role: Role) => {
    setLoading(role);
    try {
      await loginAs(role);
      toast({ title: t.login.toastDemo, description: t.login.toastDemoAs(t.roles[role]), variant: "info" });
      redirectByRole(role);
    } finally {
      setLoading(null);
    }
  };

  const icons = { estudiante: GraduationCap, admin: ShieldCheck, chofer: Bus };

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
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-1">
            <h1 className="font-display text-3xl sm:text-4xl">{t.login.title}</h1>
            <p className="text-muted text-sm">{t.login.subtitle}</p>
          </div>

          <div className="space-y-2">
            <p className="text-center text-xs uppercase tracking-wider text-muted">{t.login.demoDivider}</p>
            <div className="grid grid-cols-3 gap-2">
              {(["estudiante", "admin", "chofer"] as const).map((role) => {
                const Icon = icons[role];
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={loading !== null}
                    onClick={() => demoLogin(role)}
                    className="p-3 rounded-xl bg-surface border border-border hover:border-primary hover:bg-usfq-red-tint/30 transition-all text-center disabled:opacity-60"
                  >
                    {loading === role
                      ? <span className="block w-5 h-5 mx-auto mb-1.5 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden />
                      : <Icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />}
                    <span className="text-xs font-medium block">{t.roles[role]}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted">{t.login.demoHint}</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          </div>

          <Card>
            <CardBody className="space-y-4">
              <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
                <div>
                  <Label htmlFor="email">{t.login.email}</Label>
                  <Input id="email" type="email" placeholder={`vcastro@${STUDENT_DOMAIN}`} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">{t.login.password}</Label>
                  <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                {error && <p role="alert" className="text-sm text-state-error bg-state-error/10 px-3 py-2 rounded-lg">{error}</p>}
                <Button type="submit" size="lg" className="w-full" loading={loading === "form"}>{t.login.submit}</Button>
              </form>
              <p className="text-center text-sm text-muted">
                {t.login.noAccount}{" "}
                <Link href="/registro" className="text-primary font-medium hover:underline">{t.login.register}</Link>
              </p>
              <p className="text-xs text-muted text-center">{t.login.demoPasswordHint(STUDENT_DOMAIN)}</p>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
