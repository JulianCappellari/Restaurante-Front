
export interface IUser {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    rol: UserRoles;
}

export enum UserRoles {
    WAITER = 'Waiter',
    ADMIN = 'Administrator',
    CUSTOMER = 'Customer'
}