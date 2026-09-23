"use client";

import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <p className="font-display text-6xl text-primary mb-4">404</p>
          <h1 className="font-display text-2xl mb-2">{t.notFound.title}</h1>
          <p className="text-muted mb-8">{t.notFound.text}</p>
          <Link href="/" className="inline-flex items-center h-10 px-4 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90">
            {t.notFound.home}
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
