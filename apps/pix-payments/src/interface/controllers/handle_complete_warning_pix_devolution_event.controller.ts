import { Logger } from 'winston';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  HandleCompleteWarningPixDevolutionEventUseCase as UseCase,
  WarningPixDevolutionEvent,
} from '@zro/pix-payments/application';
import {
  WarningPixDevolution,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  WarningPixDevolutionEventEmitterController,
  WarningPixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];

type THandleCompleteWarningPixDevolutionEventRequest = Pick<
  WarningPixDevolutionEvent,
  'id' | 'state' | 'endToEndId'
> & { userId: UserId };

export class HandleCompleteWarningPixDevolutionEventRequest
  extends AutoValidator
  implements THandleCompleteWarningPixDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId?: string;

  @IsEnum(WarningPixDevolutionState)
  state: WarningPixDevolutionState;

  @IsUUID(4)
  userId: UserId;

  constructor(props: THandleCompleteWarningPixDevolutionEventRequest) {
    super(props);
  }
}

type THandleCompleteWarningPixDevolutionEventResponse = Pick<
  WarningPixDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandleCompleteWarningPixDevolutionEventResponse
  extends AutoValidator
  implements THandleCompleteWarningPixDevolutionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WarningPixDevolutionState)
  state: WarningPixDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleCompleteWarningPixDevolutionEventResponse) {
    super(props);
  }
}

export class HandleCompleteWarningPixDevolutionEventController {
  /**
   * Handler triggered when warningPixDevolution was notified completion successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param warningPixDevolutionRepository WarningPixDevolution Repository.
   * @param eventWarningPixDevolutionEmitter WarningPixDevolutionEventEmitterControllerInterface emitter.
   */
  constructor(
    private logger: Logger,
    warningPixDevolutionRepository: WarningPixDevolutionRepository,
    eventWarningPixDevolutionEmitter: WarningPixDevolutionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleCompleteWarningPixDevolutionEventController.name,
    });

    const controllerWarningPixDevolutionEventEmitter =
      new WarningPixDevolutionEventEmitterController(
        eventWarningPixDevolutionEmitter,
      );

    this.usecase = new UseCase(
      this.logger,
      warningPixDevolutionRepository,
      controllerWarningPixDevolutionEventEmitter,
    );
  }

  async execute(
    request: HandleCompleteWarningPixDevolutionEventRequest,
  ): Promise<HandleCompleteWarningPixDevolutionEventResponse> {
    this.logger.debug('Handle complete event by ID request.', { request });

    const { id, endToEndId } = request;

    const devolution = await this.usecase.execute(id, endToEndId);

    if (!devolution) return null;

    const response = new HandleCompleteWarningPixDevolutionEventResponse({
      id: devolution.id,
      state: devolution.state,
      createdAt: devolution.createdAt,
    });

    this.logger.info('Handle complete event by ID response.', {
      devolution: response,
    });

    return response;
  }
}
