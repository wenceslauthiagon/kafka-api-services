import { Logger } from 'winston';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, Failed, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  PixDepositRepository,
  WarningPixDevolution,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  HandleRevertWarningPixDevolutionEventUseCase as UseCase,
  WarningPixDevolutionEvent,
} from '@zro/pix-payments/application';
import {
  WarningPixDevolutionEventEmitterController,
  WarningPixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];

type THandleRevertWarningPixDevolutionEventRequest = Pick<
  WarningPixDevolutionEvent,
  'id' | 'state' | 'chargebackReason' | 'failed'
> & { userId: UserId };

export class HandleRevertWarningPixDevolutionEventRequest
  extends AutoValidator
  implements THandleRevertWarningPixDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(WarningPixDevolutionState)
  state: WarningPixDevolutionState;

  @IsUUID(4)
  userId: UserId;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  chargebackReason?: string;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  constructor(props: THandleRevertWarningPixDevolutionEventRequest) {
    super(props);
  }
}

type THandleRevertWarningPixDevolutionEventResponse = Pick<
  WarningPixDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandleRevertWarningPixDevolutionEventResponse
  extends AutoValidator
  implements THandleRevertWarningPixDevolutionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WarningPixDevolutionState)
  state: WarningPixDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleRevertWarningPixDevolutionEventResponse) {
    super(props);
  }
}

export class HandleRevertWarningPixDevolutionEventController {
  /**
   * Handler triggered when an revert is thrown.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param devolutionRepository WarningPixDevolution repository.
   * @param eventEmitter WarningPixDevolution event emitter.
   */
  constructor(
    private logger: Logger,
    devolutionRepository: WarningPixDevolutionRepository,
    depositRepository: PixDepositRepository,
    eventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleRevertWarningPixDevolutionEventController.name,
    });

    const controllerEventEmitter =
      new WarningPixDevolutionEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      devolutionRepository,
      depositRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandleRevertWarningPixDevolutionEventRequest,
  ): Promise<HandleRevertWarningPixDevolutionEventResponse> {
    this.logger.debug('Handle revert event by ID request.', { request });

    const { id, chargebackReason, failed } = request;

    const devolution = await this.usecase.execute(id, chargebackReason, failed);

    if (!devolution) return null;

    const response = new HandleRevertWarningPixDevolutionEventResponse({
      id: devolution.id,
      state: devolution.state,
      createdAt: devolution.createdAt,
    });

    this.logger.info('Handle revert event by ID response.', {
      devolution: response,
    });

    return response;
  }
}
