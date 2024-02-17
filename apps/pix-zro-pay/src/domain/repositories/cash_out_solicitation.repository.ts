import { Pagination, TPaginationResponse } from '@zro/common';
import {
  CashOutSolicitation as CashOutSolicitation,
  Company,
} from '@zro/pix-zro-pay/domain';

export interface CashOutSolicitationRepository {
  /**
   * Insert a CashOutSolicitation.
   * @param cashOutSolicitation CashOutSolicitation to save.
   * @returns Created CashOutSolicitation.
   */
  create(
    cashOutSolicitation: CashOutSolicitation,
  ): Promise<CashOutSolicitation>;

  /**
   * Update a CashOutSolicitation.
   * @param cashOutSolicitation CashOutSolicitation to update.
   * @returns Updated CashOutSolicitation.
   */
  update(
    cashOutSolicitation: CashOutSolicitation,
  ): Promise<CashOutSolicitation>;

  /**
   * get a CashOutSolicitation by id.
   * @param id CashOutSolicitation id to get.
   * @returns get CashOutSolicitation.
   */
  getById(id: number): Promise<CashOutSolicitation>;

  /**
   * get a CashOutSolicitation by company.
   * @param company CashOutSolicitation company to get.
   * @returns get CashOutSolicitation.
   */
  getByCompany(company: Company): Promise<CashOutSolicitation>;

  /**
   * get all CashOutSolicitation
   * @returns get all CashOutSolicitation.
   */
  getAll: (
    pagination: Pagination,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
  ) => Promise<TPaginationResponse<CashOutSolicitation>>;
}
