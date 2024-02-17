import { DatabaseRepository } from '@zro/common';
import {
  NotifyCreditDevolution,
  NotifyCreditDevolutionRepository,
} from '@zro/api-jdpi/domain';
import { NotifyCreditDevolutionModel } from '@zro/api-jdpi/infrastructure';

export class NotifyCreditDevolutionDatabaseRepository
  extends DatabaseRepository
  implements NotifyCreditDevolutionRepository
{
  static toDomain(
    notifyCreditDevolution: NotifyCreditDevolutionModel,
  ): NotifyCreditDevolution {
    return notifyCreditDevolution?.toDomain() ?? null;
  }

  async create(
    notifyCreditDevolution: NotifyCreditDevolution,
  ): Promise<NotifyCreditDevolution> {
    const createdNotifyCredit =
      await NotifyCreditDevolutionModel.create<NotifyCreditDevolutionModel>(
        notifyCreditDevolution,
        { transaction: this.transaction },
      );

    notifyCreditDevolution.id = createdNotifyCredit.id;

    return notifyCreditDevolution;
  }
}
