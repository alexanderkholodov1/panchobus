"use client";

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
  Bus,
  BarChart3,
  Hourglass,
  Megaphone
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();
  const L = t.landing;
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-usfq-red via-[#C61621] to-[#8C0F18]" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 50%, white 0%, transparent 55%), radial-gradient(circle at 85% 20%, white 0%, transparent 45%)"
          }}
          aria-hidden
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 2xl:py-40">
          <div className="max-w-3xl text-white">
            <Badge variant="default" className="bg-white/15 border-white/30 text-white mb-6">
              {L.badge}
            </Badge>
            <h1 className="font-display text-5xl sm:text-6xl 2xl:text-7xl leading-[1.05] mb-6">
              {L.titleA}
              <br />
              <span className="italic">{L.titleB}</span>
            </h1>
            <p className="text-lg sm:text-xl 2xl:text-2xl text-white/85 max-w-xl mb-8 leading-relaxed">
              {L.subtitle}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/registro">
                <Button size="lg" className="bg-white text-usfq-red hover:bg-white/90 font-semibold">
                  {L.ctaCreate}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" className="bg-transparent border-2 border-white/40 text-white hover:bg-white/10">
                  {L.ctaLogin}
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/70">
              <span className="flex items-center gap-2">
                <Bus className="w-4 h-4" />
                {L.stat1}
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {L.stat2}
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {L.stat3}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="py-20 sm:py-24 2xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-sm uppercase tracking-wider text-primary font-medium mb-2">
              {L.howKicker}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl mb-3">
              {L.howTitle}
            </h2>
            <p className="text-muted text-sm sm:text-base">
              {L.howSubtitle}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[ShieldCheck, CalendarCheck, QrCode].map((icon, i) => ({
              icon,
              step: `0${i + 1}`,
              title: L.steps[i].title,
              desc: L.steps[i].desc
            })).map((it) => {
              const Icon = it.icon;
              return (
                <Card key={it.step} className="hover:shadow-card-lg transition-shadow">
                  <CardBody className="space-y-4 p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-usfq-red-tint flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-display text-3xl text-border">{it.step}</span>
                    </div>
                    <h3 className="font-display text-xl">{it.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{it.desc}</p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* PARA QUIÉN ES */}
      <section id="acceso" className="py-20 sm:py-24 2xl:py-32 bg-surface-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-sm uppercase tracking-wider text-primary font-medium mb-2">{L.rolesKicker}</p>
            <h2 className="font-display text-3xl sm:text-4xl mb-3">
              {L.rolesTitle}
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                role: L.roleStudents,
                color: "bg-usfq-red-tint",
                iconColor: "text-primary",
                features: L.studentFeatures
              },
              {
                icon: Bus,
                role: L.roleStaff,
                color: "bg-[#E8F4EF] dark:bg-[#2A7D4F]/15",
                iconColor: "text-[#2A7D4F]",
                features: L.staffFeatures
              },
              {
                icon: BarChart3,
                role: L.roleAdmin,
                color: "bg-amber-50 dark:bg-amber-950/20",
                iconColor: "text-amber-600",
                features: L.adminFeatures
              }
            ].map((it) => {
              const Icon = it.icon;
              return (
                <Card key={it.role} className="overflow-hidden">
                  <div className={`p-5 ${it.color}`}>
                    <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center mb-3">
                      <Icon className={`w-5 h-5 ${it.iconColor}`} />
                    </div>
                    <h3 className="font-display text-xl">{it.role}</h3>
                  </div>
                  <CardBody className="pt-4">
                    <ul className="space-y-2">
                      {it.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${it.iconColor} bg-current`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Differentiators + demand analysis */}
      <section id="operacion" className="py-20 sm:py-24 2xl:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-sm uppercase tracking-wider text-primary font-medium mb-2">{L.whyKicker}</p>
              <h2 className="font-display text-3xl sm:text-4xl mb-5">
                {L.whyTitleA}<br />{L.whyTitleB}
              </h2>
              <p className="text-muted mb-8 leading-relaxed">
                {L.whyText}
              </p>
              <ul className="space-y-4">
                {[CalendarCheck, Hourglass, QrCode, MapPin, Megaphone, ShieldCheck].map((icon, i) => ({ icon, text: L.whyItems[i] })).map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-usfq-red-tint flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Demand analysis card */}
            <div className="bg-gradient-to-br from-usfq-red to-[#8C0F18] rounded-3xl p-8 sm:p-10 text-white shadow-card-lg">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium opacity-90">{L.insightsLabel}</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl mb-3 leading-tight">
                {L.insightsTitle}
              </h3>
              <p className="text-white/80 mb-7 text-sm leading-relaxed">
                {L.insightsText}
              </p>
              <div className="space-y-2.5">
                {L.insightsItems.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 bg-white/10 rounded-xl px-4 py-2.5 text-sm">
                    <Sparkles className="w-3.5 h-3.5 opacity-70 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 2xl:py-28 bg-surface-2">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Badge variant="default" className="mb-4">{L.ctaBadge}</Badge>
          <h2 className="font-display text-3xl sm:text-4xl 2xl:text-5xl mb-4">
            {L.ctaTitle}
          </h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">
            {L.ctaText}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/registro">
              <Button size="lg">
                {L.ctaStart} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                {L.ctaLoginAlt}
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted mt-5">
            {L.ctaNote}
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
