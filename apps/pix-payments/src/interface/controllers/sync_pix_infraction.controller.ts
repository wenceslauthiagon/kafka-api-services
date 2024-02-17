import { Logger } from 'winston';
import {
  PixInfractionGateway,
  SyncPixInfractionUseCase as UseCase,
} from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterController,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { PixInfractionRepository } from '@zro/pix-payments/domain';

export class SyncPixInfractionController {
  private readonly usecase: UseCase;

  constructor(
    private logger: Logger,
    pixInfractionRepository: PixInfractionRepository,
    serviceEventEmitter: PixInfractionEventEmitterControllerInterface,
    pspGateway: PixInfractionGateway,
  ) {
    this.logger = logger.child({ context: SyncPixInfractionController.name });

    const eventEmitter = new PixInfractionEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixInfractionRepository,
      pspGateway,
      eventEmitter,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Update pix infractions request.');

    await this.usecase.execute();

    this.logger.info('Finish update pix infractions.');
  }
}
