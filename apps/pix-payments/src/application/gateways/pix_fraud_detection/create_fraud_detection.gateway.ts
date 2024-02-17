import {
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import { PersonType } from '@zro/users/domain';

export interface CreateFraudDetectionPixFraudDetectionPspRequest {
  personType: PersonType;
  document: string;
  fraudType: PixFraudDetectionType;
  key?: string;
}

export interface CreateFraudDetectionPixFraudDetectionPspResponse {
  fraudDetectionId: string;
  status: PixFraudDetectionStatus;
}

export interface CreateFraudDetectionPixFraudDetectionPspGateway {
  createFraudDetection(
    request: CreateFraudDetectionPixFraudDetectionPspRequest,
  ): Promise<CreateFraudDetectionPixFraudDetectionPspResponse>;
}
