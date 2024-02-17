import { PaymentStatusType } from '@zro/api-topazio/domain';

export interface GetPaymentPixPaymentPspRequest {
  id: string;
  endToEndId: string;
}

export interface GetPaymentPixPaymentPspResponse {
  id: string;
  status: PaymentStatusType;
  reason: string;
  endToEndId: string;
  errorCode?: string;
}

export interface GetPaymentPixPaymentPspGateway {
  getPayment(
    request: GetPaymentPixPaymentPspRequest,
  ): Promise<GetPaymentPixPaymentPspResponse>;
}
