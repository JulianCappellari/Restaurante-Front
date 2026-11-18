"use client";

import {
  addWaitlistEntry, getWaitlistEstimate, listWaitlist, updateWaitlistStatus, type WaitlistEntry,
} from "@/actions/service/service-actions";
import { createTableSession } from "@/actions/table-sessions/table-session-actions";
import { createWaitlistPreOrderLink, listUpcomingPreOrders } from "@/actions/preorders/preorder-actions";
import { getFloor, type FloorTable } from "@/actions/service/service-actions";
import { Copy, MessageCircle, Send, UserCheck, UserX } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

/* Lista de espera digital: estimación según la permanencia real y aviso por WhatsApp. */
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
const currentShift = (): "lunch" | "dinner" => (new Date().getHours() < 17 ? "lunch" : "dinner");
const whatsappLink = (entry: WaitlistEntry) => {
  const digits = (entry.phone ?? "").replace(/\D/g, "");
  const text = `Hola ${entry.name}, tu mesa para ${entry.people} ya está lista. Te esperamos en la entrada.`;
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
};

export default function ReceptionWaitlist({ onCount }: { onCount?: (waiting: number) => void }) {
  const [entries, setEntries] = useState<WaitlistEntry[] | null>(null);
  const [estimates, setEstimates] = useState<Record<number, number | null>>({});
  const [form, setForm] = useState({ name: "", phone: "", people: 2 });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ordered, setOrdered] = useState<Record<number, number>>({});
  const [seating, setSeating] = useState<number | null>(null);
  const [floor, setFloor] = useState<FloorTable[]>([]);
  const [tableChoice, setTableChoice] = useState(0);

  const load = useCallback(async () => {
    try {
      const rows = (await listWaitlist())
        .filter((row) => row.date === today() && ["waiting", "notified"].includes(row.status))
        .sort((a, b) => a.id - b.id);
      setEntries(rows);
      onCount?.(rows.length);
      const sizes = [...new Set(rows.map((row) => row.people))];
      const results = await Promise.all(sizes.map(async (people) => [people, (await getWaitlistEstimate(people)).minutes] as const));
      setEstimates(Object.fromEntries(results));
      const pre = await listUpcomingPreOrders().catch(() => []);
      setOrdered(Object.fromEntries(pre.filter((row) => row.waitlistEntryId).map((row) => [row.waitlistEntryId as number, row.items.reduce((sum, item) => sum + item.quantity, 0)])));
      setError("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo cargar la lista de espera.");
    }
  }, [onCount]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("add");
    try {
      await addWaitlistEntry({ ...form, shift: currentShift(), date: today() });
      setForm({ name: "", phone: "", people: 2 });
      await load();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo agregar a la lista.");
    } finally {
      setBusy(null);
    }
  }

  async function sendMenu(entry: WaitlistEntry) {
    setBusy(`link-${entry.id}`);
    setError("");
    setNotice("");
    try {
      const { url } = await createWaitlistPreOrderLink(entry.id);
      const digits = (entry.phone ?? "").replace(/\D/g, "");
      const text = `Hola ${entry.name}, mientras esperás podés ver la carta y dejar pedidas las bebidas: ${url}`;
      if (digits) window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
      else {
        await navigator.clipboard?.writeText(url).catch(() => undefined);
        setNotice(`Enlace copiado. Pegalo en el mensaje para ${entry.name}.`);
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo crear el enlace.");
    } finally {
      setBusy(null);
    }
  }

  async function openSeating(entry: WaitlistEntry) {
    setSeating(entry.id);
    setTableChoice(0);
    try {
      setFloor((await getFloor()).filter((table) => table.state === "libre" && table.ability >= entry.people));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudieron cargar las mesas.");
    }
  }

  async function seat(entry: WaitlistEntry) {
    if (!tableChoice) return;
    setBusy(`seat-${entry.id}`);
    setError("");
    try {
      const created = await createTableSession({ tableId: tableChoice, partySize: entry.people, waitlistEntryId: entry.id });
      const result = created.preOrder;
      setNotice(result?.converted
        ? `Mesa abierta. Pedido anticipado enviado a cocina: ${result.sentItems} ${result.sentItems === 1 ? "plato" : "platos"}.${result.skipped.length ? ` Sin stock: ${result.skipped.join(", ")}.` : ""}`
        : result?.error ?? "Mesa abierta.");
      setSeating(null);
      await load();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo abrir la mesa.");
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(entry: WaitlistEntry, status: WaitlistEntry["status"]) {
    setBusy(`${status}-${entry.id}`);
    try {
      await updateWaitlistStatus(entry.id, status);
      await load();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo actualizar.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="waitlist-title" className="staff-panel p-4 sm:p-5">
      <h2 id="waitlist-title" className="text-xl font-bold text-stone-950">Lista de espera</h2>
      <p className="text-sm text-stone-600">La espera se calcula con lo que duran realmente las mesas.</p>

      <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[1.4fr_1.2fr_6rem_auto] sm:items-end">
        <label className="grid gap-1 text-sm font-semibold">Nombre
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="min-h-11 rounded-lg border border-stone-300 px-3" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">WhatsApp
          <input inputMode="tel" placeholder="54 9 11 1234 5678" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="min-h-11 rounded-lg border border-stone-300 px-3" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">Personas
          <input type="number" min={1} max={30} value={form.people} onChange={(event) => setForm({ ...form, people: Number(event.target.value) || 1 })} className="min-h-11 rounded-lg border border-stone-300 px-3" />
        </label>
        <button type="submit" disabled={busy === "add"} className="min-h-11 rounded-lg bg-[#17336d] px-4 text-sm font-semibold text-white disabled:opacity-60">
          {busy === "add" ? "Agregando…" : "Agregar"}
        </button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-950">{notice}</p>}

      {!entries ? !error && <p role="status" className="mt-4 text-sm text-stone-600">Cargando…</p> : entries.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-stone-300 p-4 text-center text-sm text-stone-600">Nadie espera en este momento.</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {entries.map((entry, index) => {
            const link = whatsappLink(entry);
            const minutes = estimates[entry.people];
            return (
              <li key={entry.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-stone-950">{index + 1}. {entry.name} · {entry.people} pers.</p>
                    <p className="text-sm text-stone-600">
                      {minutes === 0 ? "Hay mesa libre ahora" : minutes ? `Espera estimada: ${minutes} min` : "Sin estimación"}
                      {entry.status === "notified" && <strong className="ml-2 text-green-800">Avisado</strong>}
                      {ordered[entry.id] > 0 && <strong className="ml-2 text-[#17336d]">Pidió: {ordered[entry.id]} {ordered[entry.id] === 1 ? "plato" : "platos"}</strong>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer" onClick={() => { if (entry.status === "waiting") void setStatus(entry, "notified"); }}
                        className="staff-control"><MessageCircle aria-hidden className="size-4" /> Avisar</a>
                    )}
                    {!link && entry.status === "waiting" && (
                      <button type="button" className="staff-control" disabled={busy !== null} onClick={() => setStatus(entry, "notified")}>Marcar avisado</button>
                    )}
                    <button type="button" className="staff-control" disabled={busy !== null} onClick={() => sendMenu(entry)}>
                      {entry.phone ? <Send aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />} {entry.phone ? "Enviar carta para pedir" : "Copiar enlace para pedir"}
                    </button>
                    <button type="button" className="staff-control" disabled={busy !== null} onClick={() => openSeating(entry)}>
                      <UserCheck aria-hidden className="size-4" /> Sentar en mesa…
                    </button>
                    <button type="button" className="staff-control" aria-label={`${entry.name} se fue`} disabled={busy !== null} onClick={() => setStatus(entry, "cancelled")}>
                      <UserX aria-hidden className="size-4" />
                    </button>
                  </div>
                </div>
                {seating === entry.id && (
                  <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-200 pt-3">
                    <label className="grid gap-1 text-sm font-semibold">Mesa libre
                      <select value={tableChoice} onChange={(event) => setTableChoice(Number(event.target.value))} className="min-h-11 rounded-lg border border-stone-300 bg-white px-3">
                        <option value={0}>{floor.length ? "Elegí una mesa" : "No hay mesas libres para este grupo"}</option>
                        {floor.map((table) => <option key={table.id} value={table.id}>Mesa {table.tableNum} · {table.ability} lugares{table.zone ? ` · ${table.zone}` : ""}</option>)}
                      </select>
                    </label>
                    <button type="button" className="staff-control" disabled={!tableChoice || busy !== null} onClick={() => seat(entry)}>Abrir mesa</button>
                    <button type="button" className="staff-control" onClick={() => setSeating(null)}>Cancelar</button>
                    <button type="button" className="text-sm underline" disabled={busy !== null} onClick={() => setStatus(entry, "converted")}>Ya se sentó (sin abrir mesa)</button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
