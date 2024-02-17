import { Transaction } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { PixKey } from '@zro/pix-keys/domain';
import { QrCodeStatic, QrCodeStaticRepository } from '@zro/pix-payments/domain';
import { QrCodeStaticModel } from '@zro/pix-payments/infrastructure';

export class QrCodeStaticDatabaseRepository
  extends DatabaseRepository
  implements QrCodeStaticRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(qrCodeStaticModel: QrCodeStaticModel): QrCodeStatic {
    return qrCodeStaticModel?.toDomain() ?? null;
  }

  async create(qrCodeStatic: QrCodeStatic): Promise<QrCodeStatic> {
    const QreatedqrCodeStatic =
      await QrCodeStaticModel.create<QrCodeStaticModel>(qrCodeStatic, {
        transaction: this.transaction,
      });

    qrCodeStatic.createdAt = QreatedqrCodeStatic.createdAt;

    return qrCodeStatic;
  }

  async update(qrCodeStatic: QrCodeStatic): Promise<QrCodeStatic> {
    await QrCodeStaticModel.update<QrCodeStaticModel>(qrCodeStatic, {
      where: { id: qrCodeStatic.id },
      transaction: this.transaction,
    });

    return qrCodeStatic;
  }

  async deleteById(id: string): Promise<number> {
    return QrCodeStaticModel.destroy<QrCodeStaticModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    });
  }

  async getById(id: string): Promise<QrCodeStatic> {
    return QrCodeStaticModel.findOne<QrCodeStaticModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(QrCodeStaticDatabaseRepository.toDomain);
  }

  async getByPixKey(pixKey: PixKey): Promise<QrCodeStatic[]> {
    return QrCodeStaticModel.findAll<QrCodeStaticModel>({
      where: {
        keyId: pixKey.id,
      },
      transaction: this.transaction,
    }).then((res) => res.map(QrCodeStaticDatabaseRepository.toDomain));
  }

  async getAllByUser(
    user: User,
    pagination: Pagination,
  ): Promise<TPaginationResponse<QrCodeStatic>> {
    return QrCodeStaticModel.findAndCountAll<QrCodeStaticModel>({
      ...paginationWhere(pagination),
      where: { userId: user.uuid },
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(QrCodeStaticDatabaseRepository.toDomain),
      ),
    );
  }
}
