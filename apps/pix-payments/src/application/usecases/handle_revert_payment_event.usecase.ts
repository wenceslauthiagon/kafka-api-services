import { Logger } from 'winston';
import { Failed, MissingDataException } from '@zro/common';
import {
  Payment,
  PaymentRepository,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  OperationService,
  PaymentNotFoundException,
  PaymentEventEmitter,
  PaymentInvalidStateException,
} from '@zro/pix-payments/application';

export class HandleRevertPaymentEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PaymentRepository repository.
   * @param eventEmitter Payment event emitter.
   * @param operationService Operation service.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PaymentRepository,
    private readonly eventEmitter: PaymentEventEmitter,
    private readonly operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: HandleRevertPaymentEventUseCase.name,
    });
  }

  /**
   * Handler triggered when an revert is thrown.
   *
   * @param id Payment id.
   * @returns Payment updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PaymentNotFoundException} Thrown when payment id was not found.
   */
  async execute(
    id: string,
    chargebackReason?: string,
    failed?: Failed,
  ): Promise<Payment> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search Payment
    const payment = await this.repository.getById(id);

    this.logger.debug('Found Payment.', { payment });

    if (!payment) {
      throw new PaymentNotFoundException({ id });
    }

    // Check indepotent
    if (payment.state === PaymentState.FAILED) {
      return payment;
    }

    // Check sanity.
    if (
      ![
        PaymentState.PENDING,
        PaymentState.WAITING,
        PaymentState.CONFIRMED,
      ].includes(payment.state)
    ) {
      throw new PaymentInvalidStateException(payment);
    }

    await this.revertOperation(payment);

    if (payment.changeOperation?.id) {
      await this.revertChangeOperation(payment);
    }

    // Update payment
    payment.state = PaymentState.FAILED;
    payment.chargebackReason = chargebackReason;
    payment.failed = failed;

    await this.repository.update(payment);

    // Fire RevertPaymentEvent
    this.eventEmitter.failedPayment(payment);

    return payment;
  }

  //Revert commonOperation
  private async revertOperation(payment: Payment) {
    const hasOperation = await this.operationService.getOperationById(
      payment.operation.id,
    );

    if (hasOperation) {
      //Revert Operation Client
      await this.operationService.revertOperation(payment.operation);
      this.logger.debug('Payment reverted.', { payment });
    } else {
      Object.assign(payment, { operationId: null, operation: { id: null } });
    }
  }

  //Revert changeOperation
  private async revertChangeOperation(payment: Payment) {
    const hasOperation = await this.operationService.getOperationById(
      payment.changeOperation.id,
    );

    if (hasOperation) {
      //Revert Operation Client
      await this.operationService.revertOperation(payment.changeOperation);
      this.logger.debug('Payment change reverted.', { payment });
    } else {
      Object.assign(payment, {
        changeOperationId: null,
        changeOperation: { id: null },
      });
    }
  }
}
