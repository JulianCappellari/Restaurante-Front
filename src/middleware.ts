import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const roleRoutes: Array<{ prefix: string; roles: string[] }> = [
  { prefix: '/admin', roles: ['Administrator'] },
  { prefix: '/chef', roles: ['Administrator', 'Chef'] },
  { prefix: '/mozo', roles: ['Administrator', 'Waiter'] },
  { prefix: '/recepcion', roles: ['Administrator', 'Receptionist'] },
];

function decodeRole(token?: string) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return json.role as string | undefined;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/cuenta') || roleRoutes.some(route => request.nextUrl.pathname.startsWith(route.prefix));

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const roleRoute = roleRoutes.find(route => request.nextUrl.pathname.startsWith(route.prefix));
  if (roleRoute) {
    const role = decodeRole(token);
    if (!role || !roleRoute.roles.includes(role)) {
      return NextResponse.redirect(new URL('/cuenta/perfil', request.url));
    }
  }

  return NextResponse.next();
}
