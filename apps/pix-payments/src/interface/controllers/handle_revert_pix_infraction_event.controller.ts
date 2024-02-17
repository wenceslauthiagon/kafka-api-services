import { Logger } from 'winston';
import { IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';
import { AutoValidator, Failed, IsIsoStringDateFormat } from '@zro/common';
import {
  HandleRevertPixInfractionEventUseCase as UseCase,
  PixInfractionEvent,
} from '@zro/pix-payments/application';
import {
  PixInfractionEventEmitterController,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  PixInfraction,
  PixInfractionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';

type THandleRevertPixInfractionEventRequest = PixInfractionEvent & {
  failed?: Failed;
};

export class HandleRevertPixInfractionEventRequest
  extends AutoValidator
  implements THandleRevertPixInfractionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  constructor(props: THandleRevertPixInfractionEventRequest) {
    super(props);
  }
}

type THandleRevertPixInfractionEventResponse = Pick<
  PixInfraction,
  'id' | 'state' | 'createdAt'
>;

export class HandleRevertPixInfractionEventResponse
  extends AutoValidator
  implements THandleRevertPixInfractionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleRevertPixInfractionEventResponse) {
    super(props);
  }
}

export class HandleRevertPixInfractionEventController {
  /**
   * Handler triggered when an revert is thrown.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param repository PixInfraction repository.
   * @param eventEmitter PixInfraction event emitter.
   */
  constructor(
    private logger: Logger,
    repository: PixInfractionRepository,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleRevertPixInfractionEventController.name,
    });

    const controllerEventEmitter = new PixInfractionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(this.logger, repository, controllerEventEmitter);
  }

  async execute(
    request: HandleRevertPixInfractionEventRequest,
  ): Promise<HandleRevertPixInfractionEventResponse> {
    this.logger.debug('Handle revert event by ID request.', { request });

    const { id, failed } = request;

    const infraction = await this.usecase.execute(id, failed);

    if (!infraction) return null;

    this.logger.info('Handle revert event by ID response.', {
      infraction,
    });

    const response = new HandleRevertPixInfractionEventResponse({
      id: infraction.id,
      state: infraction.state,
      createdAt: infraction.createdAt,
    });

    return response;
  }
}
