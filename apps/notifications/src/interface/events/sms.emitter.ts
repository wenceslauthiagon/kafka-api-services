import { SmsEventEmitter } from '@zro/notifications/application';
import { Sms } from '@zro/notifications/domain';

export type SmsEvent = Required<Pick<Sms, 'id' | 'phoneNumber' | 'state'>> &
  Pick<Sms, 'body' | 'issuedBy'>;

/**
 * Create a SMS created event DTO.
 *
 * @returns SMS created event.
 * @param sms
 */
export function smsCreatedPresenter(sms: Sms): SmsEvent {
  if (!sms) return null;

  return {
    id: sms.id,
    phoneNumber: sms.phoneNumber,
    state: sms.state,
    body: sms.body,
    issuedBy: sms.issuedBy,
  };
}

/**
 * Create a SMS sent event DTO.
 *
 * @returns SMS sent event.
 * @param sms
 */
export function smsSentPresenter(sms: Sms): SmsEvent {
  if (!sms) return null;

  const { id, phoneNumber, state, body, issuedBy } = sms;

  return { id, phoneNumber, state, body, issuedBy };
}

/**
 * Create a SMS failed event DTO.
 *
 * @returns SMS failed event.
 * @param sms
 */
export function smsFailedPresenter(sms: Sms): SmsEvent {
  if (!sms) return null;

  const { id, phoneNumber, state, body, issuedBy } = sms;

  return { id, phoneNumber, state, body, issuedBy };
}

export interface SmsEventEmitterController {
  /**
   * Emit SMS created event.
   * @param event
   */
  emitSmsCreatedEvent(event: SmsEvent): Promise<void> | void;

  /**
   * Emit SMS sent event.
   * @param event
   */
  emitSmsSentEvent(event: SmsEvent): void | Promise<void>;

  /**
   * Emit SMS failed event.
   * @param event
   */
  emitSmsFailedEvent(event: SmsEvent): void | Promise<void>;
}

export class SmsEventEmitterControllerImpl implements SmsEventEmitter {
  /**
   * Default constructor.
   * @param smsEventEmitter SMS emitter.
   */
  constructor(private smsEventEmitter: SmsEventEmitterController) {}

  /**
   * Emit SMS created event.
   * @param sms
   */
  async emitCreatedEvent(sms: Sms): Promise<void> {
    // Build created event.
    const event = smsCreatedPresenter(sms);

    // Emit event
    await this.smsEventEmitter.emitSmsCreatedEvent(event);
  }

  /**
   * Emit SMS sent event.
   * @param sms Sent SMS.
   */
  async emitSentEvent(sms: Sms): Promise<void> {
    // Build sent event.
    const event = smsSentPresenter(sms);

    // Emit event
    await this.smsEventEmitter.emitSmsSentEvent(event);
  }

  /**
   * Emit SMS sent event.
   * @param sms Sent SMS.
   */
  async emitFailedEvent(sms: Sms): Promise<void> {
    // Build failed event.
    const event = smsFailedPresenter(sms);

    // Emit event
    await this.smsEventEmitter.emitSmsFailedEvent(event);
  }
}
