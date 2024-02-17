import { PixDevolutionCode } from '@zro/pix-payments/domain';

export interface CreatePixDevolutionPixPaymentPspRequest {
  devolutionId: string;
  depositId: string;
  depositEndToEndId: string;
  amount: number;
  devolutionCode: PixDevolutionCode;
  description?: string;
}

export interface CreatePixDevolutionPixPaymentPspResponse {
  externalId: string;
  endToEndId: string;
}

export interface CreatePixDevolutionPixPaymentPspGateway {
  createPixDevolution(
    request: CreatePixDevolutionPixPaymentPspRequest,
  ): Promise<CreatePixDevolutionPixPaymentPspResponse>;
}
