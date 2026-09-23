"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { REPO_URL, useAboutProject } from "@/components/about/about-project";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useI18n } from "@/lib/i18n";

export function PublicFooter() {
  const { t } = useI18n();
  const { open } = useAboutProject();
  return (
    <footer className="border-t border-border bg-surface-2 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-8">
        <div className="space-y-3">
          <Logo size={26} />
          <p className="text-sm text-muted max-w-xs">{t.footer.tagline}</p>
          <ThemeToggle className="lg:hidden" />
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">{t.footer.platform}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/#como-funciona" className="hover:text-foreground">{t.footer.how}</Link></li>
            <li><Link href="/#acceso" className="hover:text-foreground">{t.footer.roles}</Link></li>
            <li><Link href="/registro" className="hover:text-foreground">{t.footer.createAccount}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">{t.footer.project}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><button type="button" onClick={open} className="hover:text-foreground">{t.footer.about}</button></li>
            <li><a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">{t.footer.repo}</a></li>
            <li>{t.footer.author}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 px-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Pancho Bus · {t.footer.rights}
      </div>
    </footer>
  );
}
