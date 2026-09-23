import type { Metadata, Viewport } from "next";
import { Inter, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { DemoSessionProvider } from "@/components/providers/demo-session";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n";
import { AboutProjectProvider } from "@/components/about/about-project";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const baskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Pancho Bus · Concepto de plataforma / Platform concept",
  description:
    "Concepto de plataforma para el transporte universitario de la USFQ: reservas, abordaje con QR y seguimiento de rutas. Proyecto de portafolio con datos sintéticos. / Platform concept for USFQ's university shuttle: bookings, QR boarding and route tracking. Portfolio project with synthetic data.",
  applicationName: "Pancho Bus",
  authors: [{ name: "Alexander Kholodov", url: "https://github.com/alexanderkholodov1" }],
  keywords: ["Pancho Bus", "USFQ", "transporte universitario", "university shuttle", "Quito", "portfolio"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pancho Bus",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "Pancho Bus · Platform concept",
    description: "Bookings, QR boarding and live routes for a university shuttle. Portfolio project with synthetic data.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E11B22" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0E0E" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${baskerville.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <I18nProvider>
            <DemoSessionProvider>
              <AboutProjectProvider>
                {children}
                <Toaster />
              </AboutProjectProvider>
            </DemoSessionProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
