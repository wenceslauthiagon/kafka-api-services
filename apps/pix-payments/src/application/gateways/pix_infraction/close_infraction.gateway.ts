import {
  PixInfractionStatus,
  PixInfractionAnalysisResultType,
} from '@zro/pix-payments/domain';

export interface CloseInfractionPixInfractionPspRequest {
  infractionId: string;
  analysisResult: PixInfractionAnalysisResultType;
  analysisDetails?: string;
}

export interface CloseInfractionPixInfractionPspResponse {
  infractionId: string;
  operationTransactionEndToEndId: string;
  status: PixInfractionStatus;
}

export interface CloseInfractionPixInfractionPspGateway {
  closeInfraction(
    request: CloseInfractionPixInfractionPspRequest,
  ): Promise<CloseInfractionPixInfractionPspResponse>;
}
