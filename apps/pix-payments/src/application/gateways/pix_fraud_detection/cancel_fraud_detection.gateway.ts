import { PixFraudDetectionStatus } from '@zro/pix-payments/domain';

export interface CancelFraudDetectionPixFraudDetectionPspRequest {
  fraudDetectionId: string;
}

export interface CancelFraudDetectionPixFraudDetectionPspResponse {
  fraudDetectionId: string;
  status: PixFraudDetectionStatus;
}

export interface CancelFraudDetectionPixFraudDetectionPspGateway {
  cancelFraudDetection(
    request: CancelFraudDetectionPixFraudDetectionPspRequest,
  ): Promise<CancelFraudDetectionPixFraudDetectionPspResponse>;
}
