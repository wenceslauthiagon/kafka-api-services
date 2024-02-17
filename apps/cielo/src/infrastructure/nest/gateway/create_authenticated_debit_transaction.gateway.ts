import {
  CieloCreateAuthenticatedDebitPaymentRequest,
  CieloCreateAuthenticatedDebitPaymentResponse,
  CieloCustomerCommon,
} from '@zro/cielo/infrastructure';

export interface CieloCreateAuthenticatedDebitTransactionRequest {
  CheckoutId: string;
  MerchantOrderId: string;
  Customer: CieloCustomerCommon;
  Payment: CieloCreateAuthenticatedDebitPaymentRequest;
}

export interface CieloCreateAuthenticatedDebitTransactionResponse {
  MerchantOrderId: string;
  Customer: CieloCustomerCommon;
  Payment: CieloCreateAuthenticatedDebitPaymentResponse;
}
