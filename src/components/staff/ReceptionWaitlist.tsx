"use client";

import {
  addWaitlistEntry, getWaitlistEstimate, listWaitlist, updateWaitlistStatus, type WaitlistEntry,
} from "@/actions/service/service-actions";
import { MessageCircle, UserCheck, UserX } from "lucide-react";
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
                    <button type="button" className="staff-control" disabled={busy !== null} onClick={() => setStatus(entry, "converted")}>
                      <UserCheck aria-hidden className="size-4" /> Sentado
                    </button>
                    <button type="button" className="staff-control" aria-label={`${entry.name} se fue`} disabled={busy !== null} onClick={() => setStatus(entry, "cancelled")}>
                      <UserX aria-hidden className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
