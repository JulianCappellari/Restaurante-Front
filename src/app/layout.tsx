import type { Metadata } from "next";
// import localFont from "next/font/local";
import "./globals.css";
// import '@aeternity/ui/dist/index.css';
import {  Poppins  } from 'next/font/google';



// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });
const poppins  = Poppins({ subsets: ['latin'], weight: ['400'] });
export const metadata: Metadata = {
  title: "Restaurante App",
  description: "Pagina web para un restaurante",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        className={`${poppins.className}  antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
