import { Logo } from "@/components/brand/logo";
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface-2 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-8">
        <div>
          <Logo size={26} />
          <p className="text-sm text-muted mt-3 max-w-xs">
            Transporte universitario USFQ. Reserva tu cupo y sigue tu bus en
            tiempo real.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Plataforma</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="/#como-funciona" className="hover:text-foreground">
                Cómo funciona
              </Link>
            </li>
            <li>
              <Link href="/#rutas" className="hover:text-foreground">
                Rutas disponibles
              </Link>
            </li>
            <li>
              <Link href="/registro" className="hover:text-foreground">
                Crear cuenta
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">USFQ</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <a href="mailto:panchobus@usfq.edu.ec" className="hover:text-foreground">
                panchobus@usfq.edu.ec
              </a>
            </li>
            <li>Oficina PF104, Campus Cumbayá</li>
            <li className="text-xs pt-1">Diego de Robles s/n y Vía Interoceánica</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Universidad San Francisco de Quito · Proyecto académico Desarrollo Web 2
      </div>
    </footer>
  );
}
