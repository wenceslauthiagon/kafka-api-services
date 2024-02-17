import { Logger } from 'winston';
import { IsEnum, IsUUID, IsInt, IsPositive } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  HandleClosePendingPixInfractionReceivedEventUseCase as UseCase,
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

export type THandleClosePendingPixInfractionReceivedEventRequest = Pick<
  PixInfraction,
  'id'
>;

export class HandleClosePendingPixInfractionReceivedEventRequest
  extends AutoValidator
  implements THandleClosePendingPixInfractionReceivedEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  constructor(props: THandleClosePendingPixInfractionReceivedEventRequest) {
    super(props);
  }
}

type THandleClosePendingPixInfractionReceivedEventResponse = Pick<
  PixInfraction,
  'id' | 'issueId' | 'state' | 'status'
>;

export class HandleClosePendingPixInfractionReceivedEventResponse
  extends AutoValidator
  implements THandleClosePendingPixInfractionReceivedEventResponse
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

  constructor(props: THandleClosePendingPixInfractionReceivedEventResponse) {
    super(props);
  }
}

export class HandleClosePendingPixInfractionReceivedEventController {
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
      context: HandleClosePendingPixInfractionReceivedEventController.name,
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
    request: HandleClosePendingPixInfractionReceivedEventRequest,
  ): Promise<HandleClosePendingPixInfractionReceivedEventResponse> {
    this.logger.debug('Handle pending event by ID request.', { request });

    const { id } = request;

    const infractionUpdated = await this.usecase.execute(id);

    if (!infractionUpdated) return null;

    const response = new HandleClosePendingPixInfractionReceivedEventResponse({
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
