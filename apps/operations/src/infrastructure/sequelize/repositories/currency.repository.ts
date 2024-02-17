import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
} from '@zro/common';
import {
  Currency,
  CurrencyRepository,
  CurrencyState,
  TGetCurrencyFilter,
} from '@zro/operations/domain';
import { CurrencyModel } from '@zro/operations/infrastructure';

export class CurrencyDatabaseRepository
  extends DatabaseRepository
  implements CurrencyRepository
{
  /**
   * Convert Currency model to Currency domain.
   * @param currency Model instance.
   * @returns Domain instance.
   */
  static toDomain(currency: CurrencyModel): Currency {
    return currency?.toDomain() ?? null;
  }

  /**
   * Insert a Currency.
   * @param {Currency} currency Currency to save.
   * @returns {Currency} Created currency.
   */
  async create(currency: Currency): Promise<Currency> {
    const createdCurrency = await CurrencyModel.create<CurrencyModel>(
      currency,
      { transaction: this.transaction },
    );

    currency.id = createdCurrency.id;
    currency.symbolAlign = createdCurrency.symbolAlign;
    currency.state = createdCurrency.state;

    return currency;
  }

  /**
   * Get currency by tag.
   *
   * @param tag Currency tag.
   * @returns Currency if found or null otherwise.
   */
  async getByTag(tag: string): Promise<Currency> {
    return CurrencyModel.findOne({
      where: { tag },
      transaction: this.transaction,
    }).then(CurrencyDatabaseRepository.toDomain);
  }

  /**
   * Get currency by id.
   *
   * @param id Currency id.
   * @returns Currency if found or null otherwise.
   */
  async getById(id: number): Promise<Currency> {
    return CurrencyModel.findOne({
      where: { id },
      transaction: this.transaction,
    }).then(CurrencyDatabaseRepository.toDomain);
  }

  /**
   * Get currency by symbol.
   *
   * @param symbol Currency symbol.
   * @returns Currency if found or null otherwise.
   */
  async getBySymbol(symbol: string): Promise<Currency> {
    return CurrencyModel.findOne({
      where: { symbol },
      transaction: this.transaction,
    }).then(CurrencyDatabaseRepository.toDomain);
  }

  async getAll(): Promise<Currency[]> {
    return CurrencyModel.findAll({
      transaction: this.transaction,
    }).then((data) => data.map(CurrencyDatabaseRepository.toDomain));
  }

  async getByFilter(
    pagination: Pagination,
    filter: TGetCurrencyFilter,
  ): Promise<TPaginationResponse<Currency>> {
    return CurrencyModel.findAndCountAll<CurrencyModel>({
      where: { ...filter },
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(CurrencyDatabaseRepository.toDomain),
      ),
    );
  }

  /**
   * Get all currency by state.
   *
   * @param state Currency state.
   * @returns Currency if found or null otherwise.
   */
  async getAllByState(state: CurrencyState): Promise<Currency[]> {
    return CurrencyModel.findAll({
      where: { state },
      transaction: this.transaction,
    }).then((data) => data.map(CurrencyDatabaseRepository.toDomain));
  }
}
