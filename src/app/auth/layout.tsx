import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Utensils } from "lucide-react";
import MotionProvider from "@/components/motion/MotionProvider";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if ((await cookies()).get("token")?.value) redirect("/");

  return (
    <main data-customer className="min-h-dvh">
      <MotionProvider />
      <div data-customer-inverse className="bg-cliente-blue text-white">
        <nav aria-label="Navegación de acceso" className="customer-shell flex min-h-16 flex-wrap items-center justify-between gap-x-3 py-2">
          <Link href="/" className="customer-wordmark flex items-center gap-2 text-lg sm:text-xl">
            <span className="grid size-9 place-items-center rounded-lg bg-cliente-butter text-cliente-ink"><Utensils aria-hidden="true" className="size-4" /></span>
            Restaurante App
          </Link>
          <Link href="/menu" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold hover:underline">
            <ArrowLeft aria-hidden="true" className="size-4" /> Volver a la carta
          </Link>
        </nav>
      </div>
      <div className="customer-shell grid items-start gap-8 py-6 md:py-9 lg:grid-cols-[1fr_1fr]">
        <figure data-reveal="scale" className="relative sticky top-8 hidden aspect-[4/5] overflow-hidden rounded-2xl lg:block">
          <Image src="/fotos/01-portada-ravioles.webp" fill sizes="560px" alt="" className="object-cover" />
          <figcaption className="absolute bottom-3 right-3 rounded bg-cliente-blue px-2 py-1 text-xs text-white">Foto ilustrativa</figcaption>
        </figure>
        <div data-reveal="up" className="mx-auto w-full max-w-xl">{children}</div>
      </div>
    </main>
  );
}
