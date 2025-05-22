
export interface IUser {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    rol: UserRoles;
}

export enum UserRoles {
    WAITER = 'Waiter',
    ADMIN = 'Administrator',
    CUSTOMER = 'Customer'
}