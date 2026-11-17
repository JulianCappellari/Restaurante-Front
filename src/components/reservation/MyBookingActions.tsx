"use client";

import { ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";

type Shift = "lunch" | "dinner";
type Intent = "reschedule" | "cancel";

export default function MyBookingActions({ bookingId, currentDate, currentShift, canManage }: {
  bookingId: number;
  currentDate: string;
  currentShift?: Shift;
  canManage: boolean;
}) {
  const titleId = useId();
  const cancelDialog = useRef<HTMLDialogElement>(null);
  const changePanel = useRef<HTMLDetailsElement>(null);
  const lock = useRef(false);
  const [pending, setPending] = useState<Intent | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState<{ intent: Intent; text: string } | null>(null);
  const router = useRouter();
  const busy = pending !== null || refreshing;

  async function send(intent: Intent, body: Record<string, unknown>) {
    if (lock.current || busy) return;
    setMessage("");
    setFailure(null);
    const api = process.env.NEXT_PUBLIC_API_URL2;
    const token = Cookies.get("token");
    if (!api || !token) {
      setFailure({ intent, text: token ? "El servicio de reservas no está disponible." : "Volvé a iniciar sesión para gestionar tu reserva." });
      return;
    }
    lock.current = true;
    setPending(intent);

    try {
      const response = await fetch(`${api}/bookings/${bookingId}/${intent}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) {
        setFailure({ intent, text: intent === "cancel"
          ? "No se pudo cancelar la reserva. Volvé a intentar."
          : "No se pudo cambiar la reserva. Revisá la fecha y el turno." });
        return;
      }
      if (intent === "cancel") cancelDialog.current?.close();
      else if (changePanel.current) changePanel.current.open = false;
      setMessage(intent === "cancel" ? "Reserva cancelada." : "Reserva actualizada.");
      startRefresh(() => router.refresh());
    } catch {
      setFailure({ intent, text: "No pudimos confirmar el cambio. Volvé a cargar la página para revisar la reserva." });
    } finally {
      lock.current = false;
      setPending(null);
    }
  }

  if (!canManage) return message ? <p className="account-meta mt-3" role="status">{message}</p> : null;

  return (
    <div>
      <details ref={changePanel} className="account-details">
        <summary>Modificar fecha o turno<ChevronDown aria-hidden className="size-4" /></summary>
        <form key={`${currentDate}-${currentShift}`} onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void send("reschedule", { date: form.get("date"), shift: form.get("shift") });
        }} className="grid items-end gap-3 pb-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="grid min-w-0 gap-1 text-sm font-semibold">
            <label htmlFor={`${titleId}-date`}>Nueva fecha</label>
            <input id={`${titleId}-date`} type="date" name="date" defaultValue={currentDate} required disabled={busy}
              className="min-h-11 min-w-0 rounded-lg border border-cliente-line px-2 text-base" />
          </div>
          <div className="grid min-w-0 gap-1 text-sm font-semibold">
            <label htmlFor={`${titleId}-shift`}>Turno</label>
            <select id={`${titleId}-shift`} name="shift" defaultValue={currentShift ?? ""} required disabled={busy}
              className="min-h-11 min-w-0 rounded-lg border border-cliente-line bg-white px-2 text-base">
              <option value="" disabled>Elegí el turno</option>
              <option value="lunch">Mediodía</option>
              <option value="dinner">Noche</option>
            </select>
          </div>
          <button type="submit" disabled={busy} className="btn-primary customer-press min-h-11 justify-center">
            {pending === "reschedule" ? "Guardando…" : "Guardar cambios"}
          </button>
          {failure?.intent === "reschedule" && <p role="alert" className="text-sm text-red-800 sm:col-span-3">{failure.text}</p>}
        </form>
      </details>
      <button type="button" disabled={busy} onClick={() => { setFailure(null); cancelDialog.current?.showModal(); }}
        className="min-h-11 rounded-lg px-2 text-sm font-semibold text-red-800 underline underline-offset-4 hover:bg-red-50">
        Cancelar reserva
      </button>
      {message && <p className="account-meta mt-2" role="status">{message}</p>}
      <dialog ref={cancelDialog} aria-labelledby={titleId} className="account-dialog"
        onCancel={(event) => { if (busy) event.preventDefault(); }}>
        <h3 id={titleId} className="text-2xl">¿Cancelar la reserva #{bookingId}?</h3>
        <p className="mt-2 text-cliente-muted">Si cancelás, liberamos tu mesa para ese turno.</p>
        {failure?.intent === "cancel" && <p role="alert" className="mt-3 text-sm text-red-800">{failure.text}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => cancelDialog.current?.close()}
            className="btn-outline customer-press min-h-11">Mantener reserva</button>
          <button type="button" disabled={busy} onClick={() => void send("cancel", {})}
            className="customer-press min-h-11 rounded-lg bg-red-800 px-4 font-semibold text-white hover:bg-red-900 disabled:opacity-60">
            {pending === "cancel" ? "Cancelando…" : "Confirmar cancelación"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
