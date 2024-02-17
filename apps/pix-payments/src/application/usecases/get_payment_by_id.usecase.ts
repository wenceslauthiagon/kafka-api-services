import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';
import { Payment, PaymentRepository } from '@zro/pix-payments/domain';

export class GetPaymentByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository Payment repository.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PaymentRepository,
  ) {
    this.logger = logger.child({ context: GetPaymentByIdUseCase.name });
  }

  /**
   * Get by id Payment.
   *
   * @param id Payment data.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @returns Payment data.
   */
  async execute(id: string, user?: User, wallet?: Wallet): Promise<Payment> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    this.logger.debug('Get Payment by id.', { id });

    // Get Payment
    const payment = await this.repository.getById(id);

    this.logger.debug('Payment received.', { payment });

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
