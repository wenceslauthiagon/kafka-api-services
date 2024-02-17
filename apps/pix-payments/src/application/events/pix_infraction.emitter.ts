import { PixInfraction } from '@zro/pix-payments/domain';

export type PixInfractionEvent = Partial<
  Pick<
    PixInfraction,
    | 'id'
    | 'state'
    | 'infractionPspId'
    | 'infractionType'
    | 'status'
    | 'ispbDebitedParticipant'
    | 'ispbCreditedParticipant'
    | 'reportBy'
    | 'ispb'
    | 'endToEndId'
    | 'creationDate'
    | 'lastChangeDate'
    | 'analysisDetails'
    | 'isReporter'
    | 'analysisResult'
  >
> & { operationTransactionId?: string; reportDetails?: string };

export interface PixInfractionEventEmitter {
  /**
   * Emit open event.
   * @param event Data.
   */
  newInfraction(event: PixInfractionEvent): void;

  /**
   * Emit receive pending event.
   * @param event Data.
   */
  receivePendingInfraction(event: PixInfractionEvent): void;

  /**
   * Emit receive confirmed event.
   * @param event Data.
   */
  receiveConfirmedInfraction(event: PixInfractionEvent): void;

  /**
   * Emit open pending event.
   * @param event Data.
   */
  openPendingInfraction(event: PixInfractionEvent): void;

  /**
   * Emit open confirmed event.
   * @param event Data.
   */
  openConfirmedInfraction(event: PixInfractionEvent): void;

  /**
   * Emit in analysis confirmed event.
   * @param event Data.
   */
  inAnalysisConfirmedInfraction(event: PixInfractionEvent): void;

  /**
   * Emit acknowledged pending event.
   * @param event Data.
   */
  acknowledgedPendingInfraction(event: PixInfractionEvent): void;

  /**
   * Emit acknowledged confirmed event.
   * @param event Data.
   */
  acknowledgedConfirmedInfraction(event: PixInfractionEvent): void;

  /**
   * Emit closed pending event.
   * @param event Data.
   */
  closedPendingInfractionReceived(event: PixInfractionEvent): void;

  /**
   * Emit closed confirmed event.
   * @param event Data.
   */
  closedConfirmedInfractionReceived(event: PixInfractionEvent): void;

  /**
   * Emit closed pending event.
   * @param event Data.
   */
  closedPendingInfraction(event: PixInfractionEvent): void;

  /**
   * Emit closed confirmed event.
   * @param event Data.
   */
  closedConfirmedInfraction(event: PixInfractionEvent): void;

  /**
   * Emit pending cancel event.
   * @param event Data.
   */
  cancelPendingInfraction(event: PixInfractionEvent): void;

  /**
   * Emit confirmed  cancel event.
   * @param event Data.
   */
  cancelConfirmedInfraction(event: PixInfractionEvent): void;

  /**
   * Emit expired event.
   * @param event Data.
   */
  expiredInfraction(event: PixInfractionEvent): void;

  /**
   * Emit receive request refund event.
   * @param event Data.
   */
  receiveRequestRefundInfraction(event: PixInfractionEvent): void;

  /**
   * Emit error event.
   * @param event Data.
   */
  errorInfraction(event: PixInfractionEvent): void;

  /**
   * Emit cancel pending received event.
   * @param event Data.
   */
  cancelPendingInfractionReceived(event: PixInfractionEvent): void;

  /**
   * Emit cancel confirmed received event.
   * @param event Data.
   */
  cancelConfirmedInfractionReceived(event: PixInfractionEvent): void;

  /**
   * Emit receive received event.
   * @param event Data.
   */
  receivePixInfraction(event: PixInfractionEvent): void;

  /**
   * Emit acknowledge event.
   * @param event Data.
   */
  acknowledgePixInfraction(event: PixInfractionEvent): void;

  /**
   * Emit cancel received event.
   * @param event Data.
   */
  cancelPixInfractionReceived(event: PixInfractionEvent): void;

  /**
   * Emit close received event.
   * @param event Data.
   */
  closePixInfractionReceived(event: PixInfractionEvent): void;
}
