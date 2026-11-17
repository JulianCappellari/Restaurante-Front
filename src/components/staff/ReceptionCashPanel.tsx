"use client";

import { closeCashRegister, createOpsResource, listOpsResource } from "@/actions/advanced/advanced-actions";
import { formatARS, parseCurrency } from "@/lib/format";
import { Banknote, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CashRegisterRow = {
  id: number;
  openedBy?: number;
  closedBy?: number | null;
  openingAmount: number | string;
  closingAmount?: number | string | null;
  expectedAmount?: number | string | null;
  status: "open" | "closed";
  notes?: string | null;
};

export default function ReceptionCashPanel() {
  const [rows, setRows] = useState<CashRegisterRow[]>([]);
  const [openingAmount, setOpeningAmount] = useState("0");
  const [closingAmount, setClosingAmount] = useState("");
  const [notes, setNotes] = useState("Turno recepcion");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openRegister = useMemo(() => rows.find((row) => row.status === "open"), [rows]);

  const load = async () => {
    try {
      setRows(await listOpsResource<CashRegisterRow>("cashRegisters"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar las cajas.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = async () => {
    setLoading(true);
    try {
      await createOpsResource("cashRegisters", {
        openingAmount: parseCurrency(openingAmount),
        status: "open",
        notes,
      });
      setMessage("Caja abierta correctamente.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo abrir la caja.");
    } finally {
      setLoading(false);
    }
  };

  const close = async () => {
    if (!openRegister) return;
    setLoading(true);
    try {
      await closeCashRegister(openRegister.id, {
        closingAmount: parseCurrency(closingAmount),
        notes,
      });
      setClosingAmount("");
      setMessage("Caja cerrada correctamente.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cerrar la caja.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="staff-panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-950">Caja de recepción</h2>
          <p className="mt-1 text-sm text-gray-600">Administradores y recepcionistas pueden abrir o cerrar caja.</p>
        </div>
        <Banknote className="h-5 w-5 text-primario-700" />
      </div>

      {openRegister ? (
        <div className="mt-4 rounded-lg border border-green-100 bg-green-50 p-4">
          <p className="font-bold text-green-800">Caja #{openRegister.id} abierta</p>
          <p className="mt-1 text-sm text-green-700">Monto inicial: {formatARS(openRegister.openingAmount)}</p>
          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Monto contado al cierre</span>
            <input
              value={closingAmount}
              onChange={(event) => setClosingAmount(event.target.value)}
              inputMode="decimal"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Ej: 85000"
            />
          </label>
          <button
            type="button"
            onClick={close}
            disabled={loading || parseCurrency(closingAmount) <= 0}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-50"
          >
            <LockKeyhole className="h-4 w-4" />
            Cerrar caja
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-stone-100 bg-stone-50 p-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Monto inicial</span>
            <input
              value={openingAmount}
              onChange={(event) => setOpeningAmount(event.target.value)}
              inputMode="decimal"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Notas</span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={open}
            disabled={loading}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primario-600 px-3 py-2 text-sm font-bold text-white disabled:bg-gray-300"
          >
            <UnlockKeyhole className="h-4 w-4" />
            Abrir caja
          </button>
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-gray-700">
          {message}
        </div>
      )}
    </section>
  );
}
