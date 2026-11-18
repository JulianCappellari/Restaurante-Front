import type { IMenu } from "@/interfaces/menu.interface";

// Fotos ilustrativas del proyecto (public/fotos). Se usan cuando el plato no trae una foto propia
// válida: las rutas del catálogo de ejemplo (/images/*.jpg) no existen en el front.
const photoRules: Array<[RegExp, string]> = [
  [/combo.*duo/, "/fotos/21-combo-duo.webp"],
  [/combo.*oficina/, "/fotos/22-combo-oficina.webp"],
  [/provoleta/, "/fotos/30-provoleta-entrada.webp"],
  [/vino|cerveza|limonada|trago|fernet|cafe/, "/fotos/29-bebidas-barra.webp"],
  [/milanesa/, "/fotos/07-milanesa-napolitana-carta.webp"],
  [/bife/, "/fotos/03-principales-bife.webp"],
  [/ravioles/, "/fotos/08-ravioles-ricota-espinaca.webp"],
  [/caesar|cesar/, "/fotos/09-ensalada-caesar.webp"],
  [/papas/, "/fotos/10-papas-fritas.webp"],
  [/empanada/, "/fotos/11-empanadas-surtidas-x6.webp"],
  [/gaseosa/, "/fotos/12-gaseosa-15l.webp"],
  [/agua/, "/fotos/13-agua-con-gas-500ml.webp"],
  [/flan/, "/fotos/14-flan-mixto.webp"],
  [/helado/, "/fotos/15-helado-artesanal.webp"],
];

export function dishPhoto(dish: Pick<IMenu, "nameDish" | "imageUrl">): string | null {
  const own = dish.imageUrl?.trim();
  if (own && (/^https?:\/\//i.test(own) || (own.startsWith("/") && !own.startsWith("/images/")))) return own;
  const name = dish.nameDish.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return photoRules.find(([pattern]) => pattern.test(name))?.[1] ?? null;
}
