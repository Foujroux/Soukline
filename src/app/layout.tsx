import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { dictionaries } from "@/lib/dictionary";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Souk.dz",
  // Only a fallback for routes outside /[lang] (the root redirect and the
  // global not-found). Every real page overrides this from
  // dictionary.meta.description, which carries the Arabic variant too.
  description: dictionaries.fr.meta.description,
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