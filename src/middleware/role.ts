import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

type Role = 'Administrator' | 'Waiter' | 'Customer' | 'Receptionist' | 'Chef';

// Define the routes and their required roles
const roleConfig: Record<string, Role[]> = {
  '/dashboard/admin': ['Administrator'],
  '/dashboard/waiter': ['Waiter', 'Administrator'],
  '/dashboard/chef': ['Chef', 'Administrator'],
  '/dashboard/reception': ['Receptionist', 'Administrator'],
  '/dashboard/orders': ['Waiter', 'Administrator', 'Chef'],
  '/dashboard/reservations': ['Receptionist', 'Administrator'],
  '/dashboard/menu': ['Administrator', 'Chef'],
  '/dashboard/settings': ['Administrator'],
};

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;
    const userRole = request.nextauth.token?.role as Role | undefined;

    // Find if the current path requires specific roles
    const requiredRoles = Object.entries(roleConfig).find(([path]) =>
      pathname.startsWith(path)
    )?.[1];

    // If no specific roles required, allow access
    if (!requiredRoles) {
      return NextResponse.next();
    }

    // If user is not authenticated, redirect to login
    if (!userRole) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }

    // Check if user has required role
    const hasPermission = requiredRoles.includes(userRole);

    if (!hasPermission) {
      // Redirect to unauthorized or home page
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// This function can be used in API routes or server components
export function hasRole(userRole: Role | undefined, requiredRoles: Role | Role[]): boolean {
  if (!userRole) return false;
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }
  return userRole === requiredRoles;
}
