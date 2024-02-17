import { Logger } from 'winston';
import { WarningPixDevolutionRepository } from '@zro/pix-payments/domain';
import {
  SyncWaitingWarningPixDevolutionUseCase as UseCase,
  PixPaymentGateway,
  TranslateService,
} from '@zro/pix-payments/application';
import {
  WarningPixDevolutionEventEmitterController,
  WarningPixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export class SyncWaitingWarningPixDevolutionController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param translateService Translate service.
   * @param warningPixDevolutionRepository WarningPixDevolution repository.
   * @param serviceEventEmitter WarningPixDevolution event emitter.
   * @param pspGateway PSP gateway instance.
   * @param updatedAtThresholdInSeconds UpdatedAt threshold in seconds.
   */
  constructor(
    private logger: Logger,
    translateService: TranslateService,
    warningPixDevolutionRepository: WarningPixDevolutionRepository,
    serviceEventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
    pspGateway: PixPaymentGateway,
    updatedAtThresholdInSeconds: number,
  ) {
    this.logger = logger.child({
      context: SyncWaitingWarningPixDevolutionController.name,
    });

    const eventEmitter = new WarningPixDevolutionEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      translateService,
      warningPixDevolutionRepository,
      eventEmitter,
      pspGateway,
      updatedAtThresholdInSeconds,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug(
      'Sync waiting warning pix devolutions and request to psp.',
    );

    await this.usecase.execute();
  }
}
