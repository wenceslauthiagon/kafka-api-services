import { EmailEventEmitter } from '@zro/notifications/application';
import { Email } from '@zro/notifications/domain';

export type EmailAttr = Pick<
  Email,
  'id' | 'to' | 'from' | 'state' | 'title' | 'body' | 'html'
>;

/**
 * Create a e-mail created event DTO.
 *
 * @returns E-mail created event.
 * @param email
 */
export function emailCreatedPresenter(email: Email): EmailAttr {
  if (!email) return null;

  return {
    id: email.id,
    to: email.to,
    from: email.from,
    state: email.state,
    title: email.title,
    body: email.body,
    html: email.html,
  };
}

/**
 * Create a e-mail sent event DTO.
 *
 * @returns E-mail sent event.
 * @param email
 */
export function emailSentPresenter(email: Email): EmailAttr {
  if (!email) return null;

  const { id, to, from, state, title, body, html } = email;

  return { id, to, from, state, title, body, html };
}

/**
 * Create a e-mail failed event DTO.
 *
 * @returns E-mail failed event.
 * @param email
 */
export function emailFailedPresenter(email: Email): EmailAttr {
  if (!email) return null;

  const { id, to, from, state, title, body, html } = email;

  return { id, to, from, state, title, body, html };
}

export interface EmailEventEmitterController {
  /**
   * Emit e-mail created event.
   * @param event
   */
  emitEmailCreatedEvent(event: EmailAttr): Promise<void> | void;

  /**
   * Emit e-mail sent event.
   * @param event
   */
  emitEmailSentEvent(event: EmailAttr): void | Promise<void>;

  /**
   * Emit e-mail failed event.
   * @param event
   */
  emitEmailFailedEvent(event: EmailAttr): void | Promise<void>;
}

export class EmailEventEmitterControllerImpl implements EmailEventEmitter {
  /**
   * Default constructor.
   * @param emailEventEmitter E-mail emitter.
   */
  constructor(private emailEventEmitter: EmailEventEmitterController) {}

  /**
   * Emit e-mail created event.
   * @param email
   */
  async emitCreatedEvent(email: Email): Promise<void> {
    // Build created event.
    const event = emailCreatedPresenter(email);

    // Emit event
    await this.emailEventEmitter.emitEmailCreatedEvent(event);
  }

  /**
   * Emit e-mail sent event.
   * @param email Sent e-mail.
   */
  async emitSentEvent(email: Email): Promise<void> {
    // Build sent event.
    const event = emailSentPresenter(email);

    // Emit event
    await this.emailEventEmitter.emitEmailSentEvent(event);
  }

  /**
   * Emit e-mail sent event.
   * @param email Sent e-mail.
   */
  async emitFailedEvent(email: Email): Promise<void> {
    // Build failed event.
    const event = emailFailedPresenter(email);

    // Emit event
    await this.emailEventEmitter.emitEmailFailedEvent(event);
  }
}
