export type Role = 'Administrator' | 'Waiter' | 'Customer' | 'Receptionist' | 'Chef';

// Extend the default session types to include our custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      role: Role;
    };
  }

  interface User {
    id: string;
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: {
      id: string;
      email?: string;
      role: Role;
    };
    role?: Role;
  }
}
