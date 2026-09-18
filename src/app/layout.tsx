import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Souk.dz",
  description: "Petites annonces en Algérie",
  metadataBase: new URL("https://souk.dz"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" dir="ltr">
      <body className="bg-[var(--souk-bg)] text-slate-900 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}