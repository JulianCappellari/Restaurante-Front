
export interface IUser {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role: UserRoles;
}

export enum UserRoles {
    ADMIN = 'Administrator',
    WAITER = 'Waiter',
    CUSTOMER = 'Customer',
    RECEPTIONIST = 'Receptionist',
    CHEF = 'Chef'
}