"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/providers/demo-session";
import { useRouter } from "next/navigation";

export function PublicHeader() {
  const { user } = useSession();
  const router = useRouter();

  const goToApp = () => {
    if (!user) return router.push("/login");
    if (user.rol === "admin") router.push("/admin/dashboard");
    else if (user.rol === "chofer") router.push("/chofer/hoy");
    else router.push("/app/inicio");
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center"><Logo size={28} /></Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/#como-funciona" className="text-muted hover:text-foreground transition-colors">Cómo funciona</Link>
          <Link href="/#rutas" className="text-muted hover:text-foreground transition-colors">Rutas</Link>
          <Link href="/#equipo" className="text-muted hover:text-foreground transition-colors">Equipo</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          {user ? (
            <Button size="sm" onClick={goToApp}>Mi panel</Button>
          ) : (
            <>
              <Link href="/login"><Button size="sm" variant="ghost">Iniciar sesión</Button></Link>
              <Link href="/registro"><Button size="sm">Registrarme</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
