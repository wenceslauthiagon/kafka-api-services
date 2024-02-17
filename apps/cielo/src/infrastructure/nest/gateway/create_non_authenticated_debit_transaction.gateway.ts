import {
  CieloCreateNonAuthenticatedDebitPaymentRequest,
  CieloCreateNonAuthenticatedDebitPaymentResponse,
  CieloCustomerCommon,
} from '@zro/cielo/infrastructure';

export interface CieloCreateNonAuthenticatedDebitTransactionRequest {
  MerchantOrderId: string;
  Customer: CieloCustomerCommon;
  Payment: CieloCreateNonAuthenticatedDebitPaymentRequest;
}

export interface CieloCreateNonAuthenticatedDebitTransactionResponse {
  MerchantOrderId: string;
  Customer: CieloCustomerCommon;
  Payment: CieloCreateNonAuthenticatedDebitPaymentResponse;
}
