import { Logger } from 'winston';
import { getMoment } from '@zro/common';
import {
  Payment,
  PaymentRepository,
  PaymentState,
} from '@zro/pix-payments/domain';
import { PaymentEventEmitter } from '@zro/pix-payments/application';

export class SyncScheduledPaymentUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixPayment repository.
   * @param eventEmitter PixPayment event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PaymentRepository,
    private readonly eventEmitter: PaymentEventEmitter,
  ) {
    this.logger = logger.child({ context: SyncScheduledPaymentUseCase.name });
  }

  /**
   * Set all Scheduled Payments to Pending state.
   * @returns Payments found.
   */
  async execute(): Promise<Payment[]> {
    const scheduledPayments = await this.repository.getAllByStateAndPaymentDate(
      PaymentState.SCHEDULED,
      getMoment().toDate(),
    );
    const modifiedPayments = [];

    for (const payment of scheduledPayments) {
      payment.state = PaymentState.PENDING;
      await this.repository.update(payment);

      // Fire pendingPayment
      this.eventEmitter.pendingPayment(payment);

      modifiedPayments.push(payment);
    }

    this.logger.debug('Pending payments sent.', { modifiedPayments });

    return modifiedPayments;
  }
}
