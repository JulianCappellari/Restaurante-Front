'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Role } from '@/types';
import { hasRole } from '@/lib/rbac';

interface RoleBasedProps {
  children: ReactNode;
  allowedRoles: Role | Role[];
  fallback?: ReactNode;
}

export function RoleBased({ children, allowedRoles, fallback = null }: RoleBasedProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;

  if (hasRole(userRole, allowedRoles)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export function useHasRole(requiredRoles: Role | Role[]): boolean {
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;
  return hasRole(userRole, requiredRoles);
}
