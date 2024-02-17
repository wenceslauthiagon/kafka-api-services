import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import {
  PixKeyHistory,
  PixKeyHistoryRepository,
  GetPixKeyHistoryFilter,
  GetPixKeyFilter,
  FilterWhere,
} from '@zro/pix-keys/domain';
import { PixKeyHistoryModel, PixKeyModel } from '@zro/pix-keys/infrastructure';

export class PixKeyHistoryDatabaseRepository
  extends DatabaseRepository
  implements PixKeyHistoryRepository
{
  static toDomain(pixKeyHistoryModel: PixKeyHistoryModel): PixKeyHistory {
    return pixKeyHistoryModel?.toDomain() ?? null;
  }

  async create(pixKeyHistory: PixKeyHistory): Promise<PixKeyHistory> {
    const createdPixKey = await PixKeyHistoryModel.create<PixKeyHistoryModel>(
      pixKeyHistory,
      {
        transaction: this.transaction,
      },
    );

    pixKeyHistory.createdAt = createdPixKey.createdAt;
    pixKeyHistory.updatedAt = createdPixKey.updatedAt;
    return pixKeyHistory;
  }

  async getByFilter(
    pagination: Pagination,
    filter: GetPixKeyHistoryFilter,
    filterPixKey: GetPixKeyFilter,
  ): Promise<TPaginationResponse<PixKeyHistory>> {
    return PixKeyHistoryModel.findAndCountAll<PixKeyHistoryModel>({
      where: { ...this._filterWhere(filter) },
      include: { model: PixKeyModel, where: { ...filterPixKey } },
      ...paginationWhere(pagination),
      transaction: this.transaction,
      paranoid: false,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(PixKeyHistoryDatabaseRepository.toDomain),
      ),
    );
  }

  private _filterWhere(filter: GetPixKeyHistoryFilter): FilterWhere {
    let whereCreatedAt = {},
      whereUpdatedAt = {};
    if (Object.keys(filter.createdAt).length) {
      whereCreatedAt = {
        createdAt: {
          [Op.between]: [filter.createdAt.start, filter.createdAt.end],
        },
      };
    }
    if (Object.keys(filter.updatedAt).length) {
      whereUpdatedAt = {
        updatedAt: {
          [Op.between]: [filter.updatedAt.start, filter.updatedAt.end],
        },
      };
    }
    delete filter.createdAt;
    delete filter.updatedAt;
    return {
      ...filter,
      ...whereCreatedAt,
      ...whereUpdatedAt,
    };
  }
}
