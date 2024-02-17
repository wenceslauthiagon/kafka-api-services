import { Logger } from 'winston';
import { PixRefundDevolutionRepository } from '@zro/pix-payments/domain';
import {
  SyncWaitingPixRefundDevolutionUseCase as UseCase,
  PixPaymentGateway,
  TranslateService,
} from '@zro/pix-payments/application';
import {
  PixRefundDevolutionEventEmitterController,
  PixRefundDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export class SyncWaitingPixRefundDevolutionController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param translateService Translate service.
   * @param refundDevolutionRepository PixRefundDevolution repository.
   * @param serviceEventEmitter PixRefundDevolution event emitter.
   * @param pspGateway PSP gateway instance.
   * @param updatedAtThresholdInSeconds UpdatedAt threshold in seconds.
   */
  constructor(
    private logger: Logger,
    translateService: TranslateService,
    refundDevolutionRepository: PixRefundDevolutionRepository,
    serviceEventEmitter: PixRefundDevolutionEventEmitterControllerInterface,
    pspGateway: PixPaymentGateway,
    updatedAtThresholdInSeconds: number,
  ) {
    this.logger = logger.child({
      context: SyncWaitingPixRefundDevolutionController.name,
    });

    const eventEmitter = new PixRefundDevolutionEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      translateService,
      refundDevolutionRepository,
      eventEmitter,
      pspGateway,
      updatedAtThresholdInSeconds,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug(
      'Sync waiting pix refund devolutions and request to psp.',
    );

    await this.usecase.execute();
  }
}
