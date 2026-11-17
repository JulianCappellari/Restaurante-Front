// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Bricolage_Grotesque, Poppins } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider"; // <— cambio
import { SmoothLenis } from "@/components/ui/smooth-lenis";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400","600","700"],
  variable: "--font-sans",
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-home-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Restaurante App",
  description: "Pagina web para un restaurante",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${poppins.variable} ${display.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SmoothLenis />
          <div className="min-h-dvh">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
