import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  QrCodeDynamic,
  QrCodeDynamicRepository,
} from '@zro/pix-payments/domain';
import { QrCodeDynamicModel } from '@zro/pix-payments/infrastructure';

export class QrCodeDynamicDatabaseRepository
  extends DatabaseRepository
  implements QrCodeDynamicRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }
  static toDomain(qrCodeDynamicModel: QrCodeDynamicModel): QrCodeDynamic {
    return qrCodeDynamicModel?.toDomain() ?? null;
  }

  async getById(id: string): Promise<QrCodeDynamic> {
    return QrCodeDynamicModel.findOne<QrCodeDynamicModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(QrCodeDynamicDatabaseRepository.toDomain);
  }

  async getByIdAndUser(id: string, user: User): Promise<QrCodeDynamic> {
    return QrCodeDynamicModel.findOne<QrCodeDynamicModel>({
      where: {
        id,
        userId: user.uuid,
      },
      transaction: this.transaction,
    }).then(QrCodeDynamicDatabaseRepository.toDomain);
  }

  async create(qrCodeDynamic: QrCodeDynamic): Promise<QrCodeDynamic> {
    const qrCodeDynamicCreated =
      await QrCodeDynamicModel.create<QrCodeDynamicModel>(qrCodeDynamic, {
        transaction: this.transaction,
      });

    qrCodeDynamic.createdAt = qrCodeDynamicCreated.createdAt;

    return qrCodeDynamic;
  }

  async update(qrCodeDynamic: QrCodeDynamic): Promise<QrCodeDynamic> {
    await QrCodeDynamicModel.update<QrCodeDynamicModel>(qrCodeDynamic, {
      where: { id: qrCodeDynamic.id },
      transaction: this.transaction,
    });

    return qrCodeDynamic;
  }
}
