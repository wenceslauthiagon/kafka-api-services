import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRepository,
} from '@zro/pix-payments/domain';
import { HandleAcknowledgePixInfractionEventUseCase as UseCase } from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterControllerInterface,
  PixInfractionEventEmitterController,
} from '@zro/pix-payments/interface';

export type THandleAcknowledgePixInfractionEventRequest = Pick<
  PixInfraction,
  'infractionPspId'
>;

export class HandleAcknowledgePixInfractionEventRequest
  extends AutoValidator
  implements THandleAcknowledgePixInfractionEventRequest
{
  @IsUUID(4)
  infractionPspId!: string;

  constructor(props: THandleAcknowledgePixInfractionEventRequest) {
    super(props);
  }
}

export class HandleAcknowledgePixInfractionEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    infractionRepository: PixInfractionRepository,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleAcknowledgePixInfractionEventController.name,
    });

    const controllerEventEmitter = new PixInfractionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      infractionRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleAcknowledgePixInfractionEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle acknowledge pix infraction event request.', {
      request,
    });

    const { infractionPspId } = request;
    await this.usecase.execute(infractionPspId);

    this.logger.info('Handle acknowledge pix infraction event finished.');
  }
}
