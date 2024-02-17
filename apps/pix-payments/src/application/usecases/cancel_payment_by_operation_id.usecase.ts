import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Operation, Wallet } from '@zro/operations/domain';
import {
  PaymentState,
  Payment,
  PaymentRepository,
} from '@zro/pix-payments/domain';
import {
  PaymentEventEmitter,
  PaymentNotFoundException,
  PaymentInvalidStateException,
} from '@zro/pix-payments/application';

export class CancelPaymentByOperationIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param paymentRepository Pix payment repository.
   */
  constructor(
    private logger: Logger,
    private readonly paymentRepository: PaymentRepository,
    private readonly eventEmitter: PaymentEventEmitter,
  ) {
    this.logger = logger.child({
      context: CancelPaymentByOperationIdUseCase.name,
    });
  }

  /**
   * Cancel payment by user and id.
   *
   * @param wallet Payment's wallet.
   * @param operation The operation
   * @returns Payment found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PaymentNotFoundException} Thrown when payment id was not found.
   * @throws {PaymentInvalidStateException} Thrown when payment state is not valid.
   * @throws {PaymentInvalidTypeException} Thrown when payment type is not valid.
   */
  async execute(wallet: Wallet, operation: Operation): Promise<Payment> {
    // Data input check
    if (!wallet?.uuid || !operation?.id) {
      throw new MissingDataException([
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!operation?.id ? ['Operation ID'] : []),
      ]);
    }

    // Search payment.
    const payment = await this.paymentRepository.getByOperationAndWallet(
      operation,
      wallet,
    );

    this.logger.debug('Pix payment found.', { payment });

    if (!payment) {
      throw new PaymentNotFoundException({ operation });
    }

    if ([PaymentState.CANCELED].includes(payment.state)) {
      return payment;
    }

    // Only payments in valid state can be canceled.
    if (!payment.isStateValidForCanceling()) {
      throw new PaymentInvalidStateException(payment);
    }

    payment.state = PaymentState.CANCELED;
    payment.canceledAt = new Date();

    // Store new payment state.
    await this.paymentRepository.update(payment);

    this.eventEmitter.canceledPayment(payment);

    this.logger.debug('Pix payment updated.', { payment });

    return payment;
  }
}
