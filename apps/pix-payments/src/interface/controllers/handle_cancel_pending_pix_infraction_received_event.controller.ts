import { Logger } from 'winston';
import { IsEnum, IsUUID, IsInt, IsPositive } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  HandleCancelPendingPixInfractionReceivedEventUseCase as UseCase,
  IssueInfractionGateway,
} from '@zro/pix-payments/application';
import {
  PixInfraction,
  PixInfractionStatus,
  PixInfractionState,
  PixInfractionRepository,
} from '@zro/pix-payments/domain';
import {
  PixInfractionEventEmitterController,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type THandleCancelPendingPixInfractionReceivedEventRequest = Pick<
  PixInfraction,
  'id'
>;

export class HandleCancelPendingPixInfractionReceivedEventRequest
  extends AutoValidator
  implements THandleCancelPendingPixInfractionReceivedEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  constructor(props: THandleCancelPendingPixInfractionReceivedEventRequest) {
    super(props);
  }
}

type THandleCancelPendingPixInfractionReceivedEventResponse = Pick<
  PixInfraction,
  'id' | 'issueId' | 'state' | 'status'
>;

export class HandleCancelPendingPixInfractionReceivedEventResponse
  extends AutoValidator
  implements THandleCancelPendingPixInfractionReceivedEventResponse
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

  constructor(props: THandleCancelPendingPixInfractionReceivedEventResponse) {
    super(props);
  }
}

export class HandleCancelPendingPixInfractionReceivedEventController {
  /**
   * Handler triggered when Infraction was notified completion successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param infractionRepository Infraction repository.
   * @param infractionGateway Pix infraction gateway.
   */
  constructor(
    private logger: Logger,
    infractionRepository: PixInfractionRepository,
    infractionGateway: IssueInfractionGateway,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleCancelPendingPixInfractionReceivedEventController.name,
    });

    const controllerEventEmitter = new PixInfractionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      infractionRepository,
      infractionGateway,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleCancelPendingPixInfractionReceivedEventRequest,
  ): Promise<HandleCancelPendingPixInfractionReceivedEventResponse> {
    this.logger.debug('Handle pending event by ID request.', { request });

    const { id } = request;

    const infractionUpdated = await this.usecase.execute(id);

    if (!infractionUpdated) return null;

    const response = new HandleCancelPendingPixInfractionReceivedEventResponse({
      id: infractionUpdated.id,
      issueId: infractionUpdated.issueId,
      state: infractionUpdated.state,
      status: infractionUpdated.status,
    });

    this.logger.info('Handle pending event by ID response.', {
      infraction: response,
    });

    return response;
  }
}
