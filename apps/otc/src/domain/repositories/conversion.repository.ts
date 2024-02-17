import { Pagination, TPaginationResponse } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';
import { Conversion, OrderSide } from '@zro/otc/domain';

export type TGetConversionFilter = {
  operationId?: string;
  currencyId?: number;
  currencySymbol?: string;
  quotationId?: string;
  conversionType?: OrderSide;
  clientName?: string;
  clientDocument?: string;
  createdAtStart?: Date;
  createdAtEnd?: Date;
};

export interface ConversionRepository {
  /**
   * Insert a Conversion.
   * @param conversion Conversion to save.
   * @returns Created conversion.
   */
  create(conversion: Conversion): Promise<Conversion>;

  /**
   * Update a Conversion.
   * @param conversion Conversion to save.
   * @returns Created conversion.
   */
  update(conversion: Conversion): Promise<Conversion>;

  /**
   * Search by Conversion ID.
   * @param id Conversion ID.
   * @return Conversion found.
   */
  getById(id: string): Promise<Conversion>;

  /**
   * Search by Conversion user and ID.
   * @param user conversion owner.
   * @param id Conversion ID.
   * @return Conversion found.
   */
  getByUserAndId(user: User, id: string): Promise<Conversion>;

  /**
   * Search by operation ID.
   * @param operation operation.
   * @return Conversion found.
   */
  getByOperation(operation: Operation): Promise<Conversion>;

  /**
   * Search by user and operation.
   * @param user conversion owner.
   * @param operation operation.
   * @return Conversion found.
   */
  getByUserAndOperation(user: User, operation: Operation): Promise<Conversion>;

  /**
   * Search by Conversion Filter, User with pagination.
   * @param pagination Conversion.
   * @param filter Conversion.
   * @param user Conversion.
   * @return Conversions found.
   */
  getByFilterAndUserAndPagination(
    filter: TGetConversionFilter,
    user: User,
    pagination: Pagination,
  ): Promise<TPaginationResponse<Conversion>>;
}
