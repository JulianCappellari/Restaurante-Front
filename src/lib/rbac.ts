import { Role } from '@/types';

type UserRole = Role | string | undefined;

export const hasRole = (userRole: UserRole, requiredRoles: Role | Role[]): boolean => {
  if (!userRole) return false;
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.some(role => role === userRole);
  }
  return userRole === requiredRoles;
};

export const useUserRole = (): { hasRole: (requiredRoles: Role | Role[]) => boolean } => {
  // This would be replaced with your actual user context/authentication logic
  // For example, if using NextAuth:
  // const { data: session } = useSession();
  // const userRole = session?.user?.role;

  // For now, we'll return a mock implementation
  const userRole: Role | undefined = undefined; // Replace with actual user role

  return {
    hasRole: (requiredRoles: Role | Role[]) => hasRole(userRole, requiredRoles)
  };
};
