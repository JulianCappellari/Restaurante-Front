"use client";

import { getWaiterWork, markCallAttended, takeCall, type WaiterWork } from "@/actions/table-sessions/dining-actions";
import { cancelTablePayment, confirmTablePayment, offerSubstitution, resolveSubstitution } from "@/actions/service/service-actions";
import { formatARS } from "@/lib/format";
import { AlarmClock, Bell, Check, CreditCard, Footprints, HandHelping, Replace, Utensils, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type PromiseAction = () => Promise<void>;

const reasonLabel: Record<string, string> = {
  pedido: "Quiere pedir", consulta: "Consulta", cuenta: "Pide la cuenta", asistencia: "Necesita ayuda",
};
const methodLabel: Record<string, string> = { cash: "efectivo", card: "tarjeta", mp: "Mercado Pago" };

export default function WaiterServiceQueue({ revision, selectTable, serveDish, onCounts }: {
  onCounts?: (counts: { calls: number; dishes: number }) => void;
  revision: number;
  selectTable: (tableId: number) => void;
  serveDish: (itemId: number) => Promise<void>;
}) {
  const [work, setWork] = useState<WaiterWork | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [choice, setChoice] = useState<Record<number, number>>({});
  const latest = useRef(0);
  const lastTotal = useRef<number | null>(null);

  const load = useCallback(async () => {
    const request = ++latest.current;
    try {
      const fresh = await getWaiterWork();
      if (request === latest.current) {
        setWork(fresh);
        setError("");
      }
    } catch {
      if (request === latest.current) setError("No pudimos actualizar la bandeja de servicio.");
    }
  }, []);

  useEffect(() => { void load(); }, [load, revision]);
  useEffect(() => {
    if (!work) return;
    const payments = work.payments?.length ?? 0;
    onCounts?.({ calls: work.calls.length + payments, dishes: work.dishes.length });
    // Vibración corta en el celular del mozo cuando entra trabajo nuevo.
    const total = work.calls.length + work.dishes.length + payments;
    if (lastTotal.current !== null && total > lastTotal.current && "vibrate" in navigator) navigator.vibrate?.([120, 60, 120]);
    lastTotal.current = total;
  }, [work, onCounts]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function perform(key: string, action: PromiseAction, done?: string) {
    if (busy) return;
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await action();
      await load();
      if (done) setNotice(done);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo confirmar. Revisá el estado y volvé a intentar.");
    } finally {
      setBusy(null);
    }
  }

  const button = "staff-control";
  const payments = work?.payments ?? [];
  const delayed = work?.delayed ?? [];
  return (
    <section aria-labelledby="service-queue" className="staff-panel p-4 sm:p-5">
      <h2 id="service-queue" className="text-xl font-bold text-stone-950">Bandeja de servicio</h2>
      {error && <p className="mt-2 text-sm text-primario-900" role="alert">{error} <button type="button" className="font-semibold underline" onClick={load}>Actualizar</button></p>}
      {notice && <p className="mt-2 text-sm font-semibold text-green-800" role="status">{notice}</p>}
      {!work ? !error && <p className="mt-3 text-sm text-stone-700" role="status">Cargando llamados y platos listos…</p> : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {payments.length > 0 && (
            <div className="staff-queue md:col-span-2" data-work="payments">
              <h3 className="staff-lane-title"><CreditCard aria-hidden className="size-4" /> Cobros pedidos desde la mesa <span>{payments.length}</span></h3>
              <ul className="mt-2 divide-y divide-[var(--lane-line)]">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <div>
                      <p className="font-semibold">Mesa {payment.tableNum} · {formatARS(payment.amount)}{payment.tip > 0 ? ` + ${formatARS(payment.tip)} propina` : ""}</p>
                      <p className="text-stone-600">Con {methodLabel[payment.method] ?? payment.method} · hace {payment.minutesWaiting} min</p>
                      {(payment.covers?.length ?? 0) > 0 && (
                        <p className="text-stone-700">Cubre a {payment.covers?.join(", ")}{payment.requestedBy ? ` · lo pidió ${payment.requestedBy}` : ""}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className={button} disabled={busy !== null}
                        onClick={() => perform(`pay-${payment.id}`, async () => {
                          const result = await confirmTablePayment(payment.id);
                          setNotice(result.tableClosed ? `Mesa ${payment.tableNum} cobrada y liberada.` : "Cobro registrado.");
                        })}>
                        <Check aria-hidden className="size-4" /> {busy === `pay-${payment.id}` ? "Registrando…" : "Cobrado"}
                      </button>
                      <button type="button" className={button} aria-label={`Rechazar cobro de la mesa ${payment.tableNum}`} disabled={busy !== null}
                        onClick={() => perform(`cancel-${payment.id}`, async () => { await cancelTablePayment(payment.id); }, "Cobro rechazado.")}>
                        <X aria-hidden className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(work.substitutions?.length ?? 0) > 0 && (
            <div className="staff-queue md:col-span-2" data-work="changes">
              <h3 className="staff-lane-title"><Replace aria-hidden className="size-4" /> Cambios por faltante <span>{work.substitutions?.length}</span></h3>
              <ul className="mt-2 divide-y divide-[var(--lane-line)]">
                {work.substitutions?.map((change) => (
                  <li key={change.id} className="py-2 text-sm">
                    <p className="font-semibold">Mesa {change.tableNum ?? "?"}: {change.quantity}× {change.dish}{change.owners.length ? ` (para ${change.owners.join(", ")})` : ""}</p>
                    {change.status === "offered" && change.proposed ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-stone-700">Ofrecido: {change.proposed.name} ({change.proposed.priceDiff >= 0 ? "+" : "−"}{formatARS(Math.abs(change.proposed.priceDiff))})</span>
                        {change.guestConfirms && <span className="text-xs font-semibold text-amber-800">Esperando que confirme en su celular</span>}
                        <button type="button" className={button} disabled={busy !== null}
                          onClick={() => perform(`acc-${change.id}`, async () => { await resolveSubstitution(change.id, true); }, "Cambio confirmado: cocina ya lo tiene.")}>
                          <Check aria-hidden className="size-4" /> {change.guestConfirms ? "Confirmó en persona" : "Acepta"}
                        </button>
                        <button type="button" className={button} disabled={busy !== null}
                          onClick={() => perform(`rej-${change.id}`, async () => { await resolveSubstitution(change.id, false); }, "Plato quitado del pedido.")}>
                          <X aria-hidden className="size-4" /> Quitar plato
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <label className="sr-only" htmlFor={`alt-${change.id}`}>Alternativa</label>
                        <select id={`alt-${change.id}`} className="min-h-11 rounded-lg border border-stone-300 bg-white px-2"
                          value={choice[change.id] ?? ""} onChange={(event) => setChoice({ ...choice, [change.id]: Number(event.target.value) })}>
                          <option value="">Elegí una alternativa…</option>
                          {change.alternatives.map((alt) => (
                            <option key={alt.id} value={alt.id}>{alt.name} ({alt.priceDiff >= 0 ? "+" : "−"}{formatARS(Math.abs(alt.priceDiff))})</option>
                          ))}
                        </select>
                        <button type="button" className={button} disabled={busy !== null || !choice[change.id]}
                          onClick={() => perform(`offer-${change.id}`, async () => { await offerSubstitution(change.id, choice[change.id]); }, "Alternativa ofrecida.")}>
                          Ofrecer
                        </button>
                        <button type="button" className={button} disabled={busy !== null}
                          onClick={() => perform(`rej-${change.id}`, async () => { await resolveSubstitution(change.id, false); }, "Plato quitado del pedido.")}>
                          Quitar plato
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="staff-queue" data-work="calls">
            <h3 className="staff-lane-title"><Bell aria-hidden className="size-4" /> Llamados pendientes <span>{work.calls.length}</span></h3>
            {work.calls.length === 0 ? <p className="mt-2 text-sm text-stone-600">No hay llamados pendientes.</p> : (
              <ul className="mt-2 divide-y divide-[var(--lane-line)]">
                {work.calls.map((call) => (
                  <li key={call.id} className={`flex flex-wrap items-start justify-between gap-2 py-2 text-sm ${call.assisted ? "rounded-lg bg-white/70 px-2" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <button type="button" className="min-h-11 font-semibold text-primario-800 underline underline-offset-4" onClick={() => selectTable(call.tableId)}>Mesa {call.tableNum}</button>
                      <p className="flex items-center gap-1.5 text-stone-700">
                        {call.assisted && <HandHelping aria-hidden className="size-4 text-amber-700" />}
                        <strong>{reasonLabel[call.reason ?? "consulta"] ?? "Consulta"}</strong>
                        {call.minutesWaiting !== undefined && <span>· hace {call.minutesWaiting} min</span>}
                      </p>
                      {call.takenBy && <p className="text-xs font-semibold text-green-800">Lo tomó {call.takenBy}</p>}
                      {call.summary && call.summary.lines.length > 0 && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs font-semibold text-primario-800">
                            Ya confirmado: {call.summary.served} servidos · {call.summary.ready} listos · {call.summary.pending} en curso
                          </summary>
                          <ul className="mt-1 space-y-0.5 text-xs text-stone-700">
                            {call.summary.lines.map((line) => <li key={line}>{line}</li>)}
                          </ul>
                        </details>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!call.takenBy && (
                        <button type="button" className={button} disabled={busy !== null}
                          onClick={() => perform(`take-${call.id}`, async () => { await takeCall(call.id); }, `Tomaste el aviso de la mesa ${call.tableNum}.`)}>
                          <Footprints aria-hidden className="size-4" /> {busy === `take-${call.id}` ? "Tomando…" : "Voy"}
                        </button>
                      )}
                      <button type="button" className={button} disabled={busy !== null}
                        onClick={() => perform(`call-${call.id}`, async () => { await markCallAttended(call.id); })}>
                        <Check aria-hidden className="size-4" /> {busy === `call-${call.id}` ? "Confirmando…" : "Atendido"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="staff-queue" data-work="dishes">
            <h3 className="staff-lane-title"><Utensils aria-hidden className="size-4" /> Platos listos <span>{work.dishes.length}</span></h3>
            {work.dishes.length === 0 ? <p className="mt-2 text-sm text-stone-600">No hay platos listos para servir.</p> : (
              <ul className="mt-2 divide-y divide-[var(--lane-line)]">
                {[...work.dishes].sort((a, b) => (b.minutesReady ?? 0) - (a.minutesReady ?? 0)).map((dish) => (
                  <li key={dish.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <div className="min-w-0">
                      <button type="button" className="min-h-11 font-semibold text-primario-800 underline underline-offset-4" onClick={() => selectTable(dish.tableId)}>Mesa {dish.tableNum}</button>
                      <p>{dish.quantity} × {dish.name} <span className="text-stone-600">(#{dish.orderId})</span></p>
                      {(dish.minutesReady ?? 0) >= 3 && <p className="text-xs font-semibold text-red-700">Listo hace {dish.minutesReady} min: se enfría</p>}
                    </div>
                    <button type="button" className={button} disabled={busy !== null}
                      onClick={() => perform(`dish-${dish.id}`, () => serveDish(dish.id))}>
                      <Check aria-hidden className="size-4" /> {busy === `dish-${dish.id}` ? "Confirmando…" : "Servido"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {delayed.length > 0 && (
            <div className="staff-queue md:col-span-2" data-work="delayed">
              <h3 className="staff-lane-title"><AlarmClock aria-hidden className="size-4" /> Platos demorados en cocina <span>{delayed.length}</span></h3>
              <p className="text-xs text-stone-600">Avisá a la mesa antes de que pregunte.</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {delayed.slice(0, 8).map((item) => (
                  <li key={item.id} className="rounded-lg bg-white px-2.5 py-1.5 text-sm ring-1 ring-red-200">
                    Mesa {item.tableNum}: {item.name} <strong className="text-red-700">+{item.minutesLate} min</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
