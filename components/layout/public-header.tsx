"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LangToggle } from "@/components/ui/lang-toggle";
import { Button } from "@/components/ui/button";
import { AboutButton, DemoRibbon } from "@/components/about/about-project";
import { useSession } from "@/components/providers/demo-session";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";

export function PublicHeader() {
  const { user } = useSession();
  const { t } = useI18n();
  const router = useRouter();

  const goToApp = () => {
    if (!user) return router.push("/login");
    if (user.rol === "admin") router.push("/admin/dashboard");
    else if (user.rol === "chofer") router.push("/chofer/hoy");
    else router.push("/app/inicio");
  };

  return (
    <>
      <DemoRibbon />
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3">
          <Link href="/" className="flex items-center shrink-0" aria-label="Pancho Bus"><Logo size={28} /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/#como-funciona" className="text-muted hover:text-foreground transition-colors">{t.header.how}</Link>
            <Link href="/#acceso" className="text-muted hover:text-foreground transition-colors">{t.header.roles}</Link>
            <Link href="/#operacion" className="text-muted hover:text-foreground transition-colors">{t.header.operation}</Link>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <AboutButton className="hidden sm:inline-flex" />
            <LangToggle />
            <ThemeToggle className="hidden lg:inline-flex" />
            {user ? (
              <Button size="sm" className="whitespace-nowrap" onClick={goToApp}>{t.header.myPanel}</Button>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block"><Button size="sm" variant="ghost">{t.header.login}</Button></Link>
                <Link href="/registro"><Button size="sm">{t.header.register}</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
