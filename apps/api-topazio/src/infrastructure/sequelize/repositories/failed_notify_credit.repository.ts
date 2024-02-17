import { DatabaseRepository } from '@zro/common';
import { FailedNotifyCreditModel } from '@zro/api-topazio/infrastructure';
import {
  FailedNotifyCredit,
  FailedNotifyCreditRepository,
} from '@zro/api-topazio/domain';

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
        {
          transaction: this.transaction,
        },
      );

    failedNotifyCredit.id = createdFailedNotifyCredit.id;
    failedNotifyCredit.createdAt = createdFailedNotifyCredit.createdAt;

    return failedNotifyCredit;
  }

  async getByTransactionId(transactionId: string): Promise<FailedNotifyCredit> {
    return FailedNotifyCreditModel.findOne<FailedNotifyCreditModel>({
      where: {
        transactionId,
      },
      transaction: this.transaction,
    }).then(FailedNotifyCreditDatabaseRepository.toDomain);
  }
}
