"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/components/providers/demo-session";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LangToggle } from "@/components/ui/lang-toggle";
import { AboutButton } from "@/components/about/about-project";
import { useI18n } from "@/lib/i18n";
import type { Dict } from "@/lib/i18n/es";
import { cn, initials } from "@/lib/utils";
import {
  Home,
  Map,
  CalendarCheck,
  QrCode,
  Clock,
  UserCircle2,
  LogOut,
  LayoutDashboard,
  Bus,
  Users,
  MessageSquare,
  BarChart3,
  Camera,
  Navigation,
  ListChecks,
  Route as RouteIcon,
  ChevronDown,
  UserCog
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";

type Role = "estudiante" | "admin" | "chofer";
type NavItem = { href: string; label: string; icon: typeof Home };

function navFor(role: Role, t: Dict): NavItem[] {
  const n = t.shell.nav;
  if (role === "admin") {
    return [
      { href: "/admin/dashboard", label: n.admin.dashboard, icon: LayoutDashboard },
      { href: "/admin/rutas", label: n.admin.routes, icon: RouteIcon },
      { href: "/admin/buses", label: n.admin.buses, icon: Bus },
      { href: "/admin/choferes", label: n.admin.staff, icon: UserCog },
      { href: "/admin/asignaciones", label: n.admin.assignments, icon: CalendarCheck },
      { href: "/admin/reservas", label: n.admin.bookings, icon: ListChecks },
      { href: "/admin/usuarios", label: n.admin.users, icon: Users },
      { href: "/admin/mensajes", label: n.admin.messages, icon: MessageSquare },
      { href: "/admin/insights", label: n.admin.insights, icon: BarChart3 }
    ];
  }
  if (role === "chofer") {
    // "chofer" covers all route staff (drivers and attendants).
    return [
      { href: "/chofer/hoy", label: n.driver.today, icon: Navigation },
      { href: "/chofer/pasajeros", label: n.driver.passengers, icon: Users },
      { href: "/chofer/escanear", label: n.driver.scan, icon: Camera },
      { href: "/chofer/mensajes", label: n.driver.messages, icon: MessageSquare }
    ];
  }
  return [
    { href: "/app/inicio", label: n.student.home, icon: Home },
    { href: "/app/rutas", label: n.student.routes, icon: Map },
    { href: "/app/reservar", label: n.student.book, icon: CalendarCheck },
    { href: "/app/mi-qr", label: n.student.qr, icon: QrCode },
    { href: "/app/mis-reservas", label: n.student.bookings, icon: ListChecks },
    { href: "/app/horarios", label: n.student.schedule, icon: Clock },
    { href: "/app/perfil", label: n.student.profile, icon: UserCircle2 }
  ];
}

export function AppShell({ children, role }: { children: React.ReactNode; role: Role }) {
  const { user, isLoading, logout } = useSession();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [openMobile, setOpenMobile] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
    if (!isLoading && user && user.rol !== role) {
      if (user.rol === "admin") router.replace("/admin/dashboard");
      else if (user.rol === "chofer") router.replace("/chofer/hoy");
      else router.replace("/app/inicio");
    }
  }, [isLoading, user, role, router]);

  useEffect(() => { setOpenMobile(false); }, [pathname]);

  const nav = useMemo(() => navFor(role, t), [role, t]);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  if (isLoading || !user || user.rol !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label={t.common.loading}>
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const onLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-surface sticky top-0 h-screen">
        <div className="px-5 h-16 flex items-center justify-between border-b border-border">
          <Link href="/" aria-label="Pancho Bus"><Logo size={26} /></Link>
          <AboutButton />
        </div>
        <div className="px-3 py-3 text-xs uppercase tracking-wider text-muted">{t.roles[role]}</div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {nav.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={isActive(it.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive(it.href) ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-surface-2"
                )}
              >
                <Icon className="w-4 h-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-sm">
              {initials(user.nombre)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.nombre}</p>
              <p className="text-xs text-muted truncate">{user.correo_electronico}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-state-error transition-colors"
              aria-label={t.shell.logout}
              title={t.shell.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle />
            <LangToggle />
          </div>
          <p className="text-[10px] text-muted/60 text-center">{t.shell.version} · {t.common.demoNote}</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-surface border-b border-border flex items-center justify-between px-4 gap-2">
        <Link href="/" aria-label="Pancho Bus"><Logo size={22} /></Link>
        <div className="flex items-center gap-2">
          <AboutButton />
          <button
            onClick={() => setOpenMobile((o) => !o)}
            aria-expanded={openMobile}
            aria-controls="mobile-nav"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-surface-2 max-w-[48vw]"
          >
            <span className="truncate">{nav.find((n) => isActive(n.href))?.label ?? t.shell.menu}</span>
            <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform", openMobile && "rotate-180")} />
          </button>
        </div>
      </div>

      {openMobile && (
        <div onClick={() => setOpenMobile(false)} className="lg:hidden fixed inset-0 bg-black/40 z-30 mt-14 animate-in">
          <div id="mobile-nav" onClick={(e) => e.stopPropagation()} className="bg-surface border-b border-border p-3 space-y-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <p className="px-3 pb-1 text-xs uppercase tracking-wider text-muted">{t.roles[role]} · {user.nombre}</p>
            {nav.map((it) => {
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={isActive(it.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
                    isActive(it.href) ? "bg-primary text-primary-foreground" : "hover:bg-surface-2"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {it.label}
                </Link>
              );
            })}
            <div className="border-t border-border pt-3 mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LangToggle />
              </div>
              <button onClick={onLogout} className="inline-flex items-center gap-1.5 text-sm text-state-error px-3 py-2">
                <LogOut className="w-4 h-4" />{t.shell.logout}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
