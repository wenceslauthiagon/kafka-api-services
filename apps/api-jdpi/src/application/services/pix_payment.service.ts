import {
  Payment,
  PixDeposit,
  PixDevolutionReceived,
} from '@zro/pix-payments/domain';

export type ReceivePixDepositResponse = Pick<
  PixDeposit,
  'id' | 'state' | 'createdAt'
>;

export type ReceivePixDevolutionReceivedResponse = Pick<
  PixDevolutionReceived,
  'id' | 'state' | 'createdAt'
>;

export type GetPaymentByEndToEndIdResponse = Pick<
  Payment,
  'id' | 'endToEndId' | 'txId' | 'value' | 'state' | 'createdAt'
>;

export interface PixPaymentService {
  /**
   * Create a received PixDeposit.
   * @param request The PixDeposit.
   * @returns PixDeposit.
   */
  receivePixDeposit(request: PixDeposit): Promise<ReceivePixDepositResponse>;

  /**
   * Create a received PixDevolutionReceived.
   * @param request The PixDevolutionReceived.
   * @returns PixDevolutionReceived.
   */
  receivePixDevolution(
    request: PixDevolutionReceived,
  ): Promise<ReceivePixDevolutionReceivedResponse>;

  /**
   * Get Pix Payment by endToEndId.
   * @param endToEndId The Payment endToEndId.
   * @returns Payment.
   */
  getPaymentByEndToEndId(
    endToEndId: Payment['endToEndId'],
  ): Promise<GetPaymentByEndToEndIdResponse>;
}
