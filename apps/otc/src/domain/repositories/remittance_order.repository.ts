import { Pagination, TPaginationResponse } from '@zro/common';
import {
  RemittanceOrder,
  RemittanceOrderStatus,
  TGetRemittanceOrdersFilter,
} from '@zro/otc/domain';

export enum RemittanceOrderRequestSort {
  CREATED_AT = 'created_at',
}

export interface RemittanceOrderRepository {
  /**
   * Insert a Remittance Order.
   * @param remittanceOrder RemittanceOrder to save.
   * @returns Created remittanceOrder.
   */
  create: (remittanceOrder: RemittanceOrder) => Promise<RemittanceOrder>;

  /**
   * Update a Remittance Order.
   * @param remittanceOrder RemittanceOrder to update.
   * @returns Updated Remittance Order.
   */
  update: (remittanceOrder: RemittanceOrder) => Promise<RemittanceOrder>;

  /**
   * Search by Remittance ID.
   * @param id Remittance Order ID.
   * @return Remittance Order found.
   */
  getById: (id: string) => Promise<RemittanceOrder>;

  /**
   * List all Remittance Orders by status.
   * @param pagination Pagination.
   * @param status Remittance Order status.
   * @return Remittance Orders found.
   */
  getAllByStatus: (
    pagination: Pagination,
    status: RemittanceOrderStatus,
  ) => Promise<TPaginationResponse<RemittanceOrder>>;

  /**
   * Search by Filter.
   * @param pagination pagination.
   * @param filter filter.
   * @return remittanceOrders found.
   */
  getAllByFilter: (
    pagination: Pagination,
    filter: TGetRemittanceOrdersFilter,
  ) => Promise<TPaginationResponse<RemittanceOrder>>;
}
