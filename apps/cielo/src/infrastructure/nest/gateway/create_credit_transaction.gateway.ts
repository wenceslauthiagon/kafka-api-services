import {
  CieloCreateCreditPaymentRequest,
  CieloCreateCreditPaymentResponse,
  CieloCustomerCommon,
} from '@zro/cielo/infrastructure';

export class CieloCreateCreditTransactionRequest {
  MerchantOrderId: string;
  Customer: CieloCustomerCommon;
  Payment: CieloCreateCreditPaymentRequest;
}

export interface CieloCreateCreditTransactionResponse {
  MerchantOrderId: string;
  Customer: CieloCustomerCommon;
  Payment: CieloCreateCreditPaymentResponse;
}
