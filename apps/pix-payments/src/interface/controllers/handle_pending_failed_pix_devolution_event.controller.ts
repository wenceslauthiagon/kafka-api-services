import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Wallet } from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import {
  HandlePendingFailedPixDevolutionEventUseCase as UseCase,
  PixDevolutionEvent,
  PixPaymentGateway,
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

type THandlePendingFailedPixDevolutionEventRequest = Pick<
  PixDevolutionEvent,
  'id' | 'state'
> & { userId: UserId; walletId: WalletId };

export class HandlePendingFailedPixDevolutionEventRequest
  extends AutoValidator
  implements THandlePendingFailedPixDevolutionEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  constructor(props: THandlePendingFailedPixDevolutionEventRequest) {
    super(props);
  }
}

type THandlePendingFailedPixDevolutionEventResponse = Pick<
  PixDevolution,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingFailedPixDevolutionEventResponse
  extends AutoValidator
  implements THandlePendingFailedPixDevolutionEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixDevolutionState)
  state!: PixDevolutionState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandlePendingFailedPixDevolutionEventResponse) {
    super(props);
  }
}

export class HandlePendingFailedPixDevolutionEventController {
  /**
   * Handler triggered when failed pix devolution was added successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param devolutionRepository PixDevolution repository.
   * @param depositRepository PixDeposit repository.
   * @param eventEmitter PixDevolution event emitter.
   * @param pspGateway PixDevolution psp gateway.
   */
  constructor(
    private logger: Logger,
    devolutionRepository: PixDevolutionRepository,
    depositRepository: PixDepositRepository,
    eventEmitter: PixDevolutionEventEmitterControllerInterface,
    pspGateway: PixPaymentGateway,
  ) {
    this.logger = logger.child({
      context: HandlePendingFailedPixDevolutionEventController.name,
    });

    const controllerEventEmitter = new PixDevolutionEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      devolutionRepository,
      depositRepository,
      pspGateway,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandlePendingFailedPixDevolutionEventRequest,
  ): Promise<HandlePendingFailedPixDevolutionEventResponse> {
    this.logger.debug('Handle pending failed devolution event by ID request.', {
      request,
    });

    const { id } = request;

    const devolution = await this.usecase.execute(id);

    if (!devolution) return null;

    const response = new HandlePendingFailedPixDevolutionEventResponse({
      id: devolution.id,
      state: devolution.state,
      createdAt: devolution.createdAt,
    });

    this.logger.info(
      'Handle pending failed pix devolution event by ID response.',
      { devolution: response },
    );

    return response;
  }
}
