import {
  Payment,
  PixDeposit,
  PixDevolution,
  PixDevolutionReceived,
} from '@zro/pix-payments/domain';

export interface PixPaymentService {
  /**
   * Get payment by id.
   * @param id.
   * @returns Payment.
   */
  getById(id: string): Promise<Payment>;

  /**
   * Get pix devolution received by id.
   * @param id.
   * @returns PixDevolutionReceived.
   */
  getDevolutionReceivedById(id: string): Promise<PixDevolutionReceived>;

  /**
   * Get pix deposit by id.
   * @param id.
   * @returns PixDeposit.
   */
  getPixDepositById(id: string): Promise<PixDeposit>;

  /**
   * Get pix devolution by id.
   * @param id.
   * @returns PixDevolution.
   */
  getDevolutionById(id: string): Promise<PixDevolution>;
}
