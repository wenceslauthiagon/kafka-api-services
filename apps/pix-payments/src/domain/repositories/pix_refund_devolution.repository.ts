import {
  PixRefundDevolution,
  PixRefundDevolutionState,
  ThresholdDateComparisonType,
} from '@zro/pix-payments/domain';

export interface PixRefundDevolutionRepository {
  /**
   * Insert a PixRefundDevolution.
   * @param refundDevolution refundDevolution to save.
   * @returns Created refundDevolution.
   */
  create: (
    refundDevolution: PixRefundDevolution,
  ) => Promise<PixRefundDevolution>;

  /**
   * Update refundDevolution.
   * @param refundDevolution refundDevolution to update.
   * @returns Updated refundDevolution.
   */
  update: (
    refundDevolution: PixRefundDevolution,
  ) => Promise<PixRefundDevolution>;

  /**
   * get a refundDevolution by id.
   * @param id refundDevolution id to get.
   * @returns Get refundDevolution.
   */
  getById: (id: string) => Promise<PixRefundDevolution>;

  /**
   * get all refundDevolution by state.
   * @param state refundDevolution state to update.
   * @returns Get refundDevolution
   */
  getAllByState: (
    state: PixRefundDevolutionState,
  ) => Promise<PixRefundDevolution[]>;

  /**
   * get a Refund Devolution quantity by transactionId.
   * @param transactionId Transaction id to get.
   * @returns Get refund devolution quantity.
   */
  countByTransaction: (transactionId: string) => Promise<number>;

  /**
   * Get all pix refund devolution by state, threshold date and date comparison type.
   * @param state State payment to update.
   * @param date Threshold date to be compared.
   * @param comparisonType Date comparison type.
   * @returns Pix refund devolution found.
   */
  getAllByStateAndThresholdDate(
    state: PixRefundDevolutionState,
    date: Date,
    comparisonType: ThresholdDateComparisonType,
  ): Promise<PixRefundDevolution[]>;
}
