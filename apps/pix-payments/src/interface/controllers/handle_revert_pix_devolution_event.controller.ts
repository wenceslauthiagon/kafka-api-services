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
import { Wallet } from '@zro/operations/domain';
import {
  PixDepositRepository,
  PixDevolution,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  HandleRevertPixDevolutionEventUseCase as UseCase,
  OperationService,
  PixDevolutionEvent,
} from '@zro/pix-payments/application';
import {
  PixDevolutionEventEmitterController,
  PixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandleRevertPixDevolutionEventRequest = Pick<
  PixDevolutionEvent,
  'id' | 'state' | 'chargebackReason' | 'failed'
> & { userId: UserId; walletId: WalletId };

export class HandleRevertPixDevolutionEventRequest
  extends AutoValidator
  implements THandleRevertPixDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  chargebackReason?: string;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  constructor(props: THandleRevertPixDevolutionEventRequest) {
    super(props);
  }
}

type THandleRevertPixDevolutionEventResponse = Pick<
  PixDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandleRevertPixDevolutionEventResponse
  extends AutoValidator
  implements THandleRevertPixDevolutionEventResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandleRevertPixDevolutionEventResponse) {
    super(props);
  }
}

export class HandleRevertPixDevolutionEventController {
  /**
   * Handler triggered when an revert is thrown.
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
    depositRepository: PixDepositRepository,
    eventEmitter: PixDevolutionEventEmitterControllerInterface,
    operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: HandleRevertPixDevolutionEventController.name,
    });

    const controllerEventEmitter = new PixDevolutionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      devolutionRepository,
      depositRepository,
      controllerEventEmitter,
      operationService,
    );
  }

  async execute(
    request: HandleRevertPixDevolutionEventRequest,
  ): Promise<HandleRevertPixDevolutionEventResponse> {
    this.logger.debug('Handle revert event by ID request.', { request });

    const { id, chargebackReason, failed } = request;

    const devolution = await this.usecase.execute(id, chargebackReason, failed);

    if (!devolution) return null;

    const response = new HandleRevertPixDevolutionEventResponse({
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
