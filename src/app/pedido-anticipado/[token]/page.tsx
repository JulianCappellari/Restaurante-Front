import type { Metadata } from "next";
import Image from "next/image";
import { getAllmenu } from "@/actions/menu/get-all-menu";
import { getPublicPreOrder } from "@/actions/preorders/preorder-actions";
import { getMenuSignals } from "@/actions/service/service-actions";
import PublicPreOrder from "@/components/preorder/PublicPreOrder";

export const metadata: Metadata = {
  title: "Pedí mientras esperás | Restaurante",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function WaitlistPreOrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let view: Awaited<ReturnType<typeof getPublicPreOrder>> | null = null;
  let failure = "";
  try {
    view = await getPublicPreOrder(token);
  } catch (error) {
    failure = error instanceof Error ? error.message : "Este enlace no es válido.";
  }
  const [menu, signals] = view
    ? await Promise.all([getAllmenu(), getMenuSignals().catch(() => null)])
    : [[], null];

  return (
    <main className="min-h-screen bg-cliente-paper text-cliente-ink">
      <div className="relative h-40 overflow-hidden bg-cliente-blue sm:h-56">
        <Image src="/fotos/33-espera-restaurante.webp" alt="Sala de espera del restaurante" fill priority sizes="100vw" className="object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-cliente-blue/80 to-transparent" />
        <h1 className="absolute bottom-4 left-4 right-4 mx-auto max-w-3xl text-4xl leading-none text-white sm:text-6xl">Pedí mientras esperás</h1>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-6">
        {!view ? (
          <div role="alert" className="rounded-2xl border border-cliente-line bg-white p-5">
            <h2 className="text-2xl">No pudimos abrir este enlace</h2>
            <p className="mt-1 text-cliente-muted">{failure} Pedí uno nuevo en la recepción.</p>
          </div>
        ) : (
          <PublicPreOrder token={token} initial={view} menu={menu} soldOut={signals?.soldOut ?? []} kitchen={signals?.kitchen ?? null} />
        )}
      </div>
    </main>
  );
}
