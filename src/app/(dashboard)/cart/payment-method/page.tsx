"use client";

import { useShallow } from "zustand/react/shallow";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Banknote, Check, CreditCard, Loader2, MapPin, PlusCircle, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { postPaymentMethod } from "@/actions/payment-methods/post-payment.methods";
import { getPaymentMethods } from "@/actions/payment-methods/get-payment-methods";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken";
import { OrderPayload, postOrder } from "@/actions/orders/post-order";
import { useCartStore, useCheckoutStore } from "@/store";
import { getOnlineEta, type OnlineEta } from "@/actions/service/service-actions";
import type { IAddress, IPaymentMethod } from "@/interfaces";
import { formatARS, parseCurrency } from "@/lib/format";
import { useUserAddress } from "@/hooks/useUserAddress";
import { CheckoutSteps } from "../ui/CheckoutSteps";
import "./checkout.css";

type CardForm = {
  name: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
};

type FormErrors = Partial<Record<keyof CardForm, string>>;

const initialCardForm: CardForm = {
  name: "",
  cardNumber: "",
  expMonth: "",
  expYear: "",
  cvv: "",
};

const primary = "btn-primary customer-press min-h-12 justify-center text-center";
type Receipt = { id?: number; total: number; address: IAddress; method: string };

export default function PaymentMethod() {
  const cart = useCartStore((state) => state.cart);
  const clearCart = useCartStore((state) => state.clearCart);
  const summary = useCartStore(useShallow((state) => state.getCartSummary()));
  const storedAddress = useCheckoutStore((state) => state.selectedAddress);

  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
  const [selected, setSelected] = useState<string>("cash");
  const cardDialog = useRef<HTMLDialogElement>(null);
  const confirmation = useRef<HTMLHeadingElement>(null);
  const orderLock = useRef(false);
  const [cardForm, setCardForm] = useState<CardForm>(initialCardForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [savingCard, setSavingCard] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [orderError, setOrderError] = useState(false);
  const [methodsError, setMethodsError] = useState(false);
  const [cardError, setCardError] = useState("");
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [eta, setEta] = useState<OnlineEta | null>(null);

  // Espera realista según la carga de cocina (y si el local está tomando pedidos online).
  useEffect(() => {
    if (!cart.length) return;
    let active = true;
    void getOnlineEta(cart.map((item) => item.id), true).then((value) => { if (active) setEta(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [cart]);
  const { addresses, loading: loadingAddresses, error: addressError, retry } = useUserAddress(userId);
  const selectedAddress = addresses.find((address) => address.id === storedAddress?.id);

  useEffect(() => {
    setUserId(getUserIdFromToken());
    setReady(true);
  }, []);

  const loadMethods = useCallback(async () => {
    setLoadingMethods(true);
    setMethodsError(false);
    try {
      setPaymentMethods(await getPaymentMethods());
    } catch {
      setMethodsError(true);
    } finally {
      setLoadingMethods(false);
    }
  }, []);

  useEffect(() => {
    if (userId) void loadMethods();
  }, [userId, loadMethods]);

  useEffect(() => {
    if (receipt) {
      confirmation.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [receipt]);

  const validateCard = () => {
    const nextErrors: FormErrors = {};

    if (!/^[\p{L}\p{M} .’'-]+$/u.test(cardForm.name.trim())) {
      nextErrors.name = "Ingresá el nombre como figura en la tarjeta.";
    }
    if (!/^\d{16}$/.test(cardForm.cardNumber)) {
      nextErrors.cardNumber = "La tarjeta debe tener 16 dígitos.";
    }
    if (!/^\d{2}$/.test(cardForm.expMonth) || Number(cardForm.expMonth) < 1 || Number(cardForm.expMonth) > 12) {
      nextErrors.expMonth = "Elegí el mes.";
    }
    if (!/^\d{4}$/.test(cardForm.expYear)) {
      nextErrors.expYear = "Elegí el año.";
    }
    if (!/^\d{3,4}$/.test(cardForm.cvv)) {
      nextErrors.cvv = "Ingresá 3 o 4 dígitos.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateCardForm = (field: keyof CardForm, value: string) => {
    setCardForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSaveCard = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingCard || !validateCard()) return;
    setCardError("");
    if (!userId) {
      setCardError("Iniciá sesión nuevamente para guardar la tarjeta.");
      return;
    }

    setSavingCard(true);
    try {
      const expirationDate = `${cardForm.expMonth}/${cardForm.expYear.slice(-2)}`;
      await postPaymentMethod({
        name: "Tarjeta",
        type: "card",
        cardHolderName: cardForm.name.trim(),
        cardNumber: cardForm.cardNumber,
        last4: cardForm.cardNumber.slice(-4),
        expirationDate,
        cvv: cardForm.cvv,
        status: true,
        userId,
      });

      cardDialog.current?.close();
      await loadMethods();
    } catch {
      setCardError("No se pudo guardar la tarjeta. Revisá los datos y volvé a intentar.");
    } finally {
      setSavingCard(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!userId || !selectedAddress || !cart.length || orderLock.current || receipt) return;
    orderLock.current = true;
    setPlacingOrder(true);
    setOrderError(false);

    try {
      const items = cart.map((item) => {
        const extras = (item.selectedCustomizations || []).reduce((sum, customizationId) => {
          const customization = item.dishCustomizations?.find((custom) => custom.id === customizationId);
          return sum + parseCurrency(customization?.additionalPrice);
        }, 0);

        return {
          menuId: item.id,
          quantity: item.quantity,
          price: parseCurrency(item.price) + extras,
          notes: "",
          customizations: (item.selectedCustomizations || []).map((customizationId) => ({
            customizationId,
            isIncluded: true,
            notes: "",
          })),
        };
      });

      const paymentMethodId = selected === "cash" ? undefined : Number(selected);
      const payload: OrderPayload = {
        customerId: userId,
        deliveryType: "delivery",
        addressId: selectedAddress.id,
        paymentType: paymentMethodId ? "card" : "cash",
        paymentMethodId,
        state: "received",
        total_amount: summary.total,
        items,
      };

      const result = await postOrder(payload);
      const method = paymentMethods.find((payment) => String(payment.id) === selected);
      const confirmedTotal = result?.order?.total_amount ?? result?.total_amount;
      setReceipt({
        id: result?.order?.id ?? result?.id,
        total: confirmedTotal == null ? summary.total : parseCurrency(confirmedTotal),
        address: selectedAddress,
        method: paymentMethodId ? (method?.last4 ? `Tarjeta terminada en ${method.last4}` : "Tarjeta") : "Efectivo al recibir",
      });
      clearCart();
    } catch {
      setOrderError(true);
    } finally {
      setPlacingOrder(false);
      orderLock.current = false;
    }
  };

  if (!ready || (userId && loadingAddresses && !receipt && cart.length > 0)) {
    return <div className="customer-shell py-10 text-cliente-muted" role="status">Preparando el pago…</div>;
  }

  if (receipt) {
    return (
      <div className="customer-shell py-6 sm:py-10">
        <CheckoutSteps step="confirmation" />
        <section data-reveal="scale" className="checkout-receipt mx-auto mt-5 max-w-xl">
          <div className="p-5 sm:p-8">
            <span className="grid size-12 place-items-center rounded-xl bg-cliente-sage text-cliente-ink"><Check aria-hidden /></span>
            <h1 ref={confirmation} tabIndex={-1} className="mt-4 text-4xl">Pedido recibido</h1>
            <p className="mt-2 text-cliente-muted">
              {receipt.id ? `Tu pedido #${receipt.id} ya está registrado.` : "Tu pedido ya está registrado."} Podés seguirlo desde tu cuenta.
            </p>
          </div>
          <dl className="checkout-breakdown grid gap-3 bg-cliente-mist px-5 py-5 sm:px-8">
            <div><dt>Envío</dt><dd>{receipt.address.street} {receipt.address.streetNumber}, {receipt.address.city}</dd></div>
            <div><dt>Medio de pago</dt><dd>{receipt.method}</dd></div>
            <div><dt>Total del pedido</dt><dd>{formatARS(receipt.total)}</dd></div>
          </dl>
          <div className="flex flex-wrap items-center gap-3 p-5 sm:p-8">
            <Link href="/cuenta/ordenes" className={primary}>Ver mis pedidos</Link>
            <Link href="/menu" className="btn-outline customer-press min-h-12">Volver a la carta</Link>
          </div>
        </section>
      </div>
    );
  }

  if (!cart.length || !userId || !selectedAddress) {
    const empty = cart.length === 0;
    const missingAddress = !empty && Boolean(userId);
    return (
      <div className="customer-shell py-6 sm:py-10">
        <CheckoutSteps step="payment" />
        <section className="mt-4 max-w-xl rounded-2xl border border-cliente-line bg-white p-5 sm:p-8">
          <h1 className="text-3xl">{empty ? "Tu carrito está vacío" : missingAddress ? addressError ? "No pudimos cargar tus direcciones" : "Elegí una dirección de envío" : "Iniciá sesión para continuar"}</h1>
          <p className="mt-3 text-cliente-muted">{empty ? "Agregá platos de la carta para empezar tu pedido." : missingAddress ? "Volvé al carrito para revisar la dirección de envío." : "Te devolvemos al carrito después de iniciar sesión."}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {missingAddress && addressError && <button type="button" onClick={retry} className={primary}>Reintentar</button>}
            <Link href={empty ? "/menu" : missingAddress ? "/cart" : "/auth/login?redirect=/cart"}
              className={missingAddress && addressError ? "btn-outline customer-press min-h-12" : primary}>
              {empty ? "Explorar la carta" : missingAddress ? "Volver al carrito" : "Iniciar sesión"}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="customer-shell py-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <CheckoutSteps step="payment" />
        <header className="mt-3 border-b border-cliente-line pb-5">
          <h1 data-split className="text-4xl sm:text-5xl">Confirmá tu pedido</h1>
          <p className="mt-2 text-cliente-muted">Revisá el envío y elegí cómo querés pagar.</p>
        </header>
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,25rem)]">
          <div className="min-w-0 space-y-5">
            <section data-reveal="up" aria-labelledby="delivery-title" className="checkout-panel grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
              <MapPin aria-hidden className="mt-1 size-5 shrink-0 text-cliente-blue" />
              <div className="min-w-0 flex-1">
                <h2 id="delivery-title" className="text-xl">Dirección de envío</h2>
                <p className="mt-1 break-words text-cliente-muted">{selectedAddress.street} {selectedAddress.streetNumber}, {selectedAddress.city}</p>
              </div>
              <Link href="/cart" className="col-start-2 inline-flex min-h-11 w-fit items-center text-sm font-semibold text-cliente-blue underline underline-offset-4 sm:col-start-3">Cambiar dirección</Link>
            </section>
            <fieldset className="checkout-panel space-y-3" disabled={placingOrder}>
              <legend className="sr-only">Método de pago</legend>
              <h2 className="text-xl">Método de pago</h2>
              <PaymentOption value="cash" selected={selected} onSelect={setSelected} title="Efectivo" detail="Pagás cuando recibís el pedido." icon={Banknote} />
              {paymentMethods.map((method) => (
                <PaymentOption key={method.id} value={String(method.id)} selected={selected} onSelect={setSelected}
                  title={method.cardHolderName || method.name || "Tarjeta guardada"}
                  detail={method.last4 ? `Terminada en ${method.last4}` : "Tarjeta guardada"} icon={CreditCard} />
              ))}
              {loadingMethods && <p className="text-sm text-cliente-muted" role="status">Cargando tarjetas guardadas…</p>}
              {methodsError && (
                <div className="rounded-xl bg-cliente-mist px-4 py-2 text-sm text-cliente-ink">
                  <p role="status">No pudimos cargar tus tarjetas guardadas.</p>
                  <button type="button" onClick={loadMethods} className="min-h-11 font-semibold underline underline-offset-4">Volver a cargar tarjetas</button>
                </div>
              )}
              <button type="button" className="btn-outline customer-press mt-1 min-h-11" onClick={() => cardDialog.current?.showModal()}>
                <PlusCircle aria-hidden className="size-4" /> Agregar tarjeta
              </button>
            </fieldset>
          </div>

          <aside data-reveal="right" aria-labelledby="summary-title" className="checkout-panel lg:sticky lg:top-24">
            <div className="flex items-center gap-2">
              <ShoppingBag aria-hidden className="size-5 text-cliente-blue" />
              <h2 id="summary-title" className="text-xl">Resumen del pedido</h2>
            </div>
            <dl className="checkout-breakdown mt-4 grid gap-2">
              <div><dt>Productos</dt><dd>{summary.totalItems}</dd></div>
              <div><dt>Subtotal</dt><dd>{formatARS(summary.subTotal)}</dd></div>
              {summary.discount > 0 && <div className="text-green-800"><dt>Descuento {summary.discountLabel && `(${summary.discountLabel})`}</dt><dd>−{formatARS(summary.discount)}</dd></div>}
              <div><dt>IVA (21 %)</dt><dd>{formatARS(summary.taxes)}</dd></div>
              <div className="mt-2 border-t border-cliente-line pt-3 text-lg font-bold"><dt>Total</dt><dd>{formatARS(summary.total)}</dd></div>
            </dl>
            {orderError && (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
                <p role="alert">No pudimos confirmar el pedido. Revisá tus pedidos antes de volver a enviarlo.</p>
                <Link href="/cuenta/ordenes" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Revisar mis pedidos</Link>
              </div>
            )}
            {eta && (eta.paused || eta.full) ? (
              <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">
                {eta.paused ? "Por el momento no tomamos pedidos online." : "La cocina está con mucha demanda."} Probá de nuevo en unos minutos o reservá una mesa.
              </p>
            ) : eta && (
              <p className="mt-4 rounded-xl bg-cliente-mist p-3 text-sm text-cliente-ink" role="status">
                Llega en aprox. <strong>{eta.minMinutes}–{eta.maxMinutes} min</strong>, según el trabajo actual de la cocina.
                {eta.busy && " Hoy hay mucha demanda: el rango ya lo contempla."}
              </p>
            )}
            <button type="button" disabled={placingOrder || Boolean(eta && (eta.paused || eta.full))} className={`${primary} mt-5 w-full`} onClick={handleConfirmOrder}>
              {placingOrder && <Loader2 aria-hidden className="size-4 motion-safe:animate-spin" />}
              {placingOrder ? "Confirmando…" : "Confirmar pedido"}
            </button>
          </aside>
        </div>
      </div>

      <dialog ref={cardDialog} aria-labelledby="card-title" className="checkout-dialog"
        onCancel={(event) => { if (savingCard) event.preventDefault(); }}
        onClose={() => { setCardForm(initialCardForm); setErrors({}); setCardError(""); }}>
        <div className="flex items-center justify-between border-b border-cliente-line px-4 py-3 sm:px-6">
          <h2 id="card-title" className="text-xl">Agregar tarjeta</h2>
          <button
            className="grid size-11 place-items-center rounded-lg text-cliente-ink hover:bg-cliente-mist"
            onClick={() => cardDialog.current?.close()}
            disabled={savingCard}
            aria-label="Cerrar tarjeta"
            type="button"
          >
            <X aria-hidden size={22} />
          </button>
        </div>

        <form onSubmit={handleSaveCard} className="space-y-4 p-4 sm:p-6">
          <Field label="Nombre en la tarjeta" id="card-name" error={errors.name}>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2.5"
              id="card-name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "card-name-error" : undefined}
              value={cardForm.name}
              onChange={(event) =>
                updateCardForm("name", event.target.value)
              }
              disabled={savingCard}
              autoComplete="cc-name"
            />
          </Field>

          <Field label="Número de tarjeta" id="card-cardNumber" error={errors.cardNumber}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={16}
              className="w-full rounded-lg border px-3 py-2.5"
              id="card-cardNumber"
              aria-invalid={Boolean(errors.cardNumber)}
              aria-describedby={errors.cardNumber ? "card-cardNumber-error" : undefined}
              value={cardForm.cardNumber}
              onChange={(event) =>
                updateCardForm("cardNumber", event.target.value.replace(/\D/g, ""))
              }
              disabled={savingCard}
              autoComplete="cc-number"
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Mes" id="card-expMonth" error={errors.expMonth}>
              <select
                className="w-full rounded-lg border px-3 py-2.5"
                id="card-expMonth"
                aria-invalid={Boolean(errors.expMonth)}
                aria-describedby={errors.expMonth ? "card-expMonth-error" : undefined}
                autoComplete="cc-exp-month"
                value={cardForm.expMonth}
                onChange={(event) => updateCardForm("expMonth", event.target.value)}
                disabled={savingCard}
              >
                <option value="">Mes</option>
                {Array.from({ length: 12 }, (_, index) => {
                  const month = String(index + 1).padStart(2, "0");
                  return (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  );
                })}
              </select>
            </Field>

            <Field label="Año" id="card-expYear" error={errors.expYear}>
              <select
                className="w-full rounded-lg border px-3 py-2.5"
                id="card-expYear"
                aria-invalid={Boolean(errors.expYear)}
                aria-describedby={errors.expYear ? "card-expYear-error" : undefined}
                autoComplete="cc-exp-year"
                value={cardForm.expYear}
                onChange={(event) => updateCardForm("expYear", event.target.value)}
                disabled={savingCard}
              >
                <option value="">Año</option>
                {Array.from({ length: 15 }, (_, index) => {
                  const year = String(new Date().getFullYear() + index);
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </Field>

            <Field label="CVV" id="card-cvv" error={errors.cvv}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                className="w-full rounded-lg border px-3 py-2.5"
                id="card-cvv"
                aria-invalid={Boolean(errors.cvv)}
                aria-describedby={errors.cvv ? "card-cvv-error" : undefined}
                value={cardForm.cvv}
                onChange={(event) =>
                  updateCardForm("cvv", event.target.value.replace(/\D/g, ""))
                }
                disabled={savingCard}
                autoComplete="cc-csc"
              />
            </Field>
          </div>

          {cardError && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950" role="alert">{cardError}</p>}
          <button
            className={`${primary} w-full`}
            disabled={savingCard}
            type="submit"
          >
            {savingCard ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 motion-safe:animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar tarjeta"
            )}
          </button>
        </form>
      </dialog>
    </div>
  );
}

function PaymentOption({ value, selected, onSelect, title, detail, icon: Icon }: {
  value: string;
  selected: string;
  onSelect: (value: string) => void;
  title: string;
  detail: string;
  icon: typeof CreditCard;
}) {
  return (
    <label className="checkout-option">
      <Icon aria-hidden className="size-5 shrink-0 text-cliente-blue" />
      <span className="min-w-0 flex-1 break-words">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-cliente-muted">{detail}</span>
      </span>
      <input type="radio" name="payment" value={value} checked={selected === value}
        className="size-4 shrink-0 accent-cliente-blue" onChange={() => onSelect(value)} />
    </label>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}
