import { Logger } from 'winston';
import { PaymentRepository } from '@zro/pix-payments/domain';
import {
  SyncWaitingPaymentUseCase as UseCase,
  PixPaymentGateway,
  TranslateService,
} from '@zro/pix-payments/application';
import {
  PaymentEventEmitterController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export class SyncWaitingPaymentController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param translateService Translate service.
   * @param paymentRepository PixPayment repository.
   * @param serviceEventEmitter PixDevolution event emitter.
   * @param pspGateway PSP gateway instance.
   * @param updatedAtThresholdInSeconds UpdatedAt threshold in seconds.
   */
  constructor(
    private logger: Logger,
    translateService: TranslateService,
    paymentRepository: PaymentRepository,
    serviceEventEmitter: PaymentEventEmitterControllerInterface,
    pspGateway: PixPaymentGateway,
    updatedAtThresholdInSeconds: number,
  ) {
    this.logger = logger.child({
      context: SyncWaitingPaymentController.name,
    });

    const eventEmitter = new PaymentEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      translateService,
      paymentRepository,
      eventEmitter,
      pspGateway,
      updatedAtThresholdInSeconds,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync waiting payments and request to psp');

    await this.usecase.execute();
  }
}
