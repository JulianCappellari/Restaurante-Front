export type PaymentMethodType = "card" | "mp";

export interface IPaymentMethod {
  id: number;
  name: string;
  type: PaymentMethodType;
  cardHolderName?: string;
  cardNumber?: string;
  last4?: string;
  expirationDate?: string;
  cvv?: string;
  isDefault?: boolean;
  status: boolean;
  userId: number;
}
