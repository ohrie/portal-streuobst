import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource/epunda-slab";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/700.css";
import "./globals.css";

const BACKGROUND_COLOR = "#faf4e1";

export const metadata: Metadata = {
  title: "Streuobstwiesen Portal | Infos und Karte aller Obstwiesen in Deutschland",
  description: "Entdecke Streuobstwiesen in ganz Deutschland. Eine interaktive Karte mit allen Obstwiesen, Partnerinitiativen und Informationen rund um den traditionellen Obstbau.",
  keywords: "Streuobstwiesen, Obstwiesen, Deutschland, Karte, NABU, Obstbau, Apfelwiesen",
  authors: [{ name: "Japfel" }],
  openGraph: {
    title: "Streuobstwiesen Portal",
    description: "Entdecke Streuobstwiesen in ganz Deutschland",
    type: "website",
    locale: "de_DE",
  },
};

export const viewport: Viewport = {
  themeColor: BACKGROUND_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <Script
          defer
          src="https://analytics.chilla.dev/script.js"
          data-website-id="5d3eb06b-75e4-4a64-9fff-62d92d520471"
          data-domains="portal-streuobst.de,www.portal-streuobst.de"
          data-exclude-hash="true"
        />
      </head>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  );
}
