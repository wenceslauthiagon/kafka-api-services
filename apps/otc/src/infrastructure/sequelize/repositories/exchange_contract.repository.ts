import { Op, Transaction } from 'sequelize';
import { isString } from 'class-validator';
import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import {
  ExchangeContract,
  ExchangeContractRepository,
  GetExchangeContractFilter,
  TGetIntervalFilters,
  TGetTimestampFilters,
} from '@zro/otc/domain';
import { File } from '@zro/storage/domain';
import { ExchangeContractModel } from '@zro/otc/infrastructure';

export class ExchangeContractDatabaseRepository
  extends DatabaseRepository
  implements ExchangeContractRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(model: ExchangeContractModel): ExchangeContract {
    return model?.toDomain() ?? null;
  }

  async create(exchangeContract: ExchangeContract): Promise<ExchangeContract> {
    const createdExchangeContract =
      await ExchangeContractModel.create<ExchangeContractModel>(
        exchangeContract,
        { transaction: this.transaction },
      );

    exchangeContract.id = createdExchangeContract.id;
    exchangeContract.createdAt = createdExchangeContract.createdAt;

    return exchangeContract;
  }

  async update(exchangeContract: ExchangeContract): Promise<ExchangeContract> {
    await ExchangeContractModel.update<ExchangeContractModel>(
      exchangeContract,
      {
        where: { id: exchangeContract.id },
        transaction: this.transaction,
      },
    );

    return exchangeContract;
  }

  async getById(id: string): Promise<ExchangeContract> {
    return ExchangeContractModel.findOne<ExchangeContractModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(ExchangeContractDatabaseRepository.toDomain);
  }

  async getByFileId(file: File): Promise<ExchangeContract> {
    return ExchangeContractModel.findOne<ExchangeContractModel>({
      where: {
        fileId: file.id,
      },
      transaction: this.transaction,
    }).then(ExchangeContractDatabaseRepository.toDomain);
  }

  async getAll(
    pagination: Pagination,
  ): Promise<TPaginationResponse<ExchangeContract>> {
    return ExchangeContractModel.findAndCountAll<ExchangeContractModel>({
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(ExchangeContractDatabaseRepository.toDomain),
      ),
    );
  }

  async getAllByFilter(
    filter: GetExchangeContractFilter,
    search?: string,
  ): Promise<ExchangeContract[]> {
    return ExchangeContractModel.findAll<ExchangeContractModel>({
      where: {
        ...(isString(search) && {
          contractNumber: { [Op.iLike]: `%${search}%` },
        }),
        ...this._filterWhere(filter),
      },
      transaction: this.transaction,
    }).then((data) => data.map(ExchangeContractDatabaseRepository.toDomain));
  }

  async getAllByFilterAndPagination(
    pagination: Pagination,
    filter: GetExchangeContractFilter,
    search?: string,
  ): Promise<TPaginationResponse<ExchangeContract>> {
    return ExchangeContractModel.findAndCountAll<ExchangeContractModel>({
      where: {
        ...(isString(search) && {
          contractNumber: { [Op.iLike]: `%${search}%` },
        }),
        ...this._filterWhere(filter),
      },
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(ExchangeContractDatabaseRepository.toDomain),
      ),
    );
  }

  private _filterWhere(filter: GetExchangeContractFilter) {
    const rangeTransform = (
      property: string,
      rangeObject: TGetIntervalFilters | TGetTimestampFilters,
    ) => {
      const { start, end } = rangeObject;

      if (start && end) {
        const filterOption = { [Op.between]: [start, end] };
        return [property, filterOption];
      }

      if (start) {
        const filterOption = { [Op.gte]: start };
        return [property, filterOption];
      }

      if (end) {
        const filterOption = { [Op.lte]: end };
        return [property, filterOption];
      }
    };

    const arrayTransform = (property: string, values: string[]) => {
      const filterOption = { [Op.in]: values };

      return [property, filterOption];
    };

    const transformFilterMapper = {
      vetQuote: (vetQuoteObject: TGetIntervalFilters) =>
        rangeTransform('vetQuote', vetQuoteObject),
      contractQuote: (contractQuoteObject: TGetIntervalFilters) =>
        rangeTransform('contractQuote', contractQuoteObject),
      totalAmount: (totalAmountObject: TGetIntervalFilters) =>
        rangeTransform('totalAmount', totalAmountObject),
      createdAt: (createdAtObject: TGetTimestampFilters) =>
        rangeTransform('createdAt', createdAtObject),
      exchangeContractIds: (exchangeContractIds: string[]) =>
        arrayTransform('id', exchangeContractIds),
    };

    const entriesOfFilter = Object.entries(filter);

    const entriesWithCorrecValue = entriesOfFilter.filter(
      ([, value]) => Object.keys(value).length,
    );

    const transformedEntries = entriesWithCorrecValue.map(([key, value]) => {
      const isToTransform = transformFilterMapper[key];

      if (isToTransform) {
        const functionOfTransform = transformFilterMapper[key];
        return functionOfTransform(value);
      }

      return [key, value];
    });

    const filterObject = Object.fromEntries(transformedEntries);

    return filterObject;
  }
}
