import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  HandleCreateWarningPixDevolutionEventUseCase as UseCase,
  WarningPixDevolutionEvent,
} from '@zro/pix-payments/application';
import {
  PixDepositRepository,
  WarningPixDeposit,
  WarningPixDevolution,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
  WarningPixDepositRepository,
} from '@zro/pix-payments/domain';
import {
  WarningPixDevolutionEventEmitterController,
  WarningPixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type WarningPixDepositId = WarningPixDeposit['id'];
type UserId = User['uuid'];

type THandleCreateWarningPixDevolutionEventRequest = Pick<
  WarningPixDevolutionEvent,
  'id' | 'state'
> & { warningPixId: WarningPixDepositId; userId: UserId };

export class HandleCreateWarningPixDevolutionEventRequest
  extends AutoValidator
  implements THandleCreateWarningPixDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(WarningPixDevolutionState)
  state: WarningPixDevolutionState;

  @IsUUID(4)
  warningPixId: WarningPixDepositId;

  @IsUUID(4)
  userId: UserId;

  constructor(props: THandleCreateWarningPixDevolutionEventRequest) {
    super(props);
  }
}

type THandleCreateWarningPixDevolutionEventResponse = Pick<
  WarningPixDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandleCreateWarningPixDevolutionEventResponse
  extends AutoValidator
  implements THandleCreateWarningPixDevolutionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WarningPixDevolutionState)
  state: WarningPixDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleCreateWarningPixDevolutionEventResponse) {
    super(props);
  }
}

export class HandleCreateWarningPixDevolutionEventController {
  /**
   * Handler triggered when pixDevolution was notified completion successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param warningPixDevolutionRepository Warning Pix Devolution Repository.
   * @param warningPixDepositRepository Warning Pix Deposit Repository.
   * @param serviceWarningPixDevolutionEventEmitter Warning Pix Devolution Event Emitter Controller Interface.
   * @param depositRepository Pix Deposit Repository
   */
  constructor(
    private logger: Logger,
    warningPixDevolutionRepository: WarningPixDevolutionRepository,
    warningPixDepositRepository: WarningPixDepositRepository,
    serviceWarningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
    depositRepository: PixDepositRepository,
  ) {
    this.logger = logger.child({
      context: HandleCreateWarningPixDevolutionEventController.name,
    });

    const controllerWarningPixDevolutionEventEmitter =
      new WarningPixDevolutionEventEmitterController(
        serviceWarningPixDevolutionEventEmitter,
      );

    this.usecase = new UseCase(
      this.logger,
      warningPixDevolutionRepository,
      warningPixDepositRepository,
      controllerWarningPixDevolutionEventEmitter,
      depositRepository,
    );
  }

  async execute(
    request: HandleCreateWarningPixDevolutionEventRequest,
  ): Promise<HandleCreateWarningPixDevolutionEventResponse> {
    this.logger.debug('Handle create event by ID request.', { request });

    const { id, warningPixId } = request;

    const warningPixDevolution = await this.usecase.execute(id, warningPixId);

    if (!warningPixDevolution) return null;

    const response = new HandleCreateWarningPixDevolutionEventResponse({
      id: warningPixDevolution.id,
      state: warningPixDevolution.state,
      createdAt: warningPixDevolution.createdAt,
    });

    this.logger.info('Handle create event by ID response.', {
      warningPixDevolution: response,
    });

    return response;
  }
}
