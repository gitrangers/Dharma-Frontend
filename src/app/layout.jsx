import { Hammersmith_One, Karla } from "next/font/google";

import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.scss";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});
const hammersmith = Hammersmith_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hammersmith",
  display: "swap",
});

export const metadata = {
  title: "Dharma Productions",
  description: "Dharma Productions — Official site (Next.js frontend)",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${karla.variable} ${hammersmith.variable}`}>
      <head>
        {/* Preload FA woff2 fonts so they're ready when the lazy CSS fires */}
        <link rel="preload" as="font" type="font/woff2" href="/fonts/fa/fa-brands-400.woff2" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/woff2" href="/fonts/fa/fa-solid-900.woff2" crossOrigin="anonymous" />
      </head>
      <body className={`${karla.className} bg-white d-flex flex-column min-vh-100`}>
        <SiteHeader />
        <main className="site-main flex-grow-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
