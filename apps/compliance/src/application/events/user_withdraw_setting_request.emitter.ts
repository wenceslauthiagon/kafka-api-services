import { UserWithdrawSettingRequest } from '@zro/compliance/domain';

export type UserWithdrawSettingRequestEvent = Pick<
  UserWithdrawSettingRequest,
  'id' | 'state' | 'user'
>;

export interface UserWithdrawSettingRequestEventEmitter {
  /**
   * Emit open pending user withdraw setting request event.
   * @param event event to fire.
   */
  pending: (event: UserWithdrawSettingRequestEvent) => void;

  /**
   * Emit failed user withdraw setting request event.
   * @param event event to fire.
   */
  failed: (event: UserWithdrawSettingRequestEvent) => void;

  /**
   * Emit open user withdraw settings request event.
   * @param event event to fire.
   */
  open: (event: UserWithdrawSettingRequestEvent) => void;

  /**
   * Emit approved user withdraw setting request event.
   * @param event event to fire.
   */
  approved: (event: UserWithdrawSettingRequestEvent) => void;

  /**
   * Emit rejected user withdraw setting request event.
   * @param event event to fire.
   */
  rejected: (event: UserWithdrawSettingRequestEvent) => void;
}
