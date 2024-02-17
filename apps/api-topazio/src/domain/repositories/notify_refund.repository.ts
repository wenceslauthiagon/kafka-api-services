import { NotifyRefund } from '@zro/api-topazio/domain';
import { PixRefundStatus } from '@zro/pix-payments/domain';

export interface NotifyRefundRepository {
  /**
   * Insert a Notify refund.
   * @param {NotifyRefund} notify Notify to save.
   * @returns {NotifyRefund} Created notify refund.
   */
  create: (notifyRefund: NotifyRefund) => Promise<NotifyRefund>;

  /**
   * Get a Notify.
   * @param {solicitationId} solicitationId string.
   * @param {status} status PixRefundStatus.
   * @returns {NotifyRefund} Get notify Refund.
   */
  getBySolicitationIdAndStatus: (
    solicitationId: string,
    status: PixRefundStatus,
  ) => Promise<NotifyRefund>;
}
