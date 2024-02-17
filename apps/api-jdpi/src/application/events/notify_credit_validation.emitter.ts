import {
  NotifyCreditValidation,
  NotifyCreditValidationAmountDetails,
} from '@zro/api-jdpi/domain';

export type NotifyCreditValidationAmountDetailsEvent =
  NotifyCreditValidationAmountDetails;

export type NotifyCreditValidationEvent = NotifyCreditValidation;

export interface NotifyCreditValidationEventEmitter {
  /**
   * Emit ready credit validation event.
   * @param event Data.
   */
  emitReadyCreditValidation(event: NotifyCreditValidationEvent): void;

  /**
   * Emit pending credit validation event.
   * @param event Data.
   */
  emitPendingCreditValidation(event: NotifyCreditValidationEvent): void;

  /**
   * Emit error credit validation event.
   * @param event Data.
   */
  emitErrorCreditValidation(event: NotifyCreditValidationEvent): void;
}
