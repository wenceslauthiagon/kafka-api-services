import {
  PixInfraction,
  PixRefund,
  PixRefundDevolution,
} from '@zro/pix-payments/domain';

export interface PixRefundRepository {
  /**
   * get refund by id.
   * @param refund RefundRequest to save.
   * @returns Created refundRequest.
   */
  getById: (id: string) => Promise<PixRefund>;

  /**
   * get refund by issue Id.
   * @param refundRequest RefundRequest to save.
   * @returns Created refundRequest.
   */
  getByIssueId: (id: number) => Promise<PixRefund>;

  /**
   * Insert a PixRefund.
   * @param refund RefundRequest to save.
   * @returns Created refundRequest.
   */
  create: (refund: PixRefund) => Promise<PixRefund>;

  /**
   * Update a PixRefund.
   * @param refund RefundRequest to update.
   * @returns Updated refundRequest.
   */
  update: (refund: PixRefund) => Promise<PixRefund>;

  /**
   * Get refund by infraction.
   * @param infraction PixInfraction to get.
   * @returns PixRefund found or null otherwise.
   */
  getByInfraction: (infraction: PixInfraction) => Promise<PixRefund>;

  /**
   * Get refund by refundDevolution.
   * @param PixRefundDevolution pixRefundDevolution to get.
   * @returns PixRefund found or null otherwise.
   */
  getByRefundDevolution: (
    refundDevolution: PixRefundDevolution,
  ) => Promise<PixRefund>;

  /**
   * Get refund by solicitation Id.
   * @param solicitationPspId solicitation to get.
   * @returns PixRefund found or null otherwise.
   */
  getBySolicitationId: (solicitationPspId: string) => Promise<PixRefund>;
}
