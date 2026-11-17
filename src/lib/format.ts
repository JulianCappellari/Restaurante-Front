export const parseCurrency = (value: number | string | undefined | null): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const clean = value.replace(/[^\d.,-]/g, "");
  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");

  if (hasComma && hasDot) {
    return Number.parseFloat(clean.replace(/\./g, "").replace(",", ".")) || 0;
  }

  if (hasComma) return Number.parseFloat(clean.replace(",", ".")) || 0;
  return Number.parseFloat(clean) || 0;
};

export const formatARS = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
