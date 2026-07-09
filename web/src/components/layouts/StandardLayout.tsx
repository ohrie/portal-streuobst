import Footer from "@/components/Footer";
import Header from "@/components/Header";

interface StandardLayoutProps {
  children: React.ReactNode;
  noShadow?: boolean;
}

/**
 * Standard Layout - Navigation + Inhalt + Footer
 * Verwendet für: Alle Seiten außer Kartenseite
 */
export default function StandardLayout({
  children,
  noShadow = false,
}: StandardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header noShadow={noShadow} />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
