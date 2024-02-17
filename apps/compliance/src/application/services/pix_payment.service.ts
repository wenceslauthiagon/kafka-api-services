import { PixDeposit } from '@zro/pix-payments/domain';

export interface PixPaymentService {
  /**
   * Approve Pix Deposit.
   * @param payload the pix deposit.
   * @returns approved pix deposit.
   */
  approvePixDeposit(payload: PixDeposit): Promise<void>;

  /**
   * Block Pix Deposit.
   * @param payload the pix deposit.
   * @returns blocked pix deposit.
   */
  blockPixDeposit(payload: PixDeposit): Promise<void>;
}
