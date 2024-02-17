import {
  PixFraudDetection,
  PixInfraction,
  PixRefund,
} from '@zro/pix-payments/domain';

export type PixInfractionResponse = Pick<PixInfraction, 'id' | 'state'>;
export type PixRefundResponse = Pick<PixRefund, 'id' | 'state'>;
export type PixFraudDetectionResponse = Pick<PixFraudDetection, 'id' | 'state'>;

export interface PixPaymentService {
  /**
   * open a PixInfraction.
   * @param payload The PixInfraction.
   * @returns PixInfraction.
   */
  inAnalysisPixInfraction(
    payload: PixInfraction,
  ): Promise<PixInfractionResponse>;

  /**
   * close a PixInfraction.
   * @param payload The PixInfraction.
   * @returns PixInfraction.
   */
  closePixInfraction(payload: PixInfraction): Promise<PixInfractionResponse>;

  /**
   * cancel a PixInfraction.
   * @param id issue Id.
   * @returns PixInfraction.
   */
  cancelPixInfraction(id: number): Promise<PixInfractionResponse>;

  /**
   * create a PixInfraction.
   * @param payload The PixInfraction.
   * @returns PixInfraction.
   */
  createPixInfraction(payload: PixInfraction): Promise<PixInfractionResponse>;

  /**
   * open a PixInfraction.
   * @param payload The PixInfraction.
   * @returns PixInfraction.
   */
  openPixInfraction(payload: PixInfraction): Promise<PixInfractionResponse>;

  /**
   * close a PixRefund.
   * @param payload The PixRefund.
   * @returns PixRefund.
   */
  closePixRefund(payload: PixRefund): Promise<PixRefundResponse>;

  /**
   * cancel a PixRefund.
   * @param payload The PixRefund.
   * @returns PixRefund.
   */
  cancelPixRefund(payload: PixRefund): Promise<PixRefundResponse>;

  /**
   * register a PixFraudDetection.
   * @param payload The PixFraudDetection.
   * @returns PixFraudDetection.
   */
  registerPixFraudDetection(
    payload: PixFraudDetection,
  ): Promise<PixFraudDetectionResponse>;

  /**
   * cancel registered PixFraudDetection.
   * @param payload The PixFraudDetection.
   * @returns PixFraudDetection.
   */
  cancelRegisteredPixFraudDetection(
    payload: PixFraudDetection,
  ): Promise<PixFraudDetectionResponse>;
}
