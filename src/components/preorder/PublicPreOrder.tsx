"use client";

import { useEffect, useState } from "react";
import {
  cancelPublicPreOrder, getPublicPreOrder, savePublicPreOrder, type PreOrderView,
} from "@/actions/preorders/preorder-actions";
import type { KitchenSignals } from "@/actions/service/service-actions";
import type { IMenu } from "@/interfaces";
import PreOrderEditor from "./PreOrderEditor";

/* Enlace de la fila de espera: muestra la posición y deja pedir sin cuenta. */
export default function PublicPreOrder({ token, initial, menu, soldOut, kitchen }: {
  token: string; initial: PreOrderView; menu: IMenu[]; soldOut: number[]; kitchen: KitchenSignals | null;
}) {
  const [view, setView] = useState(initial);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      getPublicPreOrder(token).then((next) => setView((current) => ({ ...current, status: next.status, queue: next.queue, conversionNote: next.conversionNote }))).catch(() => undefined);
    };
    const timer = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(timer);
  }, [token]);

  const queue = view.queue;
  const seated = view.status === "converted" || queue?.status === "converted";
  return (
    <div className="space-y-5">
      <section aria-live="polite" className="rounded-2xl bg-cliente-sage p-5">
        {seated ? (
          <>
            <h2 className="text-2xl">Tu mesa está lista</h2>
            <p>Tu pedido ya está en cocina. Pasá por la recepción.</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl">Hola, {queue?.name ?? view.alias}</h2>
            <p className="mt-1">
              {queue?.position ? `Sos el número ${queue.position} en la fila` : "Estás en la fila"}
              {queue?.freeNow ? " · Hay mesa libre, avisá en recepción" : queue?.minutes != null ? ` · Espera estimada: ${queue.minutes} min` : ""}
            </p>
          </>
        )}
      </section>
      {seated && view.conversionNote && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">{view.conversionNote}</p>}
      {!seated && (
        <PreOrderEditor initial={view.items.length ? view : null} menu={menu} soldOut={soldOut} kitchen={kitchen}
          defaultAlias={queue?.name ?? view.alias}
          onSave={async (input) => { const next = await savePublicPreOrder(token, input); setView((current) => ({ ...next, queue: current.queue })); return next; }}
          onCancel={() => cancelPublicPreOrder(token)} />
      )}
    </div>
  );
}
