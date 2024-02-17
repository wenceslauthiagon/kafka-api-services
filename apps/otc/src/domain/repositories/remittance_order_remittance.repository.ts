import { Pagination, TPaginationResponse } from '@zro/common';
import {
  RemittanceOrderRemittance,
  Remittance,
  RemittanceOrderSide,
  RemittanceOrderStatus,
  RemittanceOrderType,
  RemittanceStatus,
  RemittanceOrder,
} from '@zro/otc/domain';

export type TGetRemittanceOrdersFilter = {
  side?: RemittanceOrderSide;
  currencyId?: number;
  amountStart?: number;
  amountEnd?: number;
  status?: RemittanceOrderStatus;
  systemId?: string;
  providerId?: string;
  type?: RemittanceOrderType;
  createdAtStart?: Date;
  createdAtEnd?: Date;
  updatedAtStart?: Date;
  updatedAtEnd?: Date;
  remittanceId?: string;
  remittanceStatus?: RemittanceStatus;
};

export interface RemittanceOrderRemittanceRepository {
  /**
   * Insert a Remittance Order Remittance.
   * @param remittanceOrderRemittance RemittanceOrderRemittance to save.
   * @returns Created remittanceOrderRemittance.
   */
  create: (
    remittanceOrderRemittance: RemittanceOrderRemittance,
  ) => Promise<RemittanceOrderRemittance>;

  /**
   * Update a Remittance Order Remittance.
   * @param remittanceOrderRemittance RemittanceOrderRemittance to update.
   * @returns Updated remittanceOrderRemittance.
   */
  update: (
    remittanceOrderRemittance: RemittanceOrderRemittance,
  ) => Promise<RemittanceOrderRemittance>;

  /**
   * Search by Remittance Order Remittance ID.
   * @param id Remittance Order ID.
   * @return remittanceOrderRemittance found.
   */
  getById: (id: string) => Promise<RemittanceOrderRemittance>;

  /**
   * Search by Remittance.
   * @param remittance Remittance.
   * @return remittanceOrderRemittances found.
   */
  getAllByRemittance: (
    remittance: Remittance,
  ) => Promise<RemittanceOrderRemittance[]>;

  /**
   * Search by Filter.
   * @param pagination pagination.
   * @param filter filter.
   * @return remittanceOrderRemittances found.
   */
  getAllByFilter: (
    pagination: Pagination,
    filter: TGetRemittanceOrdersFilter,
  ) => Promise<TPaginationResponse<RemittanceOrderRemittance>>;

  /**
   * Get a Remittance Order Remittance by Remittance Order.
   *
   * @param remittanceOrder RemittanceOrder.
   * @returns Remittance Order Remittances found.
   */
  getAllByRemittanceOrder: (
    remittanceOrder: RemittanceOrder,
  ) => Promise<RemittanceOrderRemittance[]>;
}
