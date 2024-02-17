import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';
import {
  HandleCreateFailedPixDevolutionEventUseCase as UseCase,
  PixDevolutionEvent,
} from '@zro/pix-payments/application';
import {
  PixDepositRepository,
  PixDeposit,
  PixDevolution,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  PixDevolutionEventEmitterController,
  PixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type PixDepositId = PixDeposit['id'];
type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandleCreateFailedPixDevolutionEventRequest = Pick<
  PixDevolutionEvent,
  'id' | 'state'
> & { pixDepositId: PixDepositId; userId: UserId; walletId: WalletId };

export class HandleCreateFailedPixDevolutionEventRequest
  extends AutoValidator
  implements THandleCreateFailedPixDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsUUID(4)
  pixDepositId: PixDepositId;

  constructor(props: THandleCreateFailedPixDevolutionEventRequest) {
    super(props);
  }
}

type THandleCreateFailedPixDevolutionEventResponse = Pick<
  PixDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandleCreateFailedPixDevolutionEventResponse
  extends AutoValidator
  implements THandleCreateFailedPixDevolutionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleCreateFailedPixDevolutionEventResponse) {
    super(props);
  }
}

export class HandleCreateFailedPixDevolutionEventController {
  /**
   * Handler triggered when pixDevolution was notified completion successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param pixDevolutionRepository Pix Devolution Repository.
   * @param pixDepositRepository Pix Deposit Repository.
   * @param servicePixDevolutionEventEmitter Pix Devolution Event Emitter Controller Interface.
   */
  constructor(
    private logger: Logger,
    pixDevolutionRepository: PixDevolutionRepository,
    pixDepositRepository: PixDepositRepository,
    servicePixDevolutionEventEmitter: PixDevolutionEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandleCreateFailedPixDevolutionEventController.name,
    });

    const controllerPixDevolutionEventEmitter =
      new PixDevolutionEventEmitterController(servicePixDevolutionEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixDevolutionRepository,
      pixDepositRepository,
      controllerPixDevolutionEventEmitter,
    );
  }

  async execute(
    request: HandleCreateFailedPixDevolutionEventRequest,
  ): Promise<HandleCreateFailedPixDevolutionEventResponse> {
    this.logger.debug('Handle create event by ID request.', { request });

    const { id, pixDepositId } = request;

    const pixDevolution = await this.usecase.execute(id, pixDepositId);

    if (!pixDevolution) return null;

    const response = new HandleCreateFailedPixDevolutionEventResponse({
      id: pixDevolution.id,
      state: pixDevolution.state,
      createdAt: pixDevolution.createdAt,
    });

    this.logger.info('Handle create event by ID response.', {
      pixDevolution: response,
    });

    return response;
  }
}
