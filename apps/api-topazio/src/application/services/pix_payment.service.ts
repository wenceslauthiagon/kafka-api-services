import {
  Payment,
  PixDeposit,
  PixDevolution,
  PixDevolutionReceived,
} from '@zro/pix-payments/domain';

export type GetPaymentByIdResponse = Pick<
  Payment,
  'id' | 'user' | 'wallet' | 'state' | 'createdAt'
>;
export type GetPixDevolutionByIdResponse = Pick<
  PixDevolution,
  'id' | 'user' | 'wallet' | 'state' | 'createdAt'
>;
export type ReceivePixDepositResponse = Pick<
  PixDeposit,
  'id' | 'state' | 'createdAt'
>;
export type ReceivePixDevolutionReceivedResponse = Pick<
  PixDevolutionReceived,
  'id' | 'state' | 'createdAt'
>;
export type ReceivePixPaymentChargebackResponse = Pick<
  Payment,
  'id' | 'state' | 'createdAt'
>;
export type ReceivePixDevolutionChargebackResponse = Pick<
  PixDevolution,
  'id' | 'state' | 'createdAt'
>;

export interface PixPaymentService {
  /**
   * Get pix payment by id (Is the same id of transactionId in PSP).
   * @param id The id of transaction received by psp.
   * @returns Payment.
   */
  getPixPaymentById(id: string): Promise<GetPaymentByIdResponse>;

  /**
   * Get pixDevolution by id.
   * @param id The PixDevolution id.
   * @returns PixDevolution.
   */
  getPixDevolutionById(id: string): Promise<GetPixDevolutionByIdResponse>;

  /**
   * Create a received PixDeposit.
   * @param request The PixDeposit.
   * @returns PixDeposit.
   */
  receivePixDeposit(request: PixDeposit): Promise<ReceivePixDepositResponse>;

  /**
   * Create a received PixDevolution.
   * @param request The PixDevolutionReceived.
   * @returns PixDevolutionReceived.
   */
  receivePixDevolution(
    request: PixDevolutionReceived,
  ): Promise<ReceivePixDevolutionReceivedResponse>;

  /**
   * Create a received Payment Chargeback.
   * @param request The Payment.
   * @returns PixDeposit.
   */
  receivePixPaymentChargeback(
    request: Payment,
  ): Promise<ReceivePixPaymentChargebackResponse>;

  /**
   * Create a received PixDevolution Chargeback.
   * @param request The PixDevolution.
   * @returns PixDevolution.
   */
  receivePixDevolutionChargeback(
    request: PixDevolution,
  ): Promise<ReceivePixDevolutionChargebackResponse>;
}
