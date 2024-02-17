import { Transaction } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency } from '@zro/operations/domain';
import { Spread, SpreadRepository } from '@zro/otc/domain';
import { SpreadModel } from '@zro/otc/infrastructure';

export class SpreadDatabaseRepository
  extends DatabaseRepository
  implements SpreadRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(model: SpreadModel): Spread {
    return model?.toDomain() ?? null;
  }

  async create(spread: Spread): Promise<Spread> {
    const createdSpread = await SpreadModel.create<SpreadModel>(spread, {
      transaction: this.transaction,
    });

    spread.id = createdSpread.id;
    spread.createdAt = createdSpread.createdAt;

    return spread;
  }

  async deleteByCurrency(currency: Currency): Promise<number> {
    return SpreadModel.destroy<SpreadModel>({
      where: {
        currencyId: currency.id,
      },
      transaction: this.transaction,
    });
  }

  async getById(id: string): Promise<Spread> {
    return SpreadModel.findOne<SpreadModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(SpreadDatabaseRepository.toDomain);
  }

  async getByCurrency(currency: Currency): Promise<Spread> {
    return SpreadModel.findOne<SpreadModel>({
      where: {
        userId: null,
        currencySymbol: currency.symbol,
      },
      transaction: this.transaction,
    }).then(SpreadDatabaseRepository.toDomain);
  }

  async getByUserAndCurrency(user: User, currency: Currency): Promise<Spread> {
    return SpreadModel.findOne<SpreadModel>({
      where: {
        userId: user.uuid,
        currencySymbol: currency.symbol,
      },
      transaction: this.transaction,
    }).then(SpreadDatabaseRepository.toDomain);
  }

  async getAll(pagination: Pagination): Promise<TPaginationResponse<Spread>> {
    return SpreadModel.findAndCountAll<SpreadModel>({
      ...paginationWhere(pagination),
      transaction: this.transaction,
      paranoid: false,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(SpreadDatabaseRepository.toDomain),
      ),
    );
  }
}
