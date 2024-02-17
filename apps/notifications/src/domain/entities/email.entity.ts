import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';
import { EmailTemplate } from './email_template.entity';

/**
 * E-mail states
 */
export enum EmailState {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

/**
 * E-mail message.
 */
export interface Email extends Domain<string> {
  /**
   * Destination address.
   */
  to: string;

  /**
   * From address.
   */
  from: string;

  /**
   * State.
   */
  state: EmailState;

  /**
   * Template.
   */
  template?: EmailTemplate;

  /**
   * Message title.
   */
  title?: string;

  /**
   * Message raw body. Could have markups.
   */
  body?: string;

  /**
   * Message HTML body. Could have markups.
   */
  html?: string;

  /**
   * User destination.
   */
  user?: User;

  /**
   * Related object UUID.
   */
  issuedBy?: string;

  /**
   * Check if e-mail was already sent.
   */
  isSent(): boolean;

  /**
   * Check if e-mail failed.
   */
  isFailed(): boolean;
}

export class EmailEntity implements Email {
  id?: string;
  to: string;
  from: string;
  state: EmailState = EmailState.PENDING;
  template?: EmailTemplate;
  title?: string;
  body?: string;
  html?: string;
  user?: User;
  issuedBy?: string;

  constructor(props: Partial<Email>) {
    Object.assign(this, props);
  }

  isSent(): boolean {
    return this.state === EmailState.SENT;
  }

  isFailed(): boolean {
    return this.state === EmailState.FAILED;
  }
}
