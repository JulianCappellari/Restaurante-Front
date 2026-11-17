"use client";

import { getOnlineControl, setOnlineControl, type OnlineControl } from "@/actions/service/service-actions";
import RadarStrip from "@/components/staff/RadarStrip";
import { useEffect, useState } from "react";

/* Encargado: dónde está la espera ahora y cuánta demanda online acepta la cocina. */
export default function RadarControl() {
  const [control, setControl] = useState<OnlineControl | null>(null);
  const [maxDraft, setMaxDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void getOnlineControl().then((value) => {
      setControl(value);
      setMaxDraft(String(value.maxActive || ""));
    }).catch((problem) => setError(problem instanceof Error ? problem.message : "No se pudo leer el control online."));
  }, []);

  async function update(input: { paused?: boolean; maxActive?: number }, done: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const value = await setOnlineControl(input);
      setControl(value);
      setMaxDraft(String(value.maxActive || ""));
      setMessage(done);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <RadarStrip role="manager" title="Radar de demoras del salón y la cocina" showRole limit={20} />

      <section className="staff-panel p-4 sm:p-6" aria-labelledby="online-titulo">
        <h2 id="online-titulo" className="text-xl font-bold text-gray-950">Pedidos online según la carga</h2>
        <p className="text-sm text-stone-600">
          Antes de confirmar, el cliente ve una espera calculada con la carga de cada estación.
          Si la cocina se satura, pausá o limitá los pedidos online para que el salón no se desordene.
        </p>
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p>}
        {message && <p role="status" className="mt-3 text-sm font-semibold text-green-800">{message}</p>}
        {control && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-stone-50 p-4">
              <p className="text-sm text-stone-600">Online en cocina ahora</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-[#17336d]">{control.active}</p>
              <p className="text-xs text-stone-500">{control.maxActive ? `Cupo: ${control.maxActive}` : "Sin cupo fijado"}</p>
            </div>
            <div className="rounded-xl bg-stone-50 p-4">
              <p className="text-sm font-semibold text-stone-800">Recepción de pedidos online</p>
              <p className={`mt-1 text-sm font-bold ${control.paused ? "text-red-700" : "text-green-800"}`}>{control.paused ? "Pausada" : "Abierta"}</p>
              <button type="button" disabled={busy} onClick={() => update({ paused: !control.paused }, control.paused ? "Pedidos online reabiertos." : "Pedidos online pausados.")}
                className={`mt-3 min-h-11 w-full rounded-lg px-3 text-sm font-semibold text-white disabled:opacity-60 ${control.paused ? "bg-green-700" : "bg-red-700"}`}>
                {control.paused ? "Reabrir pedidos online" : "Pausar pedidos online"}
              </button>
            </div>
            <form className="rounded-xl bg-stone-50 p-4" onSubmit={(event) => {
              event.preventDefault();
              void update({ maxActive: Number(maxDraft) || 0 }, "Cupo actualizado.");
            }}>
              <label className="text-sm font-semibold text-stone-800" htmlFor="cupo">Máximo de pedidos online en cocina</label>
              <input id="cupo" type="number" min={0} max={500} value={maxDraft} placeholder="Sin límite"
                onChange={(event) => setMaxDraft(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 px-3" />
              <p className="mt-1 text-xs text-stone-500">0 o vacío: sin límite.</p>
              <button type="submit" disabled={busy} className="staff-control mt-2 w-full">Guardar cupo</button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
