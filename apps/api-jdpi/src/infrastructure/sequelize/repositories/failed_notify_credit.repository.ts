import { DatabaseRepository } from '@zro/common';
import {
  FailedNotifyCredit,
  FailedNotifyCreditRepository,
} from '@zro/api-jdpi/domain';
import { FailedNotifyCreditModel } from '@zro/api-jdpi/infrastructure';

export class FailedNotifyCreditDatabaseRepository
  extends DatabaseRepository
  implements FailedNotifyCreditRepository
{
  static toDomain(
    failedNotifyCredit: FailedNotifyCreditModel,
  ): FailedNotifyCredit {
    return failedNotifyCredit?.toDomain() ?? null;
  }

  async create(
    failedNotifyCredit: FailedNotifyCredit,
  ): Promise<FailedNotifyCredit> {
    const createdFailedNotifyCredit =
      await FailedNotifyCreditModel.create<FailedNotifyCreditModel>(
        failedNotifyCredit,
        { transaction: this.transaction },
      );

    failedNotifyCredit.id = createdFailedNotifyCredit.id;
    failedNotifyCredit.createdAt = createdFailedNotifyCredit.createdAt;

    return failedNotifyCredit;
  }
}
