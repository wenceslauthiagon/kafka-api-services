import { PixDevolutionCode } from '@zro/pix-payments/domain';

export interface CreatePixDevolutionRefundPixPaymentPspRequest {
  devolutionId: string;
  depositId: string;
  depositEndToEndId: string;
  amount: number;
  devolutionCode: PixDevolutionCode;
  description?: string;
}

export interface CreatePixDevolutionRefundPixPaymentPspResponse {
  externalId: string;
  endToEndId: string;
}

export interface CreatePixDevolutionRefundPixPaymentPspGateway {
  createPixDevolutionRefund(
    request: CreatePixDevolutionRefundPixPaymentPspRequest,
  ): Promise<CreatePixDevolutionRefundPixPaymentPspResponse>;
}
