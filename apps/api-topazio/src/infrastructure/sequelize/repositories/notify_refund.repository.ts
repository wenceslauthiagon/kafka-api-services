import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { NotifyRefundModel } from '@zro/api-topazio/infrastructure';
import { NotifyRefund, NotifyRefundRepository } from '@zro/api-topazio/domain';
import { PixRefundStatus } from '@zro/pix-payments/domain';

export class NotifyRefundDatabaseRepository
  extends DatabaseRepository
  implements NotifyRefundRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(notifyRefund: NotifyRefundModel): NotifyRefund {
    return notifyRefund?.toDomain() ?? null;
  }

  async create(notifyRefund: NotifyRefund): Promise<NotifyRefund> {
    const createdNotifyRefund =
      await NotifyRefundModel.create<NotifyRefundModel>(notifyRefund, {
        transaction: this.transaction,
      });

    notifyRefund.createdAt = createdNotifyRefund.createdAt;

    return createdNotifyRefund;
  }

  async getBySolicitationIdAndStatus(
    solicitationId: string,
    status: PixRefundStatus,
  ): Promise<NotifyRefund> {
    return NotifyRefundModel.findOne<NotifyRefundModel>({
      where: {
        solicitationId,
        status,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(NotifyRefundDatabaseRepository.toDomain);
  }
}
