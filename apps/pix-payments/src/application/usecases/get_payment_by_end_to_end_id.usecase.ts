import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';
import { Payment, PaymentRepository } from '@zro/pix-payments/domain';

export class GetPaymentByEndToEndIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository Payment repository.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PaymentRepository,
  ) {
    this.logger = logger.child({ context: GetPaymentByEndToEndIdUseCase.name });
  }

  /**
   * Get Payment by end to end id.
   *
   * @param endToEndId Payment data.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @returns Payment data.
   */
  async execute(
    endToEndId: string,
    user?: User,
    wallet?: Wallet,
  ): Promise<Payment> {
    // Data input check
    if (!endToEndId) {
      throw new MissingDataException(['ID']);
    }

    this.logger.debug('Get Payment by endToEndId.', { endToEndId });

    // Get Payment
    const payment = await this.repository.getByEndToEndId(endToEndId);

    this.logger.debug('Payment found.', { payment });

    if (
      !payment ||
      (user && user?.uuid !== payment.user.uuid) ||
      (wallet && wallet?.uuid !== payment.wallet.uuid)
    ) {
      return null;
    }

    return payment;
  }
}
