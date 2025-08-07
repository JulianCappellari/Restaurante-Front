

export interface IPaymentMethod {
    id: number;
    name: string;
    cardHolderName: string;
    cardNumber: string;
    last4: string;
    expirationDate: string;
    cvv: string;
    status: string;
}


