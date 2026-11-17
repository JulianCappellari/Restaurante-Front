import Link from "next/link";
import { ArrowLeft, Utensils } from "lucide-react";

export default function NotFound() {
  return (
    <main data-customer className="grid min-h-dvh items-center px-5 py-12">
      <div className="mx-auto w-full max-w-lg">
        <div className="grid size-14 place-items-center rounded-xl bg-cliente-butter text-cliente-ink">
          <Utensils aria-hidden className="size-6" />
        </div>
        <h1 data-split className="mt-5 text-4xl sm:text-5xl">No encontramos esa página</h1>
        <p className="mt-3 max-w-sm text-cliente-muted">Podés volver al inicio o seguir explorando los platos de la carta.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/menu" className="customer-press inline-flex min-h-11 items-center rounded-xl bg-cliente-blue px-4 font-semibold text-white hover:bg-cliente-ink">Explorar la carta</Link>
          <Link href="/" className="customer-press inline-flex min-h-11 items-center gap-2 rounded-xl border border-cliente-line bg-white px-4 font-semibold text-cliente-ink hover:bg-cliente-mist">
            <ArrowLeft aria-hidden className="size-4" /> Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
