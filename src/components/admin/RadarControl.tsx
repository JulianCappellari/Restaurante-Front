"use client";

import {
  getAdaptiveSettings, getKitchenSignals, getOnlineControl, saveAdaptiveSettings, setOnlineControl,
  type AdaptiveSettings, type KitchenSignals, type OnlineControl,
} from "@/actions/service/service-actions";
import RadarStrip from "@/components/staff/RadarStrip";
import { useEffect, useState } from "react";

/* Encargado: dónde está la espera ahora y cuánta demanda online acepta la cocina. */
const STATION_NAME: Record<string, string> = { kitchen: "Cocina", grill: "Parrilla", salad: "Ensaladas", dessert: "Postres", bar: "Bar" };

/* Carga por estación y ajustes de la carta adaptativa. */
function StationLoad() {
  const [signals, setSignals] = useState<KitchenSignals | null>(null);
  const [settings, setSettings] = useState<AdaptiveSettings | null>(null);
  const [draft, setDraft] = useState<{ saturation: string; fast: string; capacity: Record<string, string> }>({ saturation: "", fast: "", capacity: {} });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = () => getKitchenSignals().then((value) => { if (active) setSignals(value); }).catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 30_000);
    getAdaptiveSettings().then((value) => {
      if (!active) return;
      setSettings(value);
      setDraft({
        saturation: String(value.saturationMinutes), fast: String(value.fastMinutes),
        capacity: Object.fromEntries(Object.entries(value.capacity).map(([station, amount]) => [station, String(amount)])),
      });
    }).catch((problem) => setError(problem instanceof Error ? problem.message : "No se pudieron leer los ajustes."));
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  async function save(input: Parameters<typeof saveAdaptiveSettings>[0], done: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const value = await saveAdaptiveSettings(input);
      setSettings(value);
      setMessage(done);
      setSignals(await getKitchenSignals());
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  const limit = Math.max(settings?.saturationMinutes ?? 20, ...(signals?.stations.map((state) => state.queueMinutes) ?? [0])) * 1.2;
  return (
    <section className="staff-panel p-4 sm:p-6" aria-labelledby="carga-titulo">
      <h2 id="carga-titulo" className="text-xl font-bold text-gray-950">Carga por estación y carta adaptativa</h2>
      <p className="text-sm text-stone-600">
        Cuando una estación pasa el tiempo de saturación, la carta avisa la demora y sugiere platos que salen antes.
        Nunca se ocultan platos.
      </p>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p>}
      {message && <p role="status" className="mt-3 text-sm font-semibold text-green-800">{message}</p>}
      <ul className="mt-4 space-y-3">
        {signals?.stations.map((state) => (
          <li key={state.station}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold">{STATION_NAME[state.station] ?? state.station}</span>
              <span className={state.saturated ? "font-bold text-red-700" : "text-stone-600"}>
                {Math.round(state.queueMinutes)} min de cola · {state.capacity} a la vez · {state.saturated ? "Saturada" : "Normal"}
              </span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-stone-200" role="img" aria-label={`${STATION_NAME[state.station] ?? state.station}: ${Math.round(state.queueMinutes)} minutos de cola`}>
              <div className={`h-full rounded-full ${state.saturated ? "bg-red-600" : "bg-green-700"}`} style={{ width: `${Math.min(100, (state.queueMinutes / limit) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {settings && (
        <form className="mt-5 space-y-4" onSubmit={(event) => {
          event.preventDefault();
          void save({
            saturationMinutes: Number(draft.saturation), fastMinutes: Number(draft.fast),
            capacity: Object.fromEntries(Object.entries(draft.capacity).map(([station, amount]) => [station, Number(amount)])),
          }, "Ajustes guardados.");
        }}>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" className="size-5 accent-[#17336d]" checked={settings.enabled} disabled={busy}
              onChange={(event) => void save({ enabled: event.target.checked }, event.target.checked ? "Carta adaptativa activada." : "Carta adaptativa apagada.")} />
            Carta adaptativa activada
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-semibold">Minutos para considerar saturada
              <input type="number" min={1} max={240} required value={draft.saturation} onChange={(event) => setDraft({ ...draft, saturation: event.target.value })}
                className="mt-1 min-h-11 w-full rounded-lg border border-stone-300 px-3 font-normal" />
            </label>
            <label className="text-sm font-semibold">Minutos para decir &ldquo;sale rápido&rdquo;
              <input type="number" min={1} max={240} required value={draft.fast} onChange={(event) => setDraft({ ...draft, fast: event.target.value })}
                className="mt-1 min-h-11 w-full rounded-lg border border-stone-300 px-3 font-normal" />
            </label>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Platos a la vez en cada estación</legend>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Object.keys(draft.capacity).map((station) => (
                <label key={station} className="text-sm">{STATION_NAME[station] ?? station}
                  <input type="number" min={1} max={10} required value={draft.capacity[station]}
                    onChange={(event) => setDraft({ ...draft, capacity: { ...draft.capacity, [station]: event.target.value } })}
                    className="mt-1 min-h-11 w-full rounded-lg border border-stone-300 px-3" />
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" disabled={busy} className="staff-control">Guardar ajustes</button>
        </form>
      )}
    </section>
  );
}

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

      <StationLoad />

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
