import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, CakeSlice, CheckCircle2, ClipboardList, QrCode, Salad, UtensilsCrossed } from "lucide-react";
import styles from "./home.module.css";
import HomeScroll from "./HomeScroll";
import { getAllmenu } from "@/actions/menu/get-all-menu";
import DishCarousel, { type CarouselDish } from "@/components/home/DishCarousel";
import { dishPhoto } from "@/lib/dish-photos";
import { formatARS, parseCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "Restaurante App | Carta y reservas",
  description: "Explorá la carta, hacé tu pedido online o reservá una mesa en Restaurante App.",
};

const sections = [
  { category: "entrada", label: "Entradas", description: "Para empezar mientras elegís el resto.", icon: Salad, photo: "/fotos/02-entradas-empanadas.webp" },
  { category: "principal", label: "Principales", description: "Los platos que llenan la mesa.", icon: UtensilsCrossed, photo: "/fotos/03-principales-bife.webp" },
  { category: "postre", label: "Postres", description: "Para cerrar la comida con algo dulce.", icon: CakeSlice, photo: "/fotos/04-postres-flan.webp" },
];

const diningSteps = [
  { title: "Escaneá el QR", text: "Abrí la carta con el código de la mesa.", icon: QrCode, screen: "La carta", detail: "Elegí qué querés comer." },
  { title: "Armá tu pedido", text: "Elegí tus platos, ajustá ingredientes y mandá el pedido a cocina.", icon: UtensilsCrossed, screen: "Tu pedido", detail: "Personalizá y confirmá." },
  { title: "Seguí cada plato", text: "Consultá el estado del pedido o llamá al mozo cuando lo necesites.", icon: ClipboardList, screen: "En preparación", detail: "Revisá cómo va tu pedido." },
];

// La home se regenera cada 5 minutos para reflejar la carta actual.
export const revalidate = 300;

const FAVORITE_TYPES: Record<string, string> = {
  "Plato Principal": "Principal", Entrada: "Entrada", Ensalada: "Ensalada", Guarnicion: "Guarnición", Postre: "Postre", Bebida: "Bebida",
};

/* Platos con foto de la carta real; si el servicio no responde, la home sigue sin el carrusel. */
async function loadFavorites(): Promise<CarouselDish[]> {
  try {
    const menu = await getAllmenu();
    return menu
      .filter((dish) => dish.available && dish.typeDish !== "Bebida")
      .flatMap((dish) => {
        const photo = dishPhoto(dish);
        return photo ? [{ id: dish.id, name: dish.nameDish, price: formatARS(parseCurrency(dish.price)), type: FAVORITE_TYPES[dish.typeDish] ?? dish.typeDish, photo }] : [];
      })
      .slice(0, 8);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const favorites = await loadFavorites();
  return (
    <div id="contenido-portada" tabIndex={-1} className={styles.home}>
      <HomeScroll />
      <div data-home-progress className={styles.readingProgress} aria-hidden="true" />

      <section data-home-hero className={styles.hero} aria-labelledby="home-title">
        <div className={`${styles.shell} ${styles.heroLayout}`}>
          <div className={styles.heroCopy}>
            <h1 id="home-title" data-hero-title>¿Qué se come hoy?</h1>
            <p data-hero-copy>Elegí algo rico de la carta, pedí online o reservá una mesa para venir a comer.</p>
            <div className={styles.heroActions} data-hero-actions>
              <Link href="/menu" className={styles.primary}>
                Ver la carta <ArrowRight aria-hidden="true" size={19} />
              </Link>
              <Link href="/reserva" className={styles.secondary}>Reservar mesa</Link>
            </div>
            <Link href="/#en-el-salon" className={styles.heroHint}>
              ¿Ya estás en el salón? <ArrowDown aria-hidden="true" size={17} />
            </Link>
          </div>

          <figure className={styles.heroImage} data-hero-figure>
            <div className={styles.imageCrop} data-hero-crop>
              <Image
                src="/portada/milanesa-editorial.webp"
                alt="Milanesa napolitana gratinada con papas y limón"
                fill
                priority
                sizes="(max-width: 767px) 92vw, (max-width: 1280px) 49vw, 605px"
              />
            </div>
            <figcaption>Foto ilustrativa</figcaption>
          </figure>
        </div>
      </section>

      <section data-home-intro className={styles.intro} aria-label="Cómo funciona">
        <div className={styles.shell}>
          <p data-scrub-text className={styles.introText}>
            Elegí tu plato, mandalo a cocina desde la mesa y seguí cada etapa hasta que llega a tu lugar.
          </p>
        </div>
      </section>

      <section id="explorar" data-home-categories className={styles.categories} aria-labelledby="categories-title">
        <div className={`${styles.shell} ${styles.sectionHead}`}>
          <h2 id="categories-title">Explorá la carta</h2>
          <Link className={styles.textLink} href="/menu">Ver todos los platos <ArrowRight aria-hidden="true" size={17} /></Link>
        </div>
        <ul className={styles.categoryList} data-h-track>
          {sections.map(({ category, label, description, icon: Icon, photo }) => (
            <li key={category} data-category-entry className={styles.categoryItem}>
              <Link href={`/menu?categoria=${category}`} className={styles.categoryLink}>
                <Image src={photo} alt="" fill sizes="(min-width: 960px) 40vw, 100vw" className={styles.categoryPhoto} />
                <span className={styles.categoryShade} aria-hidden="true" />
                <span className={styles.categoryContent}>
                  <Icon aria-hidden="true" size={28} strokeWidth={1.6} />
                  <h3>{label}</h3>
                  <p>{description}</p>
                  <span className={styles.categoryGo}>Ver {label.toLowerCase()} <ArrowRight aria-hidden="true" size={18} /></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {favorites.length >= 3 && (
        <section aria-labelledby="favoritos-title" className="overflow-hidden bg-cliente-sage py-14 sm:py-20">
          <div className={`${styles.shell} mb-8 flex flex-wrap items-end justify-between gap-3`}>
            <h2 id="favoritos-title" data-split className="text-4xl sm:text-6xl">Los favoritos de la casa</h2>
            <Link className={styles.textLink} href="/menu">Ver toda la carta <ArrowRight aria-hidden="true" size={17} /></Link>
          </div>
          <div className={styles.shell}>
            <DishCarousel dishes={favorites} />
          </div>
        </section>
      )}

      <section id="en-el-salon" data-home-dining className={styles.dining} aria-labelledby="dining-title">
        <div data-dining-stage className={styles.diningStage}>
          <div className={`${styles.shell} ${styles.diningLayout}`}>
            <div className={styles.diningCopy}>
              <h2 id="dining-title">Pedí desde tu mesa</h2>
              <ol className={styles.diningSteps}>
                {diningSteps.map(({ title, text }, index) => (
                  <li key={title} data-dining-step>
                    <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
                    <div><h3>{title}</h3><p>{text}</p></div>
                  </li>
                ))}
              </ol>
              <Link href="/#reservar" className={styles.textLink}>Ir a reservas <ArrowDown aria-hidden="true" size={17} /></Link>
            </div>

            <div className={styles.diningScene}>
              <Image src="/fotos/06-pedido-en-mesa.webp" alt="" fill
                sizes="(max-width: 767px) 92vw, (max-width: 1280px) 53vw, 650px" />
              <div className={styles.sceneShade} aria-hidden="true" />
              <div className={styles.phone} aria-hidden="true">
                <div className={styles.phoneHeader}><UtensilsCrossed size={15} /> Menú de mesa</div>
                <div className={styles.phoneBody}>
                  {diningSteps.map(({ icon: Icon, screen, detail }, index) => (
                    <div data-dining-screen data-first={index === 0 ? "" : undefined} className={styles.phoneScreen} key={screen}>
                      <div className={styles.phoneIcon}><Icon size={25} strokeWidth={1.6} /></div>
                      <strong>{screen}</strong>
                      <p>{detail}</p>
                      <div className={styles.phoneRule} />
                      <span className={styles.phoneStatus}>{index === 2 && <CheckCircle2 size={13} />} {["QR de la mesa", "Revisá tu carrito", "Recibido en cocina"][index]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <span className={styles.sceneLabel}>Demostración del menú de mesa</span>
            </div>
          </div>
        </div>
      </section>

      <section id="reservar" data-home-booking className={styles.booking} aria-labelledby="booking-title">
        <div className={`${styles.shell} ${styles.bookingLayout}`}>
          <div className={styles.bookingCopy}>
            <h2 id="booking-title" data-booking-title>¿Venís a comer?</h2>
            <p className={styles.bookingText}>Reservá tu mesa para el turno que prefieras.</p>
            <Link href="/reserva" className={styles.bookingButton} data-magnet>
              Reservar mesa <ArrowRight aria-hidden="true" size={19} />
            </Link>
          </div>
          <figure className={styles.bookingPhoto}>
            <Image src="/fotos/19-reservas-mesa-detalle.webp" alt="Mesa puesta para una reserva" fill sizes="(min-width: 768px) 40vw, 92vw" />
          </figure>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerLayout}`}>
          <Link href="/" className={styles.footerBrand}>Restaurante App</Link>
          <nav aria-label="Enlaces al pie">
            <Link href="/menu">Carta</Link>
            <Link href="/reserva">Reservas</Link>
            <Link href="/nosotros">Nosotros</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
