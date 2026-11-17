const staffRoutes = ["/admin", "/chef", "/mozo", "/recepcion"];

export function isCustomerRoute(pathname: string) {
  return !staffRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
