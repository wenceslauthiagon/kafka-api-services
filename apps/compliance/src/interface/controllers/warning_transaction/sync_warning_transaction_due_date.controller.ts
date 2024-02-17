import { Logger } from 'winston';
import { WarningTransactionRepository } from '@zro/compliance/domain';
import {
  SyncWarningTransactionDueDateUseCase as UseCase,
  PixPaymentService,
} from '@zro/compliance/application';
import {
  WarningTransactionEventEmitterController,
  WarningTransactionEventEmitterControllerInterface,
} from '@zro/compliance/interface';

export class SyncWarningTransactionDueDateController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param warningTransactionRepository Warning Transaction repository.
   * @param serviceEventEmitter WarningTransaction event emitter.
   * @param pixPaymentService Pix Payment service
   */
  constructor(
    private logger: Logger,
    warningTransactionRepository: WarningTransactionRepository,
    serviceEventEmitter: WarningTransactionEventEmitterControllerInterface,
    pixPaymentService: PixPaymentService,
  ) {
    this.logger = logger.child({
      context: SyncWarningTransactionDueDateController.name,
    });

    const eventEmitter = new WarningTransactionEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      warningTransactionRepository,
      eventEmitter,
      pixPaymentService,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync warning transaction due date.');

    await this.usecase.execute();
  }
}
