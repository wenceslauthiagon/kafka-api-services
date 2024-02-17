import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
} from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  StreamPair,
  GetStreamPairFilter,
  StreamPairRepository,
} from '@zro/quotations/domain';
import { StreamPairModel } from '@zro/quotations/infrastructure';

export class StreamPairDatabaseRepository
  extends DatabaseRepository
  implements StreamPairRepository
{
  static toDomain(pairModel: StreamPairModel): StreamPair {
    return pairModel?.toDomain() ?? null;
  }

  async create(pair: StreamPair): Promise<StreamPair> {
    return StreamPairModel.create(pair, {
      transaction: this.transaction,
    }).then(StreamPairDatabaseRepository.toDomain);
  }

  async update(pair: StreamPair): Promise<StreamPair> {
    await StreamPairModel.update(pair, {
      where: { id: pair.id },
      transaction: this.transaction,
    });

    return pair;
  }

  async getById(id: string): Promise<StreamPair> {
    return StreamPairModel.findOne<StreamPairModel>({
      where: { id },
      transaction: this.transaction,
    }).then(StreamPairDatabaseRepository.toDomain);
  }

  async getAllActiveIsTrue(): Promise<StreamPair[]> {
    return StreamPairModel.findAll<StreamPairModel>({
      where: { active: true },
      transaction: this.transaction,
    }).then((data) => data.map(StreamPairDatabaseRepository.toDomain));
  }

  async getAllByFilterAndPagination(
    pagination: Pagination,
    filter: GetStreamPairFilter,
  ): Promise<TPaginationResponse<StreamPair>> {
    return StreamPairModel.findAndCountAll<StreamPairModel>({
      ...paginationWhere(pagination),
      where: filter,
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(StreamPairDatabaseRepository.toDomain),
      ),
    );
  }

  async getByGatewayNameAndActiveIsTrue(
    gatewayName: string,
  ): Promise<StreamPair[]> {
    return StreamPairModel.findAll<StreamPairModel>({
      where: { active: true, gatewayName },
      transaction: this.transaction,
    }).then((pairs) => pairs.map(StreamPairDatabaseRepository.toDomain));
  }

  async getAllByBaseAndQuoteCurrencyAndActiveIsTrue(
    baseCurrency: Currency,
    quoteCurrency: Currency,
  ): Promise<StreamPair[]> {
    return StreamPairModel.findAll<StreamPairModel>({
      where: {
        active: true,
        baseCurrencyId: baseCurrency.id,
        quoteCurrencyId: quoteCurrency.id,
      },
      transaction: this.transaction,
    }).then((data) => data.map(StreamPairDatabaseRepository.toDomain));
  }
}
