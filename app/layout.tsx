import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pathly — din personliga att-göra-lista",
  description:
    "En att-göra-lista som känns gjord just för dig. Snabb, privat och helt gratis — allt sparas i din webbläsare, inga konton, ingen spårning.",
  applicationName: "Pathly",
  appleWebApp: { capable: true, title: "Pathly", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
