import Link from "next/link";

export function CheckoutSteps({ step }: { step: "cart" | "payment" | "confirmation" }) {
  const steps = [
    { id: "cart", label: "Carrito" },
    { id: "payment", label: "Pago" },
    { id: "confirmation", label: "Confirmación" },
  ] as const;

  return (
    <nav aria-label="Pasos de la compra">
      <ol className="flex flex-wrap items-center gap-x-3 text-sm text-cliente-muted">
        {steps.map(({ id, label }, index) => (
          <li key={id} className="flex items-center gap-3">
            {index > 0 && <span aria-hidden className="text-cliente-muted">/</span>}
            {id === "cart" && step === "payment" ? (
              <Link href="/cart" className="inline-flex min-h-11 items-center underline underline-offset-4">{label}</Link>
            ) : (
              <span aria-current={step === id ? "step" : undefined}
                className={`inline-flex min-h-11 items-center ${step === id ? "font-bold text-cliente-ink" : ""}`}>
                {label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
