import {
  PixFraudDetectionStatus,
  PixFraudDetectionType,
} from '@zro/pix-payments/domain';
import { PersonType } from '@zro/users/domain';

export interface GetByIdFraudDetectionPixFraudDetectionPspRequest {
  fraudDetectionId: string;
}

export interface GetByIdFraudDetectionPixFraudDetectionPspResponse {
  fraudDetectionId: string;
  personType: PersonType;
  document: string;
  key?: string;
  fraudType: PixFraudDetectionType;
  status: PixFraudDetectionStatus;
}

export interface GetByIdFraudDetectionPixFraudDetectionPspGateway {
  getByIdFraudDetection(
    request: GetByIdFraudDetectionPixFraudDetectionPspRequest,
  ): Promise<GetByIdFraudDetectionPixFraudDetectionPspResponse>;
}
