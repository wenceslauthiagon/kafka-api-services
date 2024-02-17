import { PixDeposit, WarningPixDeposit } from '@zro/pix-payments/domain';

export type WarningPixDepositEvent = Pick<
  WarningPixDeposit,
  'id' | 'user' | 'state'
> & { deposit?: PixDeposit };

export interface WarningPixDepositEventEmitter {
  /**
   * Emit warning PixDeposit created creation.
   * @param event Data.
   */
  createdWarningPixDeposit(event: WarningPixDepositEvent): void;

  /**
   * Emit warning PixDeposit approved.
   * @param event Data.
   */
  approvedWarningPixDeposit(event: WarningPixDeposit): void;

  /**
   * Call compliance microservice to emit warning PixDeposit rejected.
   * @param event Data.
   */
  rejectedWarningPixDeposit(event: WarningPixDeposit): void;
}
