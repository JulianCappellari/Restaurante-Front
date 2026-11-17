import type { Metadata } from "next";
import DiningMenu from "./DiningMenu";

export const metadata: Metadata = {
  title: "Menú de mesa | Restaurante",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function DiningPage() {
  return <DiningMenu />;
}
