import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { KeyState, PixKey, PixKeyRepository } from '@zro/pix-keys/domain';
import { PixKeyModel } from '@zro/pix-keys/infrastructure';

export class PixKeyDatabaseRepository
  extends DatabaseRepository
  implements PixKeyRepository
{
  static toDomain(pixKeyModel: PixKeyModel): PixKey {
    return pixKeyModel?.toDomain() ?? null;
  }

  async create(pixKey: PixKey): Promise<PixKey> {
    const createdPixKey = await PixKeyModel.create<PixKeyModel>(pixKey, {
      transaction: this.transaction,
    });

    pixKey.createdAt = createdPixKey.createdAt;
    pixKey.updatedAt = createdPixKey.updatedAt;
    return pixKey;
  }

  async update(pixKey: PixKey): Promise<PixKey> {
    await PixKeyModel.update<PixKeyModel>(pixKey, {
      where: { id: pixKey.id },
      transaction: this.transaction,
    });

    return pixKey;
  }

  async getByIdAndStateIsNotCanceled(id: string): Promise<PixKey> {
    return PixKeyModel.findOne<PixKeyModel>({
      where: {
        id,
        state: {
          [Op.notIn]: [KeyState.CANCELED],
        },
      },
      transaction: this.transaction,
    }).then(PixKeyDatabaseRepository.toDomain);
  }

  async getByKeyAndStateIsNotCanceled(key: string): Promise<PixKey[]> {
    return PixKeyModel.findAll<PixKeyModel>({
      where: {
        key,
        state: {
          [Op.notIn]: [KeyState.CANCELED],
        },
      },
      transaction: this.transaction,
    }).then((data) => data.map(PixKeyDatabaseRepository.toDomain));
  }

  async getByUserAndKeyAndStateIsNotCanceled(
    user: User,
    key: string,
  ): Promise<PixKey> {
    return PixKeyModel.findOne<PixKeyModel>({
      where: {
        userId: user.uuid,
        key,
        state: {
          [Op.notIn]: [KeyState.CANCELED],
        },
      },
      transaction: this.transaction,
    }).then(PixKeyDatabaseRepository.toDomain);
  }

  async countByUserAndStateIsNotCanceled(user: User): Promise<number> {
    return PixKeyModel.count<PixKeyModel>({
      where: {
        userId: user.uuid,
        state: {
          [Op.notIn]: [KeyState.CANCELED],
        },
      },
      transaction: this.transaction,
    });
  }

  async getByUserAndStateIsNotCanceled(
    pagination: Pagination,
    user?: User,
  ): Promise<TPaginationResponse<PixKey>> {
    return PixKeyModel.findAndCountAll<PixKeyModel>({
      ...paginationWhere(pagination),
      where: {
        ...(user?.uuid && { userId: user.uuid }),
        state: {
          [Op.notIn]: [KeyState.CANCELED],
        },
      },
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(PixKeyDatabaseRepository.toDomain),
      ),
    );
  }

  async getByUserAndIdAndStateIsNotCanceled(
    user: User,
    id: string,
  ): Promise<PixKey> {
    return PixKeyModel.findOne<PixKeyModel>({
      where: {
        id,
        userId: user.uuid,
        state: {
          [Op.notIn]: [KeyState.CANCELED],
        },
      },
      transaction: this.transaction,
    }).then(PixKeyDatabaseRepository.toDomain);
  }

  async getByLessUpdatedAtAndStateIn(
    updatedAt: Date,
    states: KeyState[],
  ): Promise<PixKey[]> {
    return PixKeyModel.findAll<PixKeyModel>({
      where: {
        updatedAt: { [Op.lt]: updatedAt },
        state: { [Op.in]: states },
      },
      transaction: this.transaction,
    }).then((data) => data.map(PixKeyDatabaseRepository.toDomain));
  }

  async getById(id: string): Promise<PixKey> {
    return PixKeyModel.findOne<PixKeyModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(PixKeyDatabaseRepository.toDomain);
  }

  async getByKeyAndStateIn(key: string, states: KeyState[]): Promise<PixKey[]> {
    return PixKeyModel.findAll<PixKeyModel>({
      where: {
        key,
        state: { [Op.in]: states },
      },
      transaction: this.transaction,
    }).then((data) => data.map(PixKeyDatabaseRepository.toDomain));
  }

  async getByState(state: KeyState): Promise<PixKey[]> {
    return PixKeyModel.findAll<PixKeyModel>({
      where: {
        state,
      },
      transaction: this.transaction,
    }).then((data) => data.map(PixKeyDatabaseRepository.toDomain));
  }
}
