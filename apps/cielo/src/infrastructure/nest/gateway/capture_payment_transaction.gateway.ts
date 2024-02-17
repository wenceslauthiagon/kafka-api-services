import {
  CieloCapturePaymentResponse,
  CieloCustomerCommon,
} from '@zro/cielo/infrastructure';

export interface CieloCaptureTransactionResponse {
  MerchantOrderId: string;
  Customer: CieloCustomerCommon;
  Payment: CieloCapturePaymentResponse;
}
