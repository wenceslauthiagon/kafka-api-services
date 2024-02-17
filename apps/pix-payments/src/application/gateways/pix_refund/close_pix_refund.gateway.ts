import { PixRefundStatus } from '@zro/pix-payments/domain';

export interface ClosePixRefundPspRequest {
  solicitationPspId: string;
  status: PixRefundStatus;
  devolutionId: string;
  devolutionEndToEndId: string;
  analisysDetails: string;
}

export interface ClosePixRefundPspResponse {
  solicitationPspId: string;
  status: PixRefundStatus;
}

export interface ClosePixRefundPspGateway {
  closeRefundRequest(
    request: ClosePixRefundPspRequest,
  ): Promise<ClosePixRefundPspResponse>;
}
