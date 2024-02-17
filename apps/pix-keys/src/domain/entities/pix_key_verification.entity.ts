import { Domain } from '@zro/common';
import { PixKey } from './pix_key.entity';

export enum PixKeyVerificationState {
  OK = 'OK',
  FAILED = 'FAILED',
}

/**
 * Register all verification pik key tries done by the user.
 */
export interface PixKeyVerification extends Domain<string> {
  /**
   * Related Pix Key.
   */
  pixKey: PixKey;

  /**
   * Verification code sent by user.
   */
  code: string;

  /**
   * Verification code resolution.
   */
  state: PixKeyVerificationState;
}

export class PixKeyVerificationEntity implements PixKeyVerification {
  id?: string;
  pixKey: PixKey;
  code: string;
  state: PixKeyVerificationState;

  constructor(props: Partial<PixKeyVerification>) {
    Object.assign(this, props);
  }
}
