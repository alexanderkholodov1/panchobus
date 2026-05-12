import type { Metadata, Viewport } from "next";
import { Inter, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { DemoSessionProvider } from "@/components/providers/demo-session";
import { Toaster } from "@/components/ui/toaster";

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
  title: "Pancho Bus · USFQ",
  description:
    "Transporte universitario USFQ. Reserva tu cupo, sigue tu bus en tiempo real y gestiona rutas desde una sola plataforma.",
  applicationName: "Pancho Bus",
  authors: [{ name: "USFQ" }],
  keywords: ["USFQ", "Pancho Bus", "transporte", "universidad", "Cumbayá", "Quito"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pancho Bus",
  },
  icons: {
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "Pancho Bus · USFQ",
    description: "Transporte universitario USFQ — moderno, accesible, en tiempo real.",
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
          <DemoSessionProvider>
            {children}
            <Toaster />
          </DemoSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
