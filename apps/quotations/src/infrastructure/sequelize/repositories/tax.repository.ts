import { Transaction } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  PaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import { GetTaxFilter, Tax, TaxRepository } from '@zro/quotations/domain';
import { TaxModel } from '@zro/quotations/infrastructure';

export class TaxDatabaseRepository
  extends DatabaseRepository
  implements TaxRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(model: TaxModel): Tax {
    return model?.toDomain() ?? null;
  }

  async create(Tax: Tax): Promise<Tax> {
    const createdTax = await TaxModel.create<TaxModel>(Tax, {
      transaction: this.transaction,
    });

    Tax.id = createdTax.id;
    Tax.createdAt = createdTax.createdAt;

    return Tax;
  }

  async getById(id: string): Promise<Tax> {
    return TaxModel.findOne<TaxModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(TaxDatabaseRepository.toDomain);
  }

  async getByName(name: string): Promise<Tax> {
    return TaxModel.findOne<TaxModel>({
      where: {
        name,
      },
      transaction: this.transaction,
    }).then(TaxDatabaseRepository.toDomain);
  }

  async getAllByFilterAndPagination(
    pagination: Pagination,
    filter: GetTaxFilter,
  ): Promise<PaginationResponse<Tax>> {
    return TaxModel.findAndCountAll<TaxModel>({
      where: {
        ...this._filterWhere(filter),
      },
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(TaxDatabaseRepository.toDomain),
      ),
    );
  }

  private _filterWhere(filter: GetTaxFilter) {
    const stringTransform = (property: string, value: string) => {
      const filterOption = value;
      return [property, filterOption];
    };

    const transformFilterMapper = {
      name: (nameString: string) => stringTransform('name', nameString),
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
