import { PixFraudDetection } from '@zro/pix-payments/domain';

export type PixFraudDetectionEvent = Partial<
  Pick<
    PixFraudDetection,
    | 'id'
    | 'externalId'
    | 'issueId'
    | 'document'
    | 'fraudType'
    | 'key'
    | 'status'
    | 'state'
  >
> & {
  failedMessage?: string;
  failedCode?: string;
};

export interface PixFraudDetectionEventEmitter {
  /**
   * Emit receive event.
   * @param event Data.
   */
  receivedPixFraudDetection(event: PixFraudDetectionEvent): void;

  /**
   * Emit receive pending event.
   * @param event Data.
   */
  receivedPendingPixFraudDetection(event: PixFraudDetectionEvent): void;

  /**
   * Emit receive confirmed event.
   * @param event Data.
   */
  receivedConfirmedPixFraudDetection(event: PixFraudDetectionEvent): void;

  /**
   * Emit register pending event.
   * @param event Data.
   */
  registerPendingPixFraudDetection(event: PixFraudDetectionEvent): void;

  /**
   * Emit register confirmed event.
   * @param event Data.
   */
  registerConfirmedPixFraudDetection(event: PixFraudDetectionEvent): void;

  /**
   * Emit cancel pending registered event.
   * @param event Data.
   */
  cancelPendingPixFraudDetectionRegistered(event: PixFraudDetectionEvent): void;

  /**
   * Emit cancel confirmed registered event.
   * @param event Data.
   */
  cancelConfirmedPixFraudDetectionRegistered(
    event: PixFraudDetectionEvent,
  ): void;

  /**
   * Emit cancel received event.
   * @param event Data.
   */
  cancelPixFraudDetectionReceived(event: PixFraudDetectionEvent): void;

  /**
   * Emit cancel pending received event.
   * @param event Data.
   */
  cancelPendingPixFraudDetectionReceived(event: PixFraudDetectionEvent): void;

  /**
   * Emit cancel confirmed received event.
   * @param event Data.
   */
  cancelConfirmedPixFraudDetectionReceived(event: PixFraudDetectionEvent): void;

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedPixFraudDetection(event: PixFraudDetectionEvent): void;
}
