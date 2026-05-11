"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/components/providers/demo-session";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
  Sparkles,
  Camera,
  Navigation,
  ListChecks,
  Route as RouteIcon,
  ChevronDown
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";

type NavItem = { href: string; label: string; icon: typeof Home };

const STUDENT_NAV: NavItem[] = [
  { href: "/app/inicio", label: "Inicio", icon: Home },
  { href: "/app/rutas", label: "Rutas", icon: Map },
  { href: "/app/reservar", label: "Reservar", icon: CalendarCheck },
  { href: "/app/mi-qr", label: "Mi QR", icon: QrCode },
  { href: "/app/mis-reservas", label: "Mis reservas", icon: ListChecks },
  { href: "/app/horarios", label: "Horarios", icon: Clock },
  { href: "/app/perfil", label: "Perfil", icon: UserCircle2 }
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/rutas", label: "Rutas", icon: RouteIcon },
  { href: "/admin/buses", label: "Buses", icon: Bus },
  { href: "/admin/choferes", label: "Choferes", icon: Users },
  { href: "/admin/asignaciones", label: "Asignaciones", icon: CalendarCheck },
  { href: "/admin/reservas", label: "Reservas", icon: ListChecks },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/mensajes", label: "Mensajes", icon: MessageSquare },
  { href: "/admin/insights", label: "Insights IA", icon: Sparkles }
];

const DRIVER_NAV: NavItem[] = [
  { href: "/chofer/hoy", label: "Ruta de hoy", icon: Navigation },
  { href: "/chofer/pasajeros", label: "Pasajeros", icon: Users },
  { href: "/chofer/escanear", label: "Escanear QR", icon: Camera },
  { href: "/chofer/mensajes", label: "Mensajes", icon: MessageSquare }
];

export function AppShell({
  children,
  role
}: {
  children: React.ReactNode;
  role: "estudiante" | "admin" | "chofer";
}) {
  const { user, isLoading, logout } = useSession();
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

  const nav = useMemo(() => {
    if (role === "admin") return ADMIN_NAV;
    if (role === "chofer") return DRIVER_NAV;
    return STUDENT_NAV;
  }, [role]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const onLogout = () => {
    logout();
    router.replace("/");
  };

  const roleLabel = role === "admin" ? "Administración" : role === "chofer" ? "Chofer" : "Estudiante";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-surface sticky top-0 h-screen">
        <div className="px-5 h-16 flex items-center border-b border-border">
          <Link href="/">
            <Logo size={26} />
          </Link>
        </div>
        <div className="px-3 py-3 text-xs uppercase tracking-wider text-muted">
          {roleLabel}
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {nav.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-surface-2"
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
          </div>
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-state-error transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-surface border-b border-border flex items-center justify-between px-4">
        <Link href="/">
          <Logo size={22} />
        </Link>
        <button
          onClick={() => setOpenMobile((o) => !o)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-surface-2"
        >
          {nav.find((n) => pathname.startsWith(n.href))?.label ?? "Menú"}
          <ChevronDown className={cn("w-4 h-4 transition-transform", openMobile && "rotate-180")} />
        </button>
      </div>

      {openMobile && (
        <div
          onClick={() => setOpenMobile(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-30 mt-14 animate-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border-b border-border p-3 space-y-1"
          >
            {nav.map((it) => {
              const Icon = it.icon;
              const active = pathname === it.href || pathname.startsWith(it.href + "/");
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpenMobile(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-surface-2"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {it.label}
                </Link>
              );
            })}
            <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
              <ThemeToggle />
              <button onClick={onLogout} className="text-sm text-state-error px-3 py-2">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
