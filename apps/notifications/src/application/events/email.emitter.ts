import { Email } from '@zro/notifications/domain';

/**
 * Emitter e-mail events.
 */
export interface EmailEventEmitter {
  /**
   * Emit created e-mail event.
   * @param email The created e-mail.
   */
  emitCreatedEvent(email: Email): Promise<void> | void;

  /**
   * Emit sent e-mail event.
   * @param email The sent e-mail.
   */
  emitSentEvent(email: Email): Promise<void> | void;

  /**
   * Emit failed e-mail event.
   * @param email The failed e-mail.
   */
  emitFailedEvent(email: Email): Promise<void> | void;
}
