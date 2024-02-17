import { Domain, FailedEntity } from '@zro/common';
import { NotifyCreditTransactionType } from '@zro/api-jdpi/domain';

export interface FailedNotifyCredit extends Domain<string> {
  externalId: string;
  failed: FailedEntity;
  failedTransactionType: NotifyCreditTransactionType;
  createdAt: Date;
  updatedAt: Date;
}

export class FailedNotifyCreditEntity implements FailedNotifyCredit {
  id: string;
  externalId: string;
  failed: FailedEntity;
  failedTransactionType: NotifyCreditTransactionType;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<FailedNotifyCredit>) {
    Object.assign(this, props);
  }
}
