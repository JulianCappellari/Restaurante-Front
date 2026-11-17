export type Promotion = {
  code: string;
  label: string;
  description: string;
  discountPercent: number;
  minSubtotal?: number;
};

export const promotions: Promotion[] = [
  {
    code: "BIENVENIDO10",
    label: "Bienvenido 10%",
    description: "10% off para nuevos pedidos.",
    discountPercent: 10,
  },
  {
    code: "MENU15",
    label: "Menu 15%",
    description: "15% off desde $15.000.",
    discountPercent: 15,
    minSubtotal: 15000,
  },
  {
    code: "COMBOFAMILIA",
    label: "Combo familia",
    description: "20% off desde $30.000 en pedidos grandes.",
    discountPercent: 20,
    minSubtotal: 30000,
  },
];

export const normalizeCouponCode = (code: string) => code.trim().toUpperCase();

export const findPromotion = (code?: string | null) => {
  if (!code) return null;
  const normalized = normalizeCouponCode(code);
  return promotions.find((promotion) => promotion.code === normalized) || null;
};

export const validatePromotion = (code: string, subtotal: number) => {
  const promotion = findPromotion(code);
  if (!promotion) {
    return { ok: false as const, message: "Cupon invalido." };
  }

  if (promotion.minSubtotal && subtotal < promotion.minSubtotal) {
    return {
      ok: false as const,
      message: `Este cupon aplica desde $${promotion.minSubtotal.toLocaleString("es-AR")}.`,
    };
  }

  return { ok: true as const, promotion };
};
