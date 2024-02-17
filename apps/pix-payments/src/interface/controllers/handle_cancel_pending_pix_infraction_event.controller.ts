import { Logger } from 'winston';
import { IsEnum, IsUUID, IsInt, IsPositive } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  HandleCancelPendingPixInfractionEventUseCase as UseCase,
  PixInfractionEvent,
  PixInfractionGateway,
} from '@zro/pix-payments/application';
import {
  PixInfraction,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionRepository,
} from '@zro/pix-payments/domain';
import {
  PixInfractionEventEmitterController,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type THandleCancelPendingPixInfractionEventRequest = PixInfractionEvent;

export class HandleCancelPendingPixInfractionEventRequest
  extends AutoValidator
  implements THandleCancelPendingPixInfractionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  constructor(props: THandleCancelPendingPixInfractionEventRequest) {
    super(props);
  }
}

type THandleCancelPendingPixInfractionEventResponse = Pick<
  PixInfraction,
  'id' | 'issueId' | 'state' | 'status'
>;

export class HandleCancelPendingPixInfractionEventResponse
  extends AutoValidator
  implements THandleCancelPendingPixInfractionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsInt()
  @IsPositive()
  issueId: number;

  @IsEnum(PixInfractionStatus)
  status: PixInfractionStatus;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  constructor(props: THandleCancelPendingPixInfractionEventResponse) {
    super(props);
  }
}

export class HandleCancelPendingPixInfractionEventController {
  /**
   * Handler triggered when Infraction is cancelled.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pspInfractionGateway Pix infraction gateway.
   * @param infractionRepository Infraction repository.
   * @param eventEmitter Infraction event emitter.
   */
  constructor(
    private logger: Logger,
    pspInfractionGateway: PixInfractionGateway,
    infractionRepository: PixInfractionRepository,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleCancelPendingPixInfractionEventController.name,
    });

    const controllerEventEmitter = new PixInfractionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      infractionRepository,
      pspInfractionGateway,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleCancelPendingPixInfractionEventRequest,
  ): Promise<HandleCancelPendingPixInfractionEventResponse> {
    this.logger.debug('Handle create infraction request.', { request });

    const { id } = request;

    const infractionUpdated = await this.usecase.execute(id);

    if (!infractionUpdated) return null;

    const response = new HandleCancelPendingPixInfractionEventResponse({
      id: infractionUpdated.id,
      issueId: infractionUpdated.issueId,
      state: infractionUpdated.state,
      status: infractionUpdated.status,
    });

    this.logger.info('Handle pending infraction event by ID response.', {
      infraction: response,
    });

    return response;
  }
}
