import { Domain } from '@zro/common';
import { User } from '@zro/users/domain';
import { SmsTemplate } from './sms_template.entity';

/**
 * SMS states
 */
export enum SmsState {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

/**
 * E-mail message.
 */
export interface Sms extends Domain<string> {
  /**
   * Destination phone number.
   */
  phoneNumber: string;

  /**
   * State.
   */
  state: SmsState;

  /**
   * Template.
   */
  template?: SmsTemplate;

  /**
   * Message raw body. Could have markups.
   */
  body?: string;

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

export class SmsEntity implements Sms {
  id?: string;
  phoneNumber: string;
  state: SmsState = SmsState.PENDING;
  template?: SmsTemplate;
  body?: string;
  user?: User;
  issuedBy?: string;

  constructor(props: Partial<Sms>) {
    Object.assign(this, props);
  }

  isSent(): boolean {
    return this.state === SmsState.SENT;
  }

  isFailed(): boolean {
    return this.state === SmsState.FAILED;
  }
}
