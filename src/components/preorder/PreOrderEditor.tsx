"use client";

import { Check, ChevronDown, Minus, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { PreOrderInput, PreOrderView } from "@/actions/preorders/preorder-actions";
import type { KitchenSignals } from "@/actions/service/service-actions";
import type { IMenu } from "@/interfaces";
import { dishPhoto } from "@/lib/dish-photos";
import { formatARS, parseCurrency } from "@/lib/format";

/*
 * Editor del pedido anticipado. Sirve a quien reservó (con cuenta) y a quien espera mesa (con enlace).
 * Cocina lo recibe recién cuando la mesa se abre; hasta entonces se puede editar o cancelar.
 */

type Props = {
  initial: PreOrderView | null;
  menu: IMenu[];
  soldOut: number[];
  kitchen?: KitchenSignals | null;
  defaultAlias: string;
  onSave: (input: PreOrderInput) => Promise<PreOrderView>;
  onCancel?: () => Promise<unknown>;
};

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cliente-blue";

export default function PreOrderEditor({ initial, menu, soldOut, kitchen, defaultAlias, onSave, onCancel }: Props) {
  const [saved, setSaved] = useState<PreOrderView | null>(initial);
  const [editing, setEditing] = useState(!initial || initial.status === "draft");
  const [quantities, setQuantities] = useState<Record<number, number>>(
    () => Object.fromEntries((initial?.items ?? []).map((item) => [item.menuId, item.quantity])),
  );
  const [alias, setAlias] = useState(initial?.alias || defaultAlias);
  const [pacing, setPacing] = useState<"together" | "courses">(initial?.pacing ?? "courses");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const unavailable = useMemo(() => new Set(soldOut), [soldOut]);
  const dishes = useMemo(() => menu.filter((dish) => dish.available), [menu]);
  const categories = useMemo(() => [...new Set(dishes.map((dish) => dish.typeDish))], [dishes]);
  const visible = dishes.filter((dish) => !category || dish.typeDish === category);
  const count = Object.values(quantities).reduce((sum, value) => sum + value, 0);
  const total = dishes.reduce((sum, dish) => sum + parseCurrency(dish.price) * (quantities[dish.id] ?? 0), 0);

  const change = (menuId: number, delta: number) => {
    setNotice("");
    setQuantities((current) => {
      const next = Math.max(0, Math.min(20, (current[menuId] ?? 0) + delta));
      const copy = { ...current };
      if (next === 0) delete copy[menuId];
      else copy[menuId] = next;
      return copy;
    });
  };

  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const view = await onSave({
        alias, pacing, confirm: true,
        items: Object.entries(quantities).map(([menuId, quantity]) => ({ menuId: Number(menuId), quantity })),
      });
      setSaved(view);
      setEditing(false);
      setNotice("Listo. Dejamos tu pedido guardado.");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo guardar el pedido.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!onCancel) return;
    setBusy(true);
    setError("");
    try {
      await onCancel();
      setSaved(null);
      setQuantities({});
      setEditing(true);
      setNotice("Cancelaste el pedido anticipado.");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo cancelar el pedido.");
    } finally {
      setBusy(false);
    }
  }

  // Ya en cocina, o guardado y sin edición: vista de lectura.
  if (saved && !editing) {
    const converted = saved.status === "converted";
    return (
      <section aria-labelledby="pedido-guardado" className="rounded-2xl border border-cliente-line bg-white p-5">
        <h2 id="pedido-guardado" className="flex items-center gap-2 text-2xl">
          <Check aria-hidden className="size-6 text-green-700" />
          {converted ? "Tu pedido ya está en cocina" : "Tu pedido está listo para cuando te sientes"}
        </h2>
        <p className="mt-1 text-sm text-cliente-muted">
          {converted ? "Lo empezaron a preparar al abrirse la mesa." : "Cocina lo empieza cuando te sentás. El precio final es el de la carta al momento de servir."}
        </p>
        {saved.conversionNote && <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">{saved.conversionNote}</p>}
        <ul className="mt-4 divide-y divide-cliente-line">
          {saved.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2">
              <span>{item.quantity} × {item.name}{!item.available && !converted && <span className="ml-2 text-sm font-semibold text-amber-800">Sin stock hoy</span>}</span>
              <span className="tabular-nums">{formatARS(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between font-bold"><span>Total estimado</span><span className="tabular-nums">{formatARS(saved.total)}</span></p>
        {notice && <p role="status" className="mt-3 text-sm font-semibold text-green-800">{notice}</p>}
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p>}
        {saved.canEdit && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setEditing(true)} className={`${focus} customer-press min-h-12 rounded-xl bg-cliente-blue px-5 font-semibold text-white`}>Editar pedido</button>
            {onCancel && (
              <button type="button" disabled={busy} onClick={cancel} className={`${focus} customer-press inline-flex min-h-12 items-center gap-2 rounded-xl border border-cliente-line px-5 font-semibold`}>
                <Trash2 aria-hidden className="size-4" /> Cancelar pedido
              </button>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="pb-44">
      {notice && <p role="status" className="mb-3 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-900">{notice}</p>}
      <p className="text-sm text-cliente-muted">Cocina lo empieza cuando te sentás. El precio final es el de la carta al momento de servir.</p>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Tipos de plato">
        {["", ...categories].map((value) => (
          <button key={value} type="button" aria-pressed={value === category} onClick={() => setCategory(value)}
            className={`${focus} customer-press min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-semibold ${value === category ? "border-cliente-blue bg-cliente-blue text-white" : "border-cliente-line bg-white"}`}>
            {value || "Todo"}
          </button>
        ))}
      </div>

      <ul className="grid border-t border-cliente-line sm:grid-cols-2 sm:gap-x-7">
        {visible.map((dish) => {
          const qty = quantities[dish.id] ?? 0;
          const out = unavailable.has(dish.id);
          const signal = kitchen?.enabled ? kitchen.dishes[dish.id] : undefined;
          const photo = dishPhoto(dish);
          return (
            <li key={dish.id} className="flex items-center gap-3 border-b border-cliente-line py-3">
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" loading="lazy" className="size-16 shrink-0 rounded-xl bg-stone-200 object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold">{dish.nameDish}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm font-semibold tabular-nums">
                  {formatARS(parseCurrency(dish.price))}
                  {out && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs">Agotado</span>}
                  {!out && signal?.slow && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">Hoy demora ~{signal.etaMinutes} min</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Cantidad de ${dish.nameDish}`}>
                {qty > 0 && (
                  <>
                    <button type="button" onClick={() => change(dish.id, -1)} aria-label={`Quitar uno de ${dish.nameDish}`}
                      className={`${focus} customer-press grid size-11 place-items-center rounded-full border border-cliente-line`}><Minus aria-hidden className="size-4" /></button>
                    <span className="w-6 text-center font-bold tabular-nums" aria-live="polite">{qty}</span>
                  </>
                )}
                <button type="button" disabled={out} onClick={() => change(dish.id, 1)} aria-label={`Agregar ${dish.nameDish}`}
                  className={`${focus} customer-press grid size-11 place-items-center rounded-full bg-cliente-blue text-white disabled:opacity-40`}><Plus aria-hidden className="size-4" /></button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cliente-line bg-white/95 px-4 pb-3 pt-2 shadow-[0_-8px_24px_rgba(23,51,109,0.12)] backdrop-blur">
        <div className="mx-auto grid max-w-3xl gap-1">
          <details className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">
              <span className="min-w-0 truncate">A nombre de {alias || "…"} · {pacing === "courses" ? "Primero bebidas y entradas" : "Todo junto"}</span>
              <ChevronDown aria-hidden className="size-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid gap-3 pb-2">
              <label className="text-sm font-semibold">¿A nombre de quién?
                <input value={alias} maxLength={40} onChange={(event) => setAlias(event.target.value)}
                  className={`${focus} mt-1 min-h-11 w-full rounded-lg border border-cliente-line px-3 font-normal`} />
              </label>
              <fieldset className="flex flex-wrap gap-2" aria-label="Cómo sale el pedido">
                {([["courses", "Primero bebidas y entradas"], ["together", "Todo junto"]] as const).map(([value, label]) => (
                  <label key={value} className={`customer-press flex min-h-11 cursor-pointer items-center rounded-full border px-3 text-sm font-semibold ${pacing === value ? "border-cliente-blue bg-cliente-blue text-white" : "border-cliente-line"}`}>
                    <input type="radio" name="pacing" className="sr-only" checked={pacing === value} onChange={() => setPacing(value)} />{label}
                  </label>
                ))}
              </fieldset>
            </div>
          </details>
          {error && <p role="alert" className="text-sm font-semibold text-red-800">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm"><strong className="tabular-nums">{count}</strong> {count === 1 ? "plato" : "platos"} · <strong className="tabular-nums">{formatARS(total)}</strong></p>
            <div className="flex gap-2">
              {saved && <button type="button" onClick={() => { setEditing(false); setError(""); }} className={`${focus} customer-press min-h-12 rounded-xl border border-cliente-line px-4 font-semibold`}>Volver</button>}
              <button type="button" disabled={busy || count === 0} onClick={save} aria-label="Dejar pedido para cuando llegue"
                className={`${focus} customer-press min-h-12 rounded-xl bg-cliente-blue px-5 font-semibold text-white disabled:opacity-50`}>
                {busy ? "Guardando…" : "Dejar pedido"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
