import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import { MissingDataException } from '@zro/common';
import {
  NotifyStateType,
  NotifyCompletionEntity,
  NotifyCompletionRepository,
} from '@zro/api-topazio/domain';
import {
  PixPaymentService,
  PixPaymentEventEmitter,
  PixDevolutionEventEmitter,
  NotifyInvalidStatusException,
  NotifyPixPaymentNotFoundException,
  NotifyPixDevolutionNotFoundException,
} from '@zro/api-topazio/application';

export class HandleNotifyCompletionTopazioEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyCompletionRepository repository.
   * @param pixPaymentService Payment service.
   * @param pixPaymentEmitter Payment Emitter.
   * @param pixDevolutionEmitter Devolution Emitter.
   */
  constructor(
    private logger: Logger,
    private readonly notifyCompletionRepository: NotifyCompletionRepository,
    private readonly pixPaymentService: PixPaymentService,
    private readonly pixPaymentEmitter: PixPaymentEventEmitter,
    private readonly pixDevolutionEmitter: PixDevolutionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleNotifyCompletionTopazioEventUseCase.name,
    });
  }

  /**
   * Notify completion and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyCompletionEntity): Promise<void> {
    const { transactionId, isDevolution, status, endToEndId } = payload;

    if (!transactionId || !isDefined(isDevolution) || !status) {
      throw new MissingDataException([
        ...(!transactionId ? ['Transaction ID'] : []),
        ...(!isDefined(isDevolution) ? ['Devolution'] : []),
        ...(!status ? ['Status'] : []),
      ]);
    }

    if (!payload.isValidStatus()) {
      throw new NotifyInvalidStatusException(status);
    }

    // Save all notify in database
    payload.state = NotifyStateType.READY;
    await this.notifyCompletionRepository.create(payload);

    if (isDevolution) {
      await this.handleDevolution(transactionId, endToEndId);
    } else {
      await this.handlePayment(transactionId, endToEndId);
    }

    this.logger.debug('Event sent.');
  }

  /**
   * Payment exists and is not a devolution. Emit completedPayment for confirm a payment.
   * @param id The transaction's id
   * @param endToEndId The transaction's endToEndId
   */
  private async handlePayment(id: string, endToEndId?: string): Promise<void> {
    // Get payment by id
    const payment = await this.pixPaymentService.getPixPaymentById(id);

    this.logger.debug('Payment found by id.', { payment });

    if (!payment) {
      throw new NotifyPixPaymentNotFoundException(id);
    }

    return this.pixPaymentEmitter.completedPayment({ ...payment, endToEndId });
  }

  /**
   * Payment exists and is a devolution. Emit completedDevolution for confirm a devolution.
   * @param id The transaction's id
   * @param endToEndId The transaction's endToEndId
   */
  private async handleDevolution(
    id: string,
    endToEndId?: string,
  ): Promise<void> {
    // Get pixDevolution by id
    const devolution = await this.pixPaymentService.getPixDevolutionById(id);

    this.logger.debug('PixDevolution found by id.', { devolution });

    if (!devolution) {
      throw new NotifyPixDevolutionNotFoundException(id);
    }

    return this.pixDevolutionEmitter.completedDevolution({
      ...devolution,
      endToEndId,
    });
  }
}
