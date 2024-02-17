import { Domain, Failed } from '@zro/common';
import { PersonType } from '@zro/users/domain';

export enum PixFraudDetectionStatus {
  RECEIVED = 'RECEIVED',
  REGISTERED = 'REGISTERED',
  CANCELED_REGISTERED = 'CANCELED_REGISTERED',
  CANCELED_RECEIVED = 'CANCELED_RECEIVED',
}

export enum PixFraudDetectionState {
  RECEIVED_PENDING = 'RECEIVED_PENDING',
  RECEIVED_CONFIRMED = 'RECEIVED_CONFIRMED',
  REGISTERED_PENDING = 'REGISTERED_PENDING',
  REGISTERED_CONFIRMED = 'REGISTERED_CONFIRMED',
  CANCELED_RECEIVED_PENDING = 'CANCELED_RECEIVED_PENDING',
  CANCELED_RECEIVED_CONFIRMED = 'CANCELED_RECEIVED_CONFIRMED',
  CANCELED_REGISTERED_PENDING = 'CANCELED_REGISTERED_PENDING',
  CANCELED_REGISTERED_CONFIRMED = 'CANCELED_REGISTERED_CONFIRMED',
  FAILED = 'FAILED',
}

export enum PixFraudDetectionType {
  FALSE_IDENTIFICATION = 'FALSE_IDENTIFICATION',
  DUMMY_ACCOUNT = 'DUMMY_ACCOUNT',
  FRAUDSTER_ACCOUNT = 'FRAUDSTER_ACCOUNT',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * PixFraudDetection.
 */
export interface PixFraudDetection extends Domain<string> {
  externalId?: string;
  document: string;
  fraudType: PixFraudDetectionType;
  personType: PersonType;
  key?: string;
  status: PixFraudDetectionStatus;
  state: PixFraudDetectionState;
  issueId?: number;
  failed?: Failed;
  createdAt: Date;
  updatedAt: Date;
}

export class PixFraudDetectionEntity implements PixFraudDetection {
  id: string;
  externalId?: string;
  document: string;
  fraudType: PixFraudDetectionType;
  personType: PersonType;
  key?: string;
  status: PixFraudDetectionStatus;
  state: PixFraudDetectionState;
  issueId?: number;
  failed?: Failed;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<PixFraudDetection>) {
    Object.assign(this, props);
  }
}
