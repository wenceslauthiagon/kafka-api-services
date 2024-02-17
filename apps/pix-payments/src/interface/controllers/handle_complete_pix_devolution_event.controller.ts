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
import { Wallet } from '@zro/operations/domain';
import {
  HandleCompletePixDevolutionEventUseCase as UseCase,
  OperationService,
  PixDevolutionEvent,
} from '@zro/pix-payments/application';
import {
  PixDepositRepository,
  PixDevolution,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  PixDevolutionEventEmitterController,
  PixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandleCompletePixDevolutionEventRequest = Pick<
  PixDevolutionEvent,
  'id' | 'state' | 'endToEndId'
> & { userId: UserId; walletId: WalletId };

export class HandleCompletePixDevolutionEventRequest
  extends AutoValidator
  implements THandleCompletePixDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId?: string;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  constructor(props: THandleCompletePixDevolutionEventRequest) {
    super(props);
  }
}

type THandleCompletePixDevolutionEventResponse = Pick<
  PixDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandleCompletePixDevolutionEventResponse
  extends AutoValidator
  implements THandleCompletePixDevolutionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleCompletePixDevolutionEventResponse) {
    super(props);
  }
}

export class HandleCompletePixDevolutionEventController {
  /**
   * Handler triggered when pixDevolution was notified completion successfully.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param devolutionRepository PixDevolution repository.
   * @param eventEmitter PixDevolution event emitter.
   * @param operationService Operation service.
   */
  constructor(
    private logger: Logger,
    devolutionRepository: PixDevolutionRepository,
    eventEmitter: PixDevolutionEventEmitterControllerInterface,
    operationService: OperationService,
    depositRepository: PixDepositRepository,
    pixSendDevolutionOperationTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandleCompletePixDevolutionEventController.name,
    });

    const controllerEventEmitter = new PixDevolutionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      devolutionRepository,
      controllerEventEmitter,
      operationService,
      depositRepository,
      pixSendDevolutionOperationTransactionTag,
    );
  }

  async execute(
    request: HandleCompletePixDevolutionEventRequest,
  ): Promise<HandleCompletePixDevolutionEventResponse> {
    this.logger.debug('Handle complete event by ID request.', { request });

    const { id, endToEndId } = request;

    const devolution = await this.usecase.execute(id, endToEndId);

    if (!devolution) return null;

    const response = new HandleCompletePixDevolutionEventResponse({
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
