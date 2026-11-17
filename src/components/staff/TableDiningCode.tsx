"use client";

import { issueTableCode } from "@/actions/table-sessions/dining-actions";
import { Download, ExternalLink, QrCode } from "lucide-react";
import { useState } from "react";

export default function TableDiningCode({ sessionId, tableNum }: { sessionId: number; tableNum: number }) {
  const [qr, setQr] = useState<{ url: string; image: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const QRCode = await import("qrcode");
      const { code } = await issueTableCode(sessionId);
      const url = new URL("/mesa", window.location.origin);
      url.hash = code;
      const image = await QRCode.toDataURL(url.href, { width: 512, margin: 4, errorCorrectionLevel: "M" });
      setQr({ url: url.href, image });
    } catch {
      setError("No se pudo generar el QR. Volvé a intentar.");
    } finally {
      setBusy(false);
    }
  }

  const action = "staff-control";
  return (
    <div className="mt-4 rounded-xl border border-primario-200 bg-primario-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-stone-950"><QrCode aria-hidden className="size-5" /> QR de mesa {tableNum}</h3>
          <p className="mt-1 text-sm text-stone-700">Compartilo con los comensales de esta visita.</p>
        </div>
        <button className={action} type="button" disabled={busy} onClick={generate}>
          {busy ? "Generando…" : qr ? "Renovar QR" : "Generar QR"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-primario-900" role="alert">{error}</p>}
      {qr && (
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="size-48 max-w-full rounded-lg bg-white" width={192} height={192} src={qr.image} alt={`QR del menú de la mesa ${tableNum}`} />
          <div className="flex flex-wrap gap-2">
            <a className={action} href={qr.image} download={`mesa-${tableNum}.png`}><Download aria-hidden className="size-4" /> Descargar QR</a>
            <a className={action} href={qr.url} target="_blank" rel="noreferrer"><ExternalLink aria-hidden className="size-4" /> Abrir menú</a>
          </div>
        </div>
      )}
    </div>
  );
}
