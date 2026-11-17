"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { useSearchParams } from "next/navigation";
import { ChevronDown, Search, TicketPercent, X } from "lucide-react";
import FoodCard from "@/components/menu/FoodCard";
import { getAllmenu } from "@/actions/menu/get-all-menu";
import type { IMenu } from "@/interfaces/menu.interface";
import { promotions } from "@/lib/promotions";
import Link from "next/link";
import { getMenuSignals, getUsualDishes } from "@/actions/service/service-actions";

type CategoryId = "entrada" | "principal" | "postre" | "bebida" | "acompanamiento";

const typeToCategory: Record<IMenu["typeDish"], CategoryId> = {
  Entrada: "entrada", "Plato Principal": "principal", Postre: "postre",
  Bebida: "bebida", Ensalada: "entrada", Guarnicion: "acompanamiento",
};

const sections: Array<{ id: CategoryId; name: string; hint: string }> = [
  { id: "entrada", name: "Entradas", hint: "Para compartir mientras elegís el resto." },
  { id: "principal", name: "Principales", hint: "Los platos que llenan la mesa." },
  { id: "postre", name: "Postres", hint: "Para cerrar la comida con algo dulce." },
  { id: "bebida", name: "Bebidas", hint: "Frías y calientes." },
  { id: "acompanamiento", name: "Acompañamientos", hint: "Para sumar a cualquier plato." },
];

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es-AR");
}

function MenuHeader({ count }: { count: number }) {
  return (
    <header data-customer-inverse className="relative overflow-hidden bg-cliente-blue text-white">
      <div className="customer-shell grid gap-8 py-10 sm:py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-end lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div>
          <p className="text-sm font-semibold text-blue-100">{count ? `${count} platos disponibles` : "Carta"}</p>
          <h1 data-split className="mt-2 text-balance text-5xl leading-[0.95] sm:text-7xl">La carta</h1>
          <p className="mt-4 max-w-[46ch] text-base leading-7 text-blue-100">
            Explorá los platos. Abrí uno para personalizarlo antes de pedir.
          </p>
        </div>
        <figure data-reveal="scale" className="relative hidden h-52 overflow-hidden rounded-2xl md:block lg:h-64">
          <Image data-zoom src="/fotos/20-portada-mesa-compartida.webp" alt="Mesa compartida con empanadas, ensalada y bife con papas" fill priority
            sizes="(min-width: 1024px) 448px, 352px" className="object-cover" />
        </figure>
      </div>
    </header>
  );
}

function MenuLoading() {
  return (
    <>
      <MenuHeader count={0} />
      <div className="customer-shell py-10" role="status">
        <p className="mb-6 font-semibold text-cliente-ink">Cargando la carta…</p>
        <div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((slot) => (
            <div key={slot} className="overflow-hidden rounded-2xl border border-cliente-line bg-white">
              <div className="aspect-[4/3] bg-cliente-mist motion-safe:animate-pulse" />
              <div className="space-y-3 p-5">
                <div className="h-6 w-2/3 rounded bg-cliente-mist" />
                <div className="h-4 w-full rounded bg-cliente-mist" />
                <div className="h-4 w-1/2 rounded bg-cliente-mist" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MenuPage({ initialCategory }: { initialCategory: string }) {
  const [category, setCategory] = useState<string>(initialCategory);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<IMenu[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [soldOut, setSoldOut] = useState<Set<number>>(() => new Set());
  const [usual, setUsual] = useState<Awaited<ReturnType<typeof getUsualDishes>> | null>(null);

  // Agotados según stock real y "lo de siempre" del cliente con sesión.
  useEffect(() => {
    let active = true;
    void Promise.allSettled([getMenuSignals(), getUsualDishes()]).then(([signals, mine]) => {
      if (!active) return;
      if (signals.status === "fulfilled") setSoldOut(new Set(signals.value.soldOut));
      if (mine.status === "fulfilled" && mine.value.dishes.length) setUsual(mine.value);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    getAllmenu().then((data) => {
      if (!Array.isArray(data)) throw new Error("Respuesta inválida");
      if (!active) return;
      setItems(data.filter((item) => item.available));
      setState("ready");
    }).catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [attempt]);

  const search = normalize(query.trim());
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const key = typeToCategory[item.typeDish];
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [items]);

  const filtered = useMemo(() => items.filter((item) =>
    (category === "all" || typeToCategory[item.typeDish] === category) &&
    (!search || [item.nameDish, item.description, item.typeDish].some((value) => value && normalize(value).includes(search)))
  ), [items, category, search]);

  // Flip: al cambiar de categoría, los platos que siguen visibles viajan a su nuevo lugar.
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const changeCategory = (id: string) => {
    if (id === category) return;
    if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      flipState.current = Flip.getState("[data-flip-id]");
    }
    setCategory(id);
  };
  useIsoLayoutEffect(() => {
    const previous = flipState.current;
    if (!previous) return;
    flipState.current = null;
    Flip.from(previous, {
      targets: "[data-flip-id]",
      duration: 0.6,
      ease: "power3.inOut",
      absolute: true,
      scale: false,
      simple: true,
    });
  }, [category]);

  if (state === "loading") return <MenuLoading />;

  const grouped = category === "all" && !search;
  const chips = [
    { id: "all", name: "Todo", count: items.length },
    ...sections.filter(({ id }) => counts.has(id)).map(({ id, name }) => ({ id, name, count: counts.get(id) ?? 0 })),
  ];

  return (
    <>
      <MenuHeader count={items.length} />
      <div className="customer-shell py-7 sm:py-10">
        {state === "error" ? (
          <section role="alert" className="max-w-xl rounded-2xl border border-cliente-line bg-white p-6">
            <h2 className="text-3xl">No pudimos cargar la carta</h2>
            <p className="mt-2 text-sm text-cliente-muted">Volvé a intentar para consultar los platos disponibles.</p>
            <button type="button" className="btn-primary customer-press mt-5 min-h-11" onClick={() => {
              setState("loading");
              setAttempt((value) => value + 1);
            }}>Reintentar</button>
          </section>
        ) : (
          <>
            <div className="sticky top-16 z-20 -mx-4 bg-cliente-paper/95 px-4 pb-4 pt-2 backdrop-blur sm:mx-0 sm:px-0">
              <div className="flex flex-col gap-3">
                <div className="relative w-full sm:max-w-sm">
                  <label htmlFor="buscar-plato" className="sr-only">Buscar plato</label>
                  <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cliente-muted" />
                  <input id="buscar-plato" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar: milanesa, flan, ravioles…"
                    className="min-h-12 w-full rounded-full border border-cliente-line bg-white pl-11 pr-11 text-base shadow-sm" />
                  {query && (
                    <button type="button" aria-label="Borrar búsqueda" onClick={() => setQuery("")}
                      className="customer-press absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-cliente-muted hover:bg-cliente-mist">
                      <X aria-hidden="true" className="size-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Categorías">
                  {chips.map(({ id, name, count }) => {
                    const active = category === id;
                    return (
                      <button key={id} type="button" aria-pressed={active} onClick={() => changeCategory(id)}
                        className={`customer-press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${
                          active ? "border-cliente-blue bg-cliente-blue text-white" : "border-cliente-line bg-white hover:border-cliente-blue hover:bg-cliente-mist"}`}>
                        {name}
                        <span className={`rounded-full px-2 text-xs tabular-nums ${active ? "bg-white/20" : "bg-cliente-mist text-cliente-muted"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <details className="group mt-4 rounded-2xl border border-cliente-line bg-white">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-5 py-2 font-semibold">
                <TicketPercent aria-hidden="true" className="size-5 text-cliente-blue" />
                Cupones y promociones
                <ChevronDown aria-hidden="true" className="ml-auto size-4 motion-safe:transition-transform group-open:rotate-180" />
              </summary>
              <ul className="grid gap-3 border-t border-cliente-line px-5 py-4 text-sm sm:grid-cols-3">
                {promotions.map((promotion) => <li className="leading-6" key={promotion.code}>
                  <strong className="block text-cliente-blue">{promotion.code}</strong>{promotion.description}
                </li>)}
              </ul>
            </details>

            {usual && (
              <section aria-labelledby="lo-de-siempre" className="mt-6 rounded-2xl border border-cliente-line bg-cliente-sage p-5">
                <h2 id="lo-de-siempre" className="text-2xl">Lo de siempre</h2>
                <p className="text-sm text-cliente-muted">Lo que más pediste{usual.visits > 1 ? ` en tus ${usual.visits} visitas` : ""}.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {usual.dishes.map((dish) => (
                    <Link key={dish.menuId} href={`/product/${dish.menuId}`}
                      className="customer-press inline-flex min-h-11 items-center gap-2 rounded-full border border-cliente-line bg-white px-4 text-sm font-semibold">
                      {dish.nameDish} <span className="text-cliente-muted">×{dish.times}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <p aria-live="polite" className="mt-8 text-sm font-semibold text-cliente-muted">
              {filtered.length} {filtered.length === 1 ? "plato" : "platos"}{search ? ` para «${query.trim()}»` : ""}
            </p>

            {filtered.length ? (
              grouped ? (
                <div className="mt-6 space-y-14">
                  {sections.map(({ id, name, hint }) => {
                    const dishes = filtered.filter((item) => typeToCategory[item.typeDish] === id);
                    if (!dishes.length) return null;
                    return (
                      <section key={id} aria-labelledby={`seccion-${id}`}>
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-cliente-line pb-3">
                          <h2 id={`seccion-${id}`} data-split className="text-4xl sm:text-5xl">{name}</h2>
                          <p className="text-sm text-cliente-muted">{hint}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                          {dishes.map((item, index) => <FoodCard key={item.id} dish={item} index={index} soldOut={soldOut.has(item.id)} />)}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((item, index) => <FoodCard key={item.id} dish={item} index={index} soldOut={soldOut.has(item.id)} />)}
                </div>
              )
            ) : (
              <section className="mt-6 rounded-2xl border border-cliente-line bg-white p-8 text-center">
                <h2 className="text-3xl">{items.length ? "No encontramos ese plato" : "No hay platos disponibles"}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-cliente-muted">
                  {items.length ? "Probá con otro nombre o elegí una categoría distinta." : "Volvé a consultar la carta más tarde."}
                </p>
                {items.length > 0 && (
                  <button type="button" onClick={() => { setQuery(""); setCategory("all"); }} className="btn-outline customer-press mt-5 min-h-11">
                    <X aria-hidden="true" className="size-4" /> Limpiar filtros
                  </button>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}

function MenuFromUrl() {
  const requested = useSearchParams().get("categoria");
  const initialCategory = sections.find(({ id }) => id === requested)?.id ?? "all";
  return <MenuPage key={initialCategory} initialCategory={initialCategory} />;
}

export default function MenuRoute() {
  return <Suspense fallback={<MenuLoading />}><MenuFromUrl /></Suspense>;
}
