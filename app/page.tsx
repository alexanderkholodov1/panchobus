import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  QrCode,
  MapPin,
  Sparkles,
  ShieldCheck,
  Clock,
  Users,
  ArrowRight,
  Bus
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-usfq-red via-[#C61621] to-[#8C0F18]" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, white 0%, transparent 50%), radial-gradient(circle at 80% 70%, white 0%, transparent 50%)"
          }}
          aria-hidden
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-22 sm:py-28 2xl:py-36">
          <div className="max-w-3xl text-white">
            <Badge variant="default" className="bg-white/15 border-white/30 text-white mb-5">
              Servicio oficial de transporte USFQ
            </Badge>
            <h1 className="font-display text-5xl sm:text-6xl 2xl:text-7xl leading-[1.05] mb-5">
              Tu libertad,
              <br />
              <span className="italic">comienza aquí.</span>
            </h1>
            <p className="text-lg sm:text-xl 2xl:text-2xl text-white/90 max-w-2xl mb-8">
              Pancho Bus reúne reservas, abordaje y seguimiento operativo en una sola plataforma.
              Todo lo necesario para moverse al campus con claridad y sin fricciones.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/registro">
                <Button size="lg" className="bg-white text-usfq-red hover:bg-white/90">
                  Crear mi cuenta
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-transparent border-2 border-white/40 text-white hover:bg-white/10"
                >
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Acceso seguro con cuenta institucional
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Información operativa siempre vigente
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Experiencia pensada para estudiantes, choferes y administración
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="py-20 sm:py-24 2xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm uppercase tracking-wider text-primary font-medium mb-2">
              Cómo funciona
            </p>
            <h2 className="font-display text-3xl sm:text-4xl mb-3">
              Tres pasos. Un servicio sin fricción.
            </h2>
            <p className="text-muted">
              Del registro al abordaje, todo en una sola plataforma diseñada
              para el servicio de movilidad de la USFQ.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "Regístrate",
                desc: "Crea tu cuenta con tu correo institucional. Verificación automática del dominio @usfq.edu.ec."
              },
              {
                icon: CalendarCheck,
                title: "Reserva tu cupo",
                desc: "Elige fecha, ruta y trayecto. Mira cupos disponibles en tiempo real. Si está lleno, lista de espera automática."
              },
              {
                icon: QrCode,
                title: "Aborda con tu QR",
                desc: "Recibes un código QR único por reserva. Lo muestras al chofer y listo."
              }
            ].map((it, i) => {
              const Icon = it.icon;
              return (
                <Card key={i} className="hover:shadow-card-lg transition-shadow">
                  <CardBody className="space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-usfq-red-tint flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted">0{i + 1}</span>
                      <h3 className="font-display text-xl">{it.title}</h3>
                    </div>
                    <p className="text-sm text-muted">{it.desc}</p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* RUTAS */}
      <section id="acceso" className="py-20 sm:py-24 2xl:py-32 bg-surface-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-sm uppercase tracking-wider text-primary font-medium mb-2">Acceso y privacidad</p>
              <h2 className="font-display text-3xl sm:text-4xl mb-4">
                Información operativa protegida.
              </h2>
              <p className="text-muted mb-6">
                Las rutas, paradas y horarios solo están visibles para usuarios registrados.
                El acceso se valida con correo institucional y roles asignados (estudiante, chofer, administración).
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/registro"><Button>Crear cuenta</Button></Link>
                <Link href="/login"><Button variant="outline">Iniciar sesión</Button></Link>
              </div>
            </div>
            <Card className="overflow-hidden">
              <div className="h-1.5 bg-primary" />
              <CardBody className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-usfq-red-tint flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg">Acceso verificado</h3>
                    <p className="text-sm text-muted">Solo cuentas institucionales pueden consultar rutas y cupos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-usfq-red-tint flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg">Datos sensibles protegidos</h3>
                    <p className="text-sm text-muted">Paradas, horarios y asignaciones se muestran dentro de la app privada.</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* DIFERENCIADORES */}
      <section className="py-20 sm:py-24 2xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm uppercase tracking-wider text-primary font-medium mb-2">Por qué Pancho Bus</p>
              <h2 className="font-display text-3xl sm:text-4xl mb-5">Diseñado para el campus, hecho para ti.</h2>
              <p className="text-muted mb-6">
                Reemplazamos procesos dispersos por una experiencia unificada enfocada en el transporte universitario.
                Cada interacción reduce tiempos de gestión y mejora la coordinación operativa.
              </p>
              <ul className="space-y-3">
                {[
                  "Reservas autoservicio con cupos visibles en vivo",
                  "Lista de espera automática para rutas saturadas",
                  "QR único por reserva, sin colas innecesarias",
                  "Mapa interactivo y tracking GPS de cada bus",
                  "Comunicación directa entre admin, choferes y estudiantes",
                  "Diseño accesible, responsivo y pensado para móviles"
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0 mt-0.5">✓</span>
                    <span className="text-sm">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-usfq-red to-[#8C0F18] rounded-3xl p-8 sm:p-10 text-white shadow-card-lg">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium">Insights con IA</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl mb-3">Decisiones operativas basadas en datos.</h3>
              <p className="text-white/90 mb-6">
                El panel administrativo incluye análisis automatizado con IA: detecta rutas saturadas, recomienda nuevos horarios y anticipa problemas antes de que escalen.
              </p>
              <div className="space-y-3 text-sm">
                {[
                  "Ranking de rutas por demanda diaria",
                  "Recomendaciones de nuevos horarios",
                  "Detección de fricciones UX",
                  "Resumen ejecutivo diario por correo"
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Sparkles className="w-3.5 h-3.5" />{t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section id="operacion" className="py-20 sm:py-24 2xl:py-32 bg-surface-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm uppercase tracking-wider text-primary font-medium mb-2">Operación y confianza</p>
          <h2 className="font-display text-3xl sm:text-4xl mb-5">Transparencia para autoridades y usuarios</h2>
          <p className="text-muted max-w-2xl mx-auto mb-8">
            La plataforma entrega métricas claras, trazabilidad de reservas y evidencia operativa
            para tomar decisiones de movilidad con datos verificables.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm">
            <Bus className="w-4 h-4 text-primary" />
            Servicio Pancho Bus · USFQ Movilidad
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl mb-4">Súmate al nuevo Pancho Bus.</h2>
          <p className="text-muted mb-6">Una sola plataforma. Tres experiencias. Todo el campus, conectado.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/registro"><Button size="lg">Empezar ahora <ArrowRight className="w-4 h-4" /></Button></Link>
            <Link href="/login"><Button size="lg" variant="outline">Iniciar sesión</Button></Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
