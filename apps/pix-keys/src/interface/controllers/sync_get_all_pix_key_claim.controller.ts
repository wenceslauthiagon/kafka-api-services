import { Logger } from 'winston';
import { PixKeyClaimRepository } from '@zro/pix-keys/domain';
import {
  SyncGetAllPixKeyClaimPixKeyUseCase as UseCase,
  PixKeyGateway,
} from '@zro/pix-keys/application';
import {
  PixKeyClaimEventEmitterController,
  PixKeyClaimEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export class SyncGetAllPixKeyClaimController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixKeyClaimRepository: PixKeyClaimRepository,
    serviceEventEmitter: PixKeyClaimEventEmitterControllerInterface,
    pspGateway: PixKeyGateway,
    ispb: string,
    pageSize: number,
    limitDay: number,
  ) {
    this.logger = logger.child({
      context: SyncGetAllPixKeyClaimController.name,
    });

    const eventEmitter = new PixKeyClaimEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      pixKeyClaimRepository,
      eventEmitter,
      pspGateway,
      ispb,
      pageSize,
      limitDay,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync get all pix key claim request.');

    await this.usecase.execute();
  }
}
