import { Logger } from 'winston';
import { PixDevolutionRepository } from '@zro/pix-payments/domain';
import {
  SyncWaitingRecentPixDevolutionUseCase as UseCase,
  PixPaymentGateway,
  TranslateService,
} from '@zro/pix-payments/application';
import {
  PixDevolutionEventEmitterController,
  PixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export class SyncWaitingRecentPixDevolutionController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param translateService Translate service.
   * @param devolutionRepository PixDevolution repository.
   * @param serviceEventEmitter PixDevolution event emitter.
   * @param pspGateway PSP gateway instance.
   * @param updatedAtThresholdInSeconds UpdatedAt threshold in seconds.
   */
  constructor(
    private logger: Logger,
    translateService: TranslateService,
    devolutionRepository: PixDevolutionRepository,
    serviceEventEmitter: PixDevolutionEventEmitterControllerInterface,
    pspGateway: PixPaymentGateway,
    updatedAtThresholdInSeconds: number,
  ) {
    this.logger = logger.child({
      context: SyncWaitingRecentPixDevolutionController.name,
    });

    const eventEmitter = new PixDevolutionEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      translateService,
      devolutionRepository,
      eventEmitter,
      pspGateway,
      updatedAtThresholdInSeconds,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync waiting pixDevolutions and request to psp.');

    await this.usecase.execute();
  }
}
