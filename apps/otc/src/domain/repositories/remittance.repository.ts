import { Pagination, TPaginationResponse } from '@zro/common';
import { Remittance, RemittanceStatus, RemittanceSide } from '@zro/otc/domain';

export enum RemittanceRequestSort {
  CREATED_AT = 'created_at',
}

export type GetAllRemittanceFilter = {
  orderId?: string;
  contractId?: string;
  providerId?: string;
  status?: RemittanceStatus;
  amountStart?: number;
  amountEnd?: number;
  side?: RemittanceSide;
  systemId?: string;
  resultAmountStart?: number;
  resultAmountEnd?: number;
  bankQuoteStart?: number;
  bankQuoteEnd?: number;
  isConcomitant?: boolean;
  createdAtStart?: Date;
  createdAtEnd?: Date;
  updatedAtStart?: Date;
  updatedAtEnd?: Date;
};

export interface RemittanceRepository {
  /**
   * Insert a Remittance.
   * @param remittance Remittance to save.
   * @returns Created remittance.
   */
  create: (remittance: Remittance) => Promise<Remittance>;

  /**
   * Update a Remittance.
   * @param remittance Remittance to update.
   * @returns Updated Remittance.
   */
  update: (remittance: Remittance) => Promise<Remittance>;

  /**
   * Search by Remittance ID.
   * @param id Remittance ID.
   * @return Remittance found.
   */
  getById: (id: string) => Promise<Remittance>;

  /**
   * List all Remittances by status.
   * @param pagination Pagination.
   * @param status Remittance Status.
   * @return Remittances found.
   */
  getAllByStatus: (
    pagination: Pagination,
    status: RemittanceStatus,
  ) => Promise<TPaginationResponse<Remittance>>;

  /**
   * List all Remmitances by filter.
   * @param pagination Pagination.
   * @param filter Filter.
   * @return TPaginationResponse<Remittance>.
   */
  getAllByFilter: (
    pagination: Pagination,
    filter: GetAllRemittanceFilter,
  ) => Promise<TPaginationResponse<Remittance>>;
}
