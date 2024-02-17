import {
  UserLimitRequest,
  UserWithdrawSettingRequest,
  WarningTransaction,
} from '@zro/compliance/domain';

export type UserLimitRequestResponse = Pick<UserLimitRequest, 'id' | 'state'>;

export interface ComplianceService {
  /**
   * close a User Limit Request.
   * @param payload The UserLimitRequest.
   * @returns UserLimitRequest.
   */
  closeUserLimitRequest(payload: UserLimitRequest): Promise<void>;

  /**
   * close a Warning Transaction.
   * @param payload The Warning Transaction.
   * @returns closed Warning Transaction.
   */
  closeWarningTransaction(payload: WarningTransaction): Promise<void>;

  /**
   * close a Warning Transaction.
   * @param payload The Warning Transaction.
   * @returns closed Warning Transaction.
   */
  closeUserWithdrawSettingRequest(
    payload: UserWithdrawSettingRequest,
  ): Promise<void>;
}
