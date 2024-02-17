import { Op } from 'sequelize';
import { DatabaseRepository, getMoment } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  DecodedPixKey,
  DecodedPixKeyRepository,
  DecodedPixKeyState,
} from '@zro/pix-keys/domain';
import { DecodedPixKeyModel } from '@zro/pix-keys/infrastructure';

export class DecodedPixKeyDatabaseRepository
  extends DatabaseRepository
  implements DecodedPixKeyRepository
{
  static toDomain(decodedPixKeyModel: DecodedPixKeyModel): DecodedPixKey {
    return decodedPixKeyModel?.toDomain() ?? null;
  }

  async create(decodedPixKey: DecodedPixKey): Promise<DecodedPixKey> {
    const createdDecodedPixKey =
      await DecodedPixKeyModel.create<DecodedPixKeyModel>(decodedPixKey, {
        transaction: this.transaction,
      });

    decodedPixKey.createdAt = createdDecodedPixKey.createdAt;
    decodedPixKey.updatedAt = createdDecodedPixKey.updatedAt;
    return decodedPixKey;
  }

  async update(decodedPixKey: DecodedPixKey): Promise<DecodedPixKey> {
    await DecodedPixKeyModel.update<DecodedPixKeyModel>(decodedPixKey, {
      where: { id: decodedPixKey.id },
      transaction: this.transaction,
    });

    return decodedPixKey;
  }

  async getById(id: string): Promise<DecodedPixKey> {
    return DecodedPixKeyModel.findOne<DecodedPixKeyModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(DecodedPixKeyDatabaseRepository.toDomain);
  }

  async getByUser(user: User): Promise<DecodedPixKey> {
    return DecodedPixKeyModel.findOne<DecodedPixKeyModel>({
      where: {
        userId: user.uuid,
      },
      transaction: this.transaction,
    }).then(DecodedPixKeyDatabaseRepository.toDomain);
  }

  async getByUserAndEndToEndId(
    user: User,
    endToEndId: string,
  ): Promise<DecodedPixKey> {
    return DecodedPixKeyModel.findOne<DecodedPixKeyModel>({
      where: {
        userId: user.id,
        endToEndId,
      },
      transaction: this.transaction,
    }).then(DecodedPixKeyDatabaseRepository.toDomain);
  }

  async getByUserAndCreatedAtAfterAndState(
    user: User,
    createdAt: Date,
    state: DecodedPixKeyState,
  ): Promise<DecodedPixKey[]> {
    return DecodedPixKeyModel.findAll<DecodedPixKeyModel>({
      where: {
        userId: user.id,
        createdAt: { [Op.gt]: createdAt },
        state,
      },
      transaction: this.transaction,
    }).then((data) => data.map(DecodedPixKeyDatabaseRepository.toDomain));
  }

  async countLast24HoursAndNotConfirmed(user: User) {
    return DecodedPixKeyModel.count<DecodedPixKeyModel>({
      where: {
        userId: user.uuid,
        createdAt: {
          [Op.gt]: getMoment().subtract(24, 'hours').toDate(),
        },
        state: {
          [Op.not]: DecodedPixKeyState.CONFIRMED,
        },
      },
      transaction: this.transaction,
    });
  }
}
