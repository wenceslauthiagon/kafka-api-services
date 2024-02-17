import { Amount } from './commons/amount';
import { Address } from './commons/address';
import { Item } from './commons/item';
import { PaymentMethod } from './commons/payment_method';
import { Shipping } from './commons/shipping';
import { Shopper } from './commons/shopper';
import { PaymentFlow } from './commons/payment_flow';

export class NuPayCreatePaymentRequest {
  merchantOrderReference: string;
  referenceId: string;
  amount: Amount;
  shopper: Shopper;
  items: Item[];
  paymentMethod: PaymentMethod;
  transactionId?: string;
  installments?: number;
  paymentFlow?: PaymentFlow;
  merchantName?: string;
  storeName?: string;
  returnUrl?: string;
  delayToAutoCancel?: number;
  shipping?: Shipping;
  billingAddress?: Address;
  orderUrl?: string;
  callbackUrl?: string;
  referenceDate?: string;
}
