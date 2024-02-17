import { Logger } from 'winston';
import {
  PixRefundGateway,
  SyncPixRefundUseCase as UseCase,
} from '@zro/pix-payments/application';
import {
  PixRefundEventEmitterController,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export class SyncPixRefundController {
  private readonly usecase: UseCase;

  constructor(
    private logger: Logger,
    serviceEventEmitter: PixRefundEventEmitterControllerInterface,
    pspGateway: PixRefundGateway,
  ) {
    this.logger = logger.child({ context: SyncPixRefundController.name });

    const eventEmitter = new PixRefundEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(this.logger, eventEmitter, pspGateway);
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync open pix refunds request.');

    await this.usecase.execute();

    this.logger.debug('Finish sync open pix refunds.');
  }
}
