import { PixInfractionStatus } from '@zro/pix-payments/domain';

export interface CancelInfractionPixInfractionPspRequest {
  infractionId: string;
}

export interface CancelInfractionPixInfractionPspResponse {
  infractionId: string;
  status: PixInfractionStatus;
  operationTransactionEndToEndId: string;
}

export interface CancelInfractionPixInfractionPspGateway {
  cancelInfraction(
    request: CancelInfractionPixInfractionPspRequest,
  ): Promise<CancelInfractionPixInfractionPspResponse>;
}
