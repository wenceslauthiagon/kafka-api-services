import {
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';

export interface GetAllFraudDetectionPixFraudDetectionPspRequest {
  document?: string;
  key?: string;
  fraudDetectionId?: string;
  fraudType?: PixFraudDetectionType;
  status?: PixFraudDetectionStatus;
  createdAtStart?: Date;
  createdAtEnd?: Date;
  page?: number;
  size?: number;
}

export interface GetAllFraudDetectionPixFraudDetectionPspResponseItem {
  fraudDetectionId: string;
  document: string;
  fraudType: PixFraudDetectionType;
  status: PixFraudDetectionStatus;
  key?: string;
}

export interface GetAllFraudDetectionPixFraudDetectionPspResponse {
  fraudDetections?: GetAllFraudDetectionPixFraudDetectionPspResponseItem[];
}

export interface GetAllFraudDetectionPixFraudDetectionPspGateway {
  getAllFraudDetection(
    request: GetAllFraudDetectionPixFraudDetectionPspRequest,
  ): Promise<GetAllFraudDetectionPixFraudDetectionPspResponse>;
}
