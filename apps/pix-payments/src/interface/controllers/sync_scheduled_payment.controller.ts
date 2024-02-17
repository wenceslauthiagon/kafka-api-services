import { Logger } from 'winston';
import { PaymentRepository } from '@zro/pix-payments/domain';
import { SyncScheduledPaymentUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PaymentEventEmitterController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export class SyncScheduledPaymentController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PaymentRepository,
    serviceEventEmitter: PaymentEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: SyncScheduledPaymentController.name,
    });

    const eventEmitter = new PaymentEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(this.logger, paymentRepository, eventEmitter);
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync schedule pix payments request.');

    await this.usecase.execute();

    this.logger.info('Sync schedule pix payments finished.');
  }
}
