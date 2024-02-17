import { Sms } from '@zro/notifications/domain';

/**
 * Emitter e-mail events.
 */
export interface SmsEventEmitter {
  /**
   * Emit created e-mail event.
   * @param sms The created e-mail.
   */
  emitCreatedEvent(sms: Sms): Promise<void> | void;

  /**
   * Emit sent e-mail event.
   * @param sms The sent e-mail.
   */
  emitSentEvent(sms: Sms): Promise<void> | void;

  /**
   * Emit failed e-mail event.
   * @param sms The failed e-mail.
   */
  emitFailedEvent(sms: Sms): Promise<void> | void;
}
