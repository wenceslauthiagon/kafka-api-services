import { Logger } from 'winston';
import { IsEnum, IsUUID, IsInt, IsPositive } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  HandleClosePendingPixInfractionEventUseCase as UseCase,
  PixInfractionGateway,
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

export type THandleClosePendingPixInfractionEventRequest = Pick<
  PixInfraction,
  'id'
>;

export class HandleClosePendingPixInfractionEventRequest
  extends AutoValidator
  implements THandleClosePendingPixInfractionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixInfractionState)
  state: PixInfractionState;

  constructor(props: THandleClosePendingPixInfractionEventRequest) {
    super(props);
  }
}

type THandleClosePendingPixInfractionEventResponse = Pick<
  PixInfraction,
  'id' | 'issueId' | 'state' | 'status'
>;

export class HandleClosePendingPixInfractionEventResponse
  extends AutoValidator
  implements THandleClosePendingPixInfractionEventResponse
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

  constructor(props: THandleClosePendingPixInfractionEventResponse) {
    super(props);
  }
}

export class HandleClosePendingPixInfractionEventController {
  /**
   * Handler triggered when Infraction was notified completion successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param infractionRepository Infraction repository.
   * @param pspInfractionGateway Pix infraction gateway.
   */
  constructor(
    private logger: Logger,
    infractionRepository: PixInfractionRepository,
    pspInfractionGateway: PixInfractionGateway,
    eventEmitter: PixInfractionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleClosePendingPixInfractionEventController.name,
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
    request: HandleClosePendingPixInfractionEventRequest,
  ): Promise<HandleClosePendingPixInfractionEventResponse> {
    this.logger.debug('Handle pending event by ID request.', { request });

    const { id } = request;

    const infractionUpdated = await this.usecase.execute(id);

    if (!infractionUpdated) return null;

    const response = new HandleClosePendingPixInfractionEventResponse({
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
