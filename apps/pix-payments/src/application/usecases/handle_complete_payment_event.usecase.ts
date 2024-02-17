import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  Payment,
  PaymentRepository,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  PaymentNotFoundException,
  PaymentInvalidStateException,
  OperationService,
  PaymentEventEmitter,
} from '@zro/pix-payments/application';

export class HandleCompletePaymentEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository payment repository.
   * @param eventEmitter payment event emitter.
   * @param operationService Operation service gateway.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PaymentRepository,
    private readonly eventEmitter: PaymentEventEmitter,
    private readonly operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: HandleCompletePaymentEventUseCase.name,
    });
  }

  /**
   * Handler triggered when payment is complete.
   *
   * @param id payment id.
   * @param endToEndId payment endToEndId.
   * @returns Payment created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PaymentNotFoundException} Thrown when payment id was not found.
   * @throws {PaymentInvalidStateException} Thrown when payment state is not complete.
   */
  async execute(id: string, endToEndId?: string): Promise<Payment> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['Transaction ID']);
    }

    // Search payment
    const payment = await this.repository.getById(id);

    this.logger.debug('Found payment.', { payment });

    if (!payment) {
      throw new PaymentNotFoundException({ id });
    }

    // Indepotent
    if (payment.isAlreadyCompletedPayment()) {
      return payment;
    }

    // Only WAITING payment is accept.
    if (payment.state !== PaymentState.WAITING) {
      throw new PaymentInvalidStateException(payment);
    }

    // Accept payment operation
    await this.operationService.acceptOperation(payment.operation);

    //Accept payment change operation
    if (payment.changeOperation?.id) {
      await this.operationService.acceptOperation(payment.changeOperation);
    }

    this.logger.debug('Accepted payment for waiting payment.', { payment });

    // payment is confirmed.
    payment.state = PaymentState.CONFIRMED;
    payment.endToEndId = endToEndId;
    payment.confirmedAt = new Date();

    // Update payment
    await this.repository.update(payment);

    // Fire Confirmed Payment
    this.eventEmitter.confirmedPayment(payment);

    this.logger.debug('Updated payment with confirmed status.', { payment });

    return payment;
  }
}
