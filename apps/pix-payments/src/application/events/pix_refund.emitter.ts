import { Bank } from '@zro/banking/domain';
import { PixInfraction, PixRefund } from '@zro/pix-payments/domain';

type InfractionId = PixInfraction['infractionPspId'];
type BankIspb = Bank['ispb'];

export type PixRefundEvent = Partial<
  Pick<
    PixRefund,
    | 'id'
    | 'state'
    | 'contested'
    | 'amount'
    | 'description'
    | 'reason'
    | 'status'
    | 'solicitationPspId'
  >
> & {
  endToEndIdTransaction?: string;
  infractionId?: InfractionId;
  requesterIspb?: BankIspb;
  responderIspb?: BankIspb;
};

export interface PixRefundEventEmitter {
  /**
   * Emit receive pending event.
   * @param event Data.
   */
  receivePendingPixRefund(event: PixRefundEvent): void;

  /**
   * Emit receive confirmed event.
   * @param event Data.
   */
  receiveConfirmedPixRefund(event: PixRefundEvent): void;

  /**
   * Emit pending close event.
   * @param event Data.
   */
  closePendingPixRefund(event: PixRefundEvent): void;

  /**
   * Emit waiting close event.
   * @param event Data.
   */
  closeWaitingPixRefund(event: PixRefundEvent): void;

  /**
   * Emit confirmed close event.
   * @param event Data.
   */
  closeConfirmedPixRefund(event: PixRefundEvent): void;

  /**
   * Emit pending cancel event.
   * @param event Data.
   */
  cancelPendingPixRefund(event: PixRefundEvent): void;

  /**
   * Emit confirmed cancel event.
   * @param event Data.
   */
  cancelConfirmedPixRefund(event: PixRefundEvent): void;

  /**
   * Emit error event.
   * @param event Data.
   */
  errorPixRefund(event: PixRefundEvent): void;

  /**
   * Emit receive event.
   * @param event Data.
   */
  receivePixRefund(event: PixRefundEvent): void;
}
