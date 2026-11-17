export function customerReturn(value: string | string[] | undefined) {
  return value === "/reserva" || value === "/cart" ? value : "/";
}
