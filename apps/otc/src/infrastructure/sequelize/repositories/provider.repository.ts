import { Transaction } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import { Provider, ProviderRepository } from '@zro/otc/domain';
import { ProviderModel } from '@zro/otc/infrastructure';

export class ProviderDatabaseRepository
  extends DatabaseRepository
  implements ProviderRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(model: ProviderModel): Provider {
    return model?.toDomain() ?? null;
  }

  async create(provider: Provider): Promise<Provider> {
    const createdProvider = await ProviderModel.create<ProviderModel>(
      provider,
      { transaction: this.transaction },
    );

    provider.id = createdProvider.id;
    provider.createdAt = createdProvider.createdAt;

    return provider;
  }

  async getById(id: string): Promise<Provider> {
    return ProviderModel.findOne<ProviderModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(ProviderDatabaseRepository.toDomain);
  }

  async getByName(name: string): Promise<Provider> {
    return ProviderModel.findOne<ProviderModel>({
      where: {
        name,
      },
      transaction: this.transaction,
    }).then(ProviderDatabaseRepository.toDomain);
  }

  async getAll(pagination: Pagination): Promise<TPaginationResponse<Provider>> {
    return ProviderModel.findAndCountAll<ProviderModel>({
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(ProviderDatabaseRepository.toDomain),
      ),
    );
  }
}
