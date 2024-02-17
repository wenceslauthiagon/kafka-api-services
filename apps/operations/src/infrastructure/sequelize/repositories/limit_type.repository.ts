import { isObject } from 'class-validator';
import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
} from '@zro/common';
import {
  LimitType,
  LimitTypeFilter,
  LimitTypeRepository,
  TransactionType,
} from '@zro/operations/domain';
import {
  LimitTypeModel,
  TransactionTypeModel,
} from '@zro/operations/infrastructure';

export class LimitTypeDatabaseRepository
  extends DatabaseRepository
  implements LimitTypeRepository
{
  /**
   * Convert LimitType model to LimitType domain.
   * @param limitType Model instance.
   * @returns Domain instance.
   */
  static toDomain(limitType: LimitTypeModel): LimitType {
    return limitType?.toDomain() ?? null;
  }

  /**
   * Get limit type by transaction type.
   * @param transactionType Transaction type.
   * @returns Limit type if found or null otherwise.
   */
  async getByTransactionType(
    transactionType: TransactionType,
  ): Promise<LimitType> {
    return LimitTypeModel.findOne({
      include: [
        {
          model: TransactionTypeModel,
          where: {
            id: transactionType.id,
          },
        },
      ],
      transaction: this.transaction,
    }).then(LimitTypeDatabaseRepository.toDomain);
  }

  /**
   * Get limit type by if.
   * @param id Limit type id.
   * @returns Limit type if found or null otherwise.
   */
  async getById(id: number): Promise<LimitType> {
    return LimitTypeModel.findOne({
      where: {
        id,
      },
      include: {
        model: TransactionTypeModel,
      },
      transaction: this.transaction,
    }).then(LimitTypeDatabaseRepository.toDomain);
  }

  /**
   * Get limit types by filter.
   *
   * @param filter filter.
   * @param pagination Pagination
   * @returns Limit types if found.
   */
  async getByFilter(
    filter: LimitTypeFilter,
    pagination: Pagination,
  ): Promise<TPaginationResponse<LimitType>> {
    const { transactionTypeTag, ...restOfFilter } = filter;

    const includeOption = {
      include: {
        model: TransactionTypeModel,
        required: true,
        where: { tag: transactionTypeTag },
      },
    };

    return LimitTypeModel.findAndCountAll<LimitTypeModel>({
      where: { ...this._filterWhere(restOfFilter) },
      ...(transactionTypeTag ? includeOption : {}),
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(LimitTypeDatabaseRepository.toDomain),
      ),
    );
  }

  /**
   * Get all limit types.
   *
   * @returns Limit types.
   */
  async getAll(): Promise<LimitType[]> {
    return LimitTypeModel.findAll<LimitTypeModel>({
      transaction: this.transaction,
    }).then((data) => data.map(LimitTypeDatabaseRepository.toDomain));
  }

  private _filterWhere(filter: LimitTypeFilter) {
    const entriesOfFilter = Object.entries(filter);

    const entriesWithCorrectValue = entriesOfFilter.filter(
      ([, value]) =>
        (isObject(value) && Object.keys(value).length) || value !== undefined,
    );

    const filterObject = Object.fromEntries(entriesWithCorrectValue);

    return filterObject;
  }
}
