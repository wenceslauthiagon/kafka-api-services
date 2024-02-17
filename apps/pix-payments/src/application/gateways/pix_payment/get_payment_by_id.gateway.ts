import { PaymentStatusType } from '@zro/api-topazio/domain';

export interface GetPaymentByIdPixPaymentPspRequest {
  id: string;
  externalId?: string;
}

export interface GetPaymentByIdPixPaymentPspResponse {
  id: string;
  status: PaymentStatusType;
  reason: string;
  endToEndId: string;
  errorCode?: string;
}

export interface GetPaymentByIdPixPaymentPspGateway {
  getPaymentById(
    request: GetPaymentByIdPixPaymentPspRequest,
  ): Promise<GetPaymentByIdPixPaymentPspResponse>;
}
