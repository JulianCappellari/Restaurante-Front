// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider"; // <— cambio
import { SmoothLenis } from "@/components/ui/smooth-lenis";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400","600","700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Restaurante App",
  description: "Pagina web para un restaurante",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SmoothLenis />
          <div className="min-h-dvh">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
