import { Logger } from 'winston';
import {
  PixFraudDetectionGateway,
  SyncPixFraudDetectionUseCase as UseCase,
} from '@zro/pix-payments/application';
import {
  PixFraudDetectionEventEmitterController,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export class SyncPixFraudDetectionController {
  private readonly usecase: UseCase;

  constructor(
    private logger: Logger,
    fraudDetectionServiceEventEmitter: PixFraudDetectionEventEmitterControllerInterface,
    pspGateway: PixFraudDetectionGateway,
  ) {
    this.logger = logger.child({
      context: SyncPixFraudDetectionController.name,
    });

    const eventEmitter = new PixFraudDetectionEventEmitterController(
      fraudDetectionServiceEventEmitter,
    );

    this.usecase = new UseCase(this.logger, eventEmitter, pspGateway);
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync pix fraud detection request.');

    await this.usecase.execute();

    this.logger.info('Finish sync pix fraud detection.');
  }
}
