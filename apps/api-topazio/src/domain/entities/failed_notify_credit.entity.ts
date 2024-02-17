import { Domain, FailedEntity } from '@zro/common';

export interface FailedNotifyCredit extends Domain<string> {
  transactionId: string;
  failed?: FailedEntity;
  createdAt: Date;
  updatedAt: Date;
}

export class FailedNotifyCreditEntity implements FailedNotifyCredit {
  id: string;
  transactionId: string;
  failed?: FailedEntity;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<FailedNotifyCredit>) {
    Object.assign(this, props);
  }
}
