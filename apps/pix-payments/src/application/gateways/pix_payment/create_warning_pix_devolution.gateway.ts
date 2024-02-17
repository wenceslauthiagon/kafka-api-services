import { PixDevolutionCode } from '@zro/pix-payments/domain';

export interface CreateWarningPixDevolutionPixPaymentPspRequest {
  devolutionId: string;
  depositId: string;
  depositEndToEndId: string;
  amount: number;
  devolutionCode: PixDevolutionCode;
  description?: string;
}

export interface CreateWarningPixDevolutionPixPaymentPspResponse {
  externalId: string;
  endToEndId: string;
}

export interface CreateWarningPixDevolutionPixPaymentPspGateway {
  createWarningPixDevolution(
    request: CreateWarningPixDevolutionPixPaymentPspRequest,
  ): Promise<CreateWarningPixDevolutionPixPaymentPspResponse>;
}
