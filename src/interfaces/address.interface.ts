export interface IAddress {
    id: number;
    userId: number;
    street: string;
    streetNumber: string;
    city: string;
    province: string;
    postalCode: string;
    floor: string | null;
    apartment: string | null;
  }